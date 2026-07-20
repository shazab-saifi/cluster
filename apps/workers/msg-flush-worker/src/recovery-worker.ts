import { prisma } from "@workspace/db";
import { redisClient } from "@workspace/redis";

let messageIds: string[] = [];

async function messageRecovery() {
  while (true) {
    const pendingMessages = await redisClient.XAUTOCLAIM(
      "event:stream",
      "event-workers",
      "recovery-worker",
      30000,
      "0-0"
    );

    if (pendingMessages.messages.length === 0) {
      await Bun.sleep(30000);
      continue;
    }

    const ids = pendingMessages.messages.map(
      (message) => message?.id as string
    );

    messageIds.push(...ids);

    try {
      await prisma.message.createMany({
        data: pendingMessages.messages.map((message) => ({
          id: message?.message.id as string,
          senderId: message?.message.senderId as string,
          channelId: message?.message.channelId,
          message: message?.message.message as string,
          attachment: message?.message.attachment,
          sentAt: message?.message.timestamp,
        })),
        skipDuplicates: true,
      });

      await redisClient.xAck("event:stream", "event-workers", messageIds);

      messageIds = [];
      await Bun.sleep(30000);
    } catch (error) {
      console.error(error);
    }
  }
}

try {
  await messageRecovery();
} catch (error) {
  console.error("flush recovery worker startup failed", error);
}
