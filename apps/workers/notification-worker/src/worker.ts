import {
  createManyNotification,
  NotificationType,
} from "@workspace/core/services/notification-services";
import { publisher, redisClient } from "@workspace/redis";
import os from "os";
import { z } from "zod";

const NotificationSchema = z.object({
  type: z.enum(["FRIEND_REQUEST", "MENTION", "REACTION"]),
  actorId: z.uuid(),
  userId: z.uuid(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  data: z.unknown().nullable().optional(),
});

async function notificationWorker() {
  while (true) {
    const workerName = `${os.hostname()}:${process.pid}`;
    const structuredNotif: NotificationType[] = [];
    const notificationIds: string[] = [];

    try {
      const notifications = await redisClient.xReadGroup(
        "notification-group",
        workerName,
        { key: "notification:stream", id: ">" },
        { COUNT: 10, BLOCK: 5000 }
      );

      if (!notifications?.length) {
        continue;
      }

      for (const notification of notifications) {
        for (const message of notification.messages) {
          const parsedMessage = NotificationSchema.safeParse(message);

          if (!parsedMessage.success) {
            console.error(
              "Poison pill or schema mismatch detected:",
              parsedMessage.error
            );
            continue;
          }

          publisher.publish("notification", JSON.stringify(parsedMessage.data));
          structuredNotif.push({
            type: parsedMessage.data.type,
            actorId: parsedMessage.data.actorId,
            userId: parsedMessage.data.userId,
            entityType: parsedMessage.data.entityType ?? null,
            entityId: parsedMessage.data.entityId ?? null,
            data: parsedMessage.data.data ?? null,
          });
          notificationIds.push(message.id);
        }
      }

      await createManyNotification(structuredNotif);
      await redisClient.xAck(
        "notification:stream",
        "notification-group",
        notificationIds
      );
    } catch (error) {
      console.error(error);
    }
  }
}

async function ensureConsumerGroup() {
  try {
    await redisClient.xGroupCreate(
      "notification:stream",
      "notification-group",
      "$",
      {
        MKSTREAM: true,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes("BUSYGROUP")) {
      throw error;
    }
  }
}

try {
  await notificationWorker();
  await ensureConsumerGroup();
  console.log("Notification worker is running");
} catch (error) {
  console.error(error);
  process.exit(1);
}
