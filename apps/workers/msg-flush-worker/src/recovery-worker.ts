import {
  createMessage,
  deleteMessage,
  Prisma,
  updateMessage,
} from "@workspace/core/services/messages-services";
import { publisher, redisClient } from "@workspace/redis";
import { buildErrorPayload, normalizeError } from "@workspace/core/errors";

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
      try {
        switch (msgEvent?.message.type) {
          case "NEW_MESSAGE": {
            const messagePayload = {
              id: msgEvent.message.id as string,
              senderId: msgEvent.message.senderId as string,
              channelId: msgEvent.message.channelId as string,
              message: msgEvent.message.message as string,
              attachment: msgEvent.message.attachment ?? null,
              timestamp: msgEvent.message.timestamp as unknown as Date,
            };

            await createMessage(messagePayload);

            await redisClient.xAck(
              "message:stream",
              "message-workers",
              msgEvent.id
            );
            break;
          }
          case "EDIT_MESSAGE":
            await updateMessage({
              messageId: msgEvent.message.messageId as string,
              editedMsg: msgEvent.message.editedMsg as string,
            });

            await redisClient.xAck(
              "message:stream",
              "message-workers",
              msgEvent.id
            );
            break;
          case "DELETE_MESSAGE":
            await deleteMessage(msgEvent.message.id as string);

            await redisClient.xAck(
              "message:stream",
              "message-workers",
              msgEvent.id
            );
            break;
          default:
            throw new Error(`Invalid message event type detected: ${msgEvent}`);
        }
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          await publisher.publish(
            "flush-worker-events",
            JSON.stringify({
              type: msgEvent?.message.type,
              status: "FAILED",
              senderId: msgEvent?.message.senderId,
              message: msgEvent?.message.meessage,
              error: buildErrorPayload(normalizeError(error)),
            })
          );
        }

        console.log("Failed to execute event: ", error);
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
