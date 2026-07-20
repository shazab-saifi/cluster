import { prisma } from "@workspace/db";
import { publisher, redisClient } from "@workspace/redis";
import os from "os";

const MAX_BATCH_SIZE = 100;
const FLUSH_DELAY_MS = 350;

type BufferedMessage = {
  redisId: string;
  data: {
    id: string;
    senderId: string;
    channelId: string;
    message: string;
    attachment?: string;
    timestamp: string;
  };
};

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
        await prisma.message.createMany({
          data: batch.map(({ data }) => data),
          skipDuplicates: true,
        });

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
      const response = await redisClient.xReadGroup(
        "message-workers",
        workerName,
        { key: "message:stream", id: ">" },
        { COUNT: 100, BLOCK: 3000 }
      );

      if (response && response[0]) {
        for (const redidMsg of response[0].messages) {
          switch (redidMsg.message.type) {
            case "NEW_MESSAGE": {
              const mapMessage = {
                redisId: redidMsg.id,
                data: {
                  id: redidMsg.message.id as string,
                  senderId: redidMsg.message.senderId as string,
                  channelId: redidMsg.message.channelId as string,
                  message: redidMsg.message.message as string,
                  attachment: redidMsg.message.attachment,
                  timestamp: redidMsg.message.timestamp as string,
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
            case "EDIT_MESSAGE": {
              await prisma.message.update({
                where: { id: redidMsg.message.id },
                data: {
                  message: redidMsg.message.editedMsg,
                },
              });

              await publisher.publish(
                "message-actions",
                JSON.stringify({
                  type: "Success",
                  message: `Updated message to "${redidMsg.message.editedMsg}"`,
                })
              );

              await redisClient.xAck(
                "message:stream",
                "message-workers",
                redidMsg.id
              );
              break;
            }
            case "DELETE_MESSAGE":
              await prisma.message.delete({
                where: { id: redidMsg.message.id },
              });

              await publisher.publish(
                "message-actions",
                JSON.stringify({
                  type: "Success",
                  message: "Delete message",
                })
              );

              await redisClient.xAck(
                "message:stream",
                "message-workers",
                redidMsg.id
              );
              break;
            default:
              console.error("Invalid message message type detected");
              await redisClient.xAck(
                "message:stream",
                "message-workers",
                redidMsg.id
              );
              break;
          }
        }
      }
    } catch (error) {
      console.error(error);
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
