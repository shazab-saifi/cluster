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
