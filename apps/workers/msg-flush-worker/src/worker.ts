import { publisher, redisClient } from "@workspace/redis";
import os from "os";
import {
  BufferedMessage,
  createManyMessages,
  deleteMessage,
  Prisma,
  updateMessage,
} from "@workspace/core/services/messages-services";
import { buildErrorPayload, normalizeError } from "@workspace/core/errors";

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
        { COUNT: 100, BLOCK: 3000 }
      );

      if (messageEvents && messageEvents[0]) {
        for (const msgEvent of messageEvents[0].messages) {
          try {
            switch (msgEvent.message.type) {
              case "NEW_MESSAGE": {
                const mapMessage = {
                  redisId: msgEvent.id,
                  data: {
                    id: msgEvent.message.messageId as string,
                    senderId: msgEvent.message.senderId as string,
                    channelId: msgEvent.message.channelId as string,
                    message: msgEvent.message.message as string,
                    attachment: msgEvent.message.attachment ?? null,
                    timestamp: msgEvent.message.timestamp as unknown as Date,
                  },
                };

                buffer.push(mapMessage);

                if (buffer.length >= MAX_BATCH_SIZE) {
                  await flush();
                } else {
                  scheduleFlush();
                }

                break;
              }
              case "EDIT_MESSAGE":
                await updateMessage({
                  messageId: msgEvent.message.messageId as string,
                  editedMessage: msgEvent.message.editedMessage as string,
                });

                await publisher.publish(
                  "flush-worker-events",
                  JSON.stringify({
                    type: "EDIT_MESSAGE",
                    status: "Success",
                    senderId: msgEvent.message.senderId,
                    messageId: msgEvent.message.messageId,
                  })
                );

                break;
              case "DELETE_MESSAGE":
                await deleteMessage(msgEvent.message.messageId as string);

                await publisher.publish(
                  "flush-worker-events",
                  JSON.stringify({
                    type: "DELETE_MESSAGE",
                    status: "Success",
                    senderId: msgEvent.message.senderId,
                    messageId: msgEvent.message.messageId,
                  })
                );
                break;
              default:
                console.error(
                  "Invalid message message type detected: ",
                  msgEvent
                );
                break;
            }

            await redisClient.xAck(
              "message:stream",
              "message-workers",
              msgEvent.id
            );
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
              await publisher.publish(
                "flush-worker-events",
                JSON.stringify({
                  type: msgEvent.message.type,
                  status: "FAILED",
                  senderId: msgEvent.message.senderId,
                  messageId: msgEvent.message.messageId,
                  error: buildErrorPayload(normalizeError(error)),
                })
              );
            }

            console.log("Failed to execute event: ", error);
          }
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (!message.includes("BUSYGROUP")) {
      throw err;
    }
  }
}

try {
  await ensureConsumerGroup();
  await MsgFlushWorker();
} catch (error) {
  console.error("flush worker startup failed", error);
  process.exit(1);
}
