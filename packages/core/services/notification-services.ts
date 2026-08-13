import { prisma } from "@workspace/db";
import { publisher } from "@workspace/redis";
import { BadRequestError } from "@workspace/core/errors";

export interface NotificationType {
  eventType: "NOTIFICATION";
  type: "FRIEND_REQUEST" | "ACCEPTED_REQUEST";
  senderId: string;
  receiverId: string;
}

export async function createManyNotification(
  notifications: NotificationType[]
) {
  await prisma.notification.createMany({
    data: notifications.map((notif) => ({
      ...notif,
      isRead: false,
    })),
  });
}

export async function getNotifications(userId: string, cursor: string) {
  const firstPage = await prisma.notification.findMany({
    where: { receiverId: userId },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const lastPage = firstPage[firstPage.length - 1];
  const nextPage = firstPage
    ? await prisma.notification.findMany({
        where: { receiverId: userId },
        take: 10,
        cursor: { id: cursor },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return { nextPage, lastPage };
}

export async function createNotification(notification: NotificationType) {
  const [sender, receiver] = await Promise.all([
    prisma.user.findUnique({ where: { id: notification.senderId } }),
    prisma.user.findUnique({ where: { id: notification.receiverId } }),
  ]);

  if (!sender) {
    throw new BadRequestError(
      "Invalid senderId",
      "Sender user does not exist."
    );
  }
  if (!receiver) {
    throw new BadRequestError(
      "Invalid receiverId",
      "Receiver user does not exist."
    );
  }

  await prisma.notification.create({
    data: {
      type: notification.type,
      senderId: notification.senderId,
      receiverId: notification.receiverId,
    },
  });
}

export async function publishNotification(notification: NotificationType) {
  await publisher.publish(
    "persisted-notification-event",
    JSON.stringify(notification)
  );
}
