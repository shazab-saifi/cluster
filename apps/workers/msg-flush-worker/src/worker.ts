import { prisma } from "@workspace/db";
import { redisClient } from "@workspace/redis";
import os from "os";

let batchStartedAt: number | null = null;
let buffer: {
  id: string;
  senderId: string;
  channelId: string;
  message: string;
}[] = [];

let messageIds: string[] = [];

async function batchMessage() {
  while (true) {
    const workerName = `${os.hostname()}:${process.pid}`;

    try {
      const response = await redisClient.xReadGroup(
        "chat-workers",
        workerName,
        { key: "chat-stream", id: ">" },
        { COUNT: 10, BLOCK: 5000 }
      );

      if (response && response[0] && buffer.length < 100) {
        const mapMessages = response[0].messages.map((message) => ({
          id: message.id,
          senderId: message.message.senderId as string,
          channelId: message.message.channelId as string,
          message: message.message.content as string,
        }));

        if (buffer.length === 0 && mapMessages.length > 0) {
          batchStartedAt = Date.now();
        }

        buffer.push(...mapMessages);

        const ids = response[0].messages.map((message) => {
          return message.id;
        });

        messageIds.push(...ids);
      }

      const intervalElapsed =
        batchStartedAt !== null && Date.now() - batchStartedAt >= 5000;

      if (buffer.length > 0 && (intervalElapsed || buffer.length >= 100)) {
        await prisma.message.createMany({
          data: buffer,
          skipDuplicates: true,
        });

        await redisClient.xAck("chat-stream", "chat-workers", messageIds);
        buffer = [];
        messageIds = [];
        batchStartedAt = null;
      }
    } catch (error) {
      console.error(error);
    }
  }
}

async function ensureConsumerGroup() {
  try {
    await redisClient.xGroupCreate("chat-stream", "chat-workers", "$", {
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
  await batchMessage();
} catch (error) {
  console.error("flush worker startup failed", error);
  process.exit(1);
}
