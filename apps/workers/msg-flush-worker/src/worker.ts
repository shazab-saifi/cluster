import { redisClient } from "@workspace/redis";
import os from "os";
import {
  BufferedMessage,
  createManyMessages,
  deleteMessage,
  updateMessage,
} from "@workspace/core/services/messages-services";

const MAX_BATCH_SIZE = 100;
const FLUSH_DELAY_MS = 350;

async function MsgFlushWorker() {
  const workerName = `${os.hostname()}:${process.pid}`;
  const buffer: BufferedMessage[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  let flushInProgress: Promise<void> | undefined;

  function scheduleFlush() {
    if (flushTimer || buffer.length === 0) return;

    flushTimer = setTimeout(() => {
      flushTimer = undefined;
      void flush().catch((error) =>
        console.error("Message flush failed: ", error)
      );
    }, FLUSH_DELAY_MS);
  }

  async function flush(): Promise<void> {
    if (flushInProgress) return flushInProgress;

    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = undefined;
    }

    flushInProgress = (async () => {
      const batch = buffer.splice(0, MAX_BATCH_SIZE);
      if (batch.length === 0) return;

      try {
        await createManyMessages(batch.map(({ data }) => data));
        await redisClient.xAck(
          "message:stream",
          "message-workers",
          batch.map(({ redisId }) => redisId)
        );
      } catch (error) {
        buffer.unshift(...batch);
        throw error;
      }
    })();

    try {
      await flushInProgress;
    } finally {
      flushInProgress = undefined;
      if (buffer.length > 0) scheduleFlush();
    }
  }

  while (true) {
    try {
      const messageEvents = await redisClient.xReadGroup(
        "message-workers",
        workerName,
        { key: "message:stream", id: ">" },
        { COUNT: MAX_BATCH_SIZE, BLOCK: 3000 }
      );

      if (!messageEvents?.[0]) continue;

      for (const msgEvent of messageEvents[0].messages) {
        try {
          switch (msgEvent.message.type) {
            case "NEW_MESSAGE":
              buffer.push({
                redisId: msgEvent.id,
                data: {
                  id: msgEvent.message.messageId as string,
                  senderId: msgEvent.message.senderId as string,
                  channelId: msgEvent.message.channelId as string,
                  message: msgEvent.message.message as string,
                  attachment: msgEvent.message.attachment ?? null,
                  timestamp: msgEvent.message.timestamp as unknown as Date,
                },
              });

              if (buffer.length >= MAX_BATCH_SIZE) {
                await flush();
              } else {
                scheduleFlush();
              }

              // The batch flush ACKs this event only after the DB write succeeds.
              continue;
            case "EDIT_MESSAGE":
              await updateMessage({
                messageId: msgEvent.message.messageId as string,
                editedMessage: msgEvent.message.editedMessage as string,
              });
              break;
            case "DELETE_MESSAGE":
              await deleteMessage(msgEvent.message.messageId as string);
              break;
            default:
              throw new Error(
                `Invalid message event type: ${msgEvent.message.type}`
              );
          }

          await redisClient.xAck(
            "message:stream",
            "message-workers",
            msgEvent.id
          );
        } catch (error) {
          // Leave the event in the PEL for the recovery worker.
          console.error("Failed to execute message event: ", error);
        }
      }
    } catch (error) {
      console.error("Could not read message stream: ", error);
    }
  }
}

async function ensureConsumerGroup() {
  try {
    await redisClient.xGroupCreate("message:stream", "message-workers", "$", {
      MKSTREAM: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("BUSYGROUP")) throw error;
  }
}

try {
  await ensureConsumerGroup();
  await MsgFlushWorker();
} catch (error) {
  console.error("flush worker startup failed", error);
  process.exit(1);
}
