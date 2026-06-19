import { publisher, redisClient } from "@workspace/redis";
import os from "os";
import { z } from "zod";

const NotificationSchema = z.object({
  type: z.enum(["FRIEND_REQUEST", "ACCEPTED_REQUEST"]),
  senderId: z.uuid(),
  receiverId: z.uuid(),
});

async function notificationWorker() {
  while (true) {
    const workerName = `${os.hostname()}:${process.pid}`;

    try {
      const notifications = await redisClient.xReadGroup(
        "notif-group",
        workerName,
        { key: "notif:stream", id: ">" },
        { COUNT: 10, BLOCK: 10000 }
      );

      for (const notification of notifications || []) {
        for (const message of notification.messages) {
          const parsedMessage = NotificationSchema.safeParse(message);

          if (!parsedMessage.success) {
            console.error(
              "Poison pill or schema mismatch detected:",
              parsedMessage.error
            );
          }

          publisher.publish("notification", JSON.stringify(parsedMessage));
        }
      }
      console.log(notifications);
    } catch (error) {
      console.error(error);
    }
  }
}

async function ensureConsumerGroup() {
  try {
    await redisClient.xGroupCreate("stream:notif", "notif-group", "$", {
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
  notificationWorker();
  ensureConsumerGroup();
} catch (error) {
  console.error(error);
  process.exit(1);
}
