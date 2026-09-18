import {
  upsertNotification,
  NotificationType,
} from "@workspace/core/services/notification-services";
import { publisher, redisClient } from "@workspace/redis";
import { z } from "zod";

const RECOVERY_MIN_IDLE_MS = 1000;
const RECOVERY_DELAY_MS = 30000;

const NotificationSchema = z.object({
  type: z.enum(["FRIEND_REQUEST", "MENTION", "REACTION"]),
  actorId: z.uuid(),
  userId: z.uuid(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  data: z.unknown().nullable().optional(),
});

async function notificationRecovery() {
  while (true) {
    try {
      const pendingNotifications = await redisClient.XAUTOCLAIM(
        "notification:stream",
        "notification-group",
        "notification-recovery-worker",
        RECOVERY_MIN_IDLE_MS,
        "0-0"
      );

      for (const notification of pendingNotifications.messages) {
        if (!notification) continue;
        try {
          const parsedMessage = NotificationSchema.safeParse(
            notification.message
          );

          if (!parsedMessage.success) {
            console.error(
              "Poison pill or schema mismatch detected:",
              parsedMessage.error
            );
            await redisClient.xAck(
              "notification:stream",
              "notification-group",
              notification.id
            );
            continue;
          }

          let data = parsedMessage.data.data ?? null;
          if (typeof data === "string") {
            try {
              data = JSON.parse(data);
            } catch (error) {
              console.error(
                "Poison pill: invalid JSON in data field detected:",
                error
              );
              await redisClient.xAck(
                "notification:stream",
                "notification-group",
                notification.id
              );
              continue;
            }
          }

          const structuredNotif: NotificationType = {
            type: parsedMessage.data.type,
            actorId: parsedMessage.data.actorId,
            userId: parsedMessage.data.userId,
            entityType: parsedMessage.data.entityType ?? null,
            entityId: parsedMessage.data.entityId ?? null,
            data,
          };

          const created = await upsertNotification(structuredNotif);
          await publisher.publish(
            "persisted-notification-events",
            JSON.stringify(created)
          );

          await redisClient.xAck(
            "notification:stream",
            "notification-group",
            notification.id
          );
        } catch (error) {
          // Keep failed events in the PEL for a later recovery attempt.
          console.error("Failed to recover notification event: ", error);
        }
      }
    } catch (error) {
      console.error("Could not claim pending notification events: ", error);
    }

    await Bun.sleep(RECOVERY_DELAY_MS);
  }
}

try {
  await notificationRecovery();
} catch (error) {
  console.error("notification recovery worker startup failed", error);
  process.exit(1);
}
