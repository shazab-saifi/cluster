import { prisma } from "@workspace/db";

export interface NotificationType {
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

export async function createNotification(notification: NotificationType) {
  await prisma.notification.create({
    data: { ...notification, isRead: false },
  });
}
