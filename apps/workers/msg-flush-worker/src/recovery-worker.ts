import { prisma } from "@workspace/db";
import { redisClient } from "@workspace/redis";

async function messageRecovery() {
  while (true) {
    const pendingMsgEvents = await redisClient.XAUTOCLAIM(
      "meessage:stream",
      "message-workers",
      "recovery-worker",
      30000,
      "0-0"
    );

    if (pendingMsgEvents.messages.length === 0) {
      await Bun.sleep(30000);
      continue;
    }

    for (const msgEvent of pendingMsgEvents.messages) {
      switch (msgEvent?.message.type) {
        case "NEW_MESSAGE":
          await prisma.message.create({
            data: {
              id: msgEvent.message.id as string,
              senderId: msgEvent.message.senderId as string,
              channelId: msgEvent.message.channelId,
              message: msgEvent.message.message as string,
              attachment: msgEvent.message.attachment,
              timestamp: msgEvent.message.timestamp,
            },
          });

          await redisClient.xAck(
            "message:stream",
            "message-workers",
            msgEvent.id
          );
          break;
        case "EDIT_MESSAGE":
          await prisma.message.update({
            where: { id: msgEvent.message.id },
            data: {
              message: msgEvent.message.editedMsg,
            },
          });

          await redisClient.xAck(
            "message:stream",
            "message-workers",
            msgEvent.id
          );
          break;
        case "DELETE_MESSAGE":
          await prisma.message.delete({
            where: { id: msgEvent.message.id },
          });

          await redisClient.xAck(
            "message:stream",
            "message-workers",
            msgEvent.id
          );
          break;
        default:
          throw new Error(`Invalid message event type detected: ${msgEvent}`);
      }
    }

    try {
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
