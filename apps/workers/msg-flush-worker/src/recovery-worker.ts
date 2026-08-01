import {
  createManyMessages,
  deleteMessage,
  updateMessage,
} from "@workspace/core/services/messages-services";
import { redisClient } from "@workspace/redis";

const RECOVERY_MIN_IDLE_MS = 1000;
const RECOVERY_DELAY_MS = 30000;

async function messageRecovery() {
  while (true) {
    try {
      const pendingMsgEvents = await redisClient.XAUTOCLAIM(
        "message:stream",
        "message-workers",
        "recovery-worker",
        RECOVERY_MIN_IDLE_MS,
        "0-0"
      );

      for (const msgEvent of pendingMsgEvents.messages) {
        if (!msgEvent) continue;
        try {
          switch (msgEvent.message.type) {
            case "NEW_MESSAGE":
              await createManyMessages([
                {
                  id: msgEvent.message.messageId as string,
                  senderId: msgEvent.message.senderId as string,
                  channelId: msgEvent.message.channelId as string,
                  message: msgEvent.message.message as string,
                  attachment: msgEvent.message.attachment ?? null,
                  timestamp: msgEvent.message.timestamp as unknown as Date,
                },
              ]);
              break;
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
          // Keep failed events in the PEL for a later recovery attempt.
          console.error("Failed to recover message event: ", error);
        }
      }
    } catch (error) {
      console.error("Could not claim pending message events: ", error);
    }

    await Bun.sleep(RECOVERY_DELAY_MS);
  }
}

try {
  await messageRecovery();
} catch (error) {
  console.error("flush recovery worker startup failed", error);
  process.exit(1);
}
