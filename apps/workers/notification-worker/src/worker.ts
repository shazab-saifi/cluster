import { createManyNotification } from "@workspace/core/services/notification-services";
import { publisher, redisClient } from "@workspace/redis";
import os from "os";
import { z } from "zod";

const NotificationSchema = z.object({
  type: z.enum(["FRIEND_REQUEST", "ACCEPTED_REQUEST"]),
  senderId: z.uuid(),
  receiverId: z.uuid(),
});

type Notification = z.infer<typeof NotificationSchema>;

async function notificationWorker() {
  while (true) {
    const workerName = `${os.hostname()}:${process.pid}`;
    const structuredNotif: Notification[] = [];
    const notificationIds: string[] = [];

    try {
      const notifications = await redisClient.xReadGroup(
        "notif-group",
        workerName,
        { key: "notif:stream", id: ">" },
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
          }

          publisher.publish("notification", JSON.stringify(parsedMessage.data));
          structuredNotif.push(parsedMessage.data as Notification);
          notificationIds.push(message.id);
        }
      }

      await createManyNotification(structuredNotif);
      await redisClient.xAck("notif:stream", "notif-group", notificationIds);
    } catch (error) {
      console.error(error);
    }
  }
}

async function ensureConsumerGroup() {
  try {
    await redisClient.xGroupCreate("notif:stream", "notif-group", "$", {
      MKSTREAM: true,
    });
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
