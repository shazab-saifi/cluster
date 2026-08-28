import { Notification, prisma } from "@workspace/db";
import { publisher, redisClient } from "@workspace/redis";

export async function getNotifications(userId: string, cursor: string) {
  const firstPage = await prisma.notification.findMany({
    where: { userId: userId },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const lastPage = firstPage[firstPage.length - 1];
  const nextPage = firstPage
    ? await prisma.notification.findMany({
        where: { userId: userId },
        take: 10,
        cursor: { id: cursor },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return { nextPage, lastPage };
}

export type NotificationType = Omit<
  Notification,
  "id" | "createdAt" | "read" | "data"
> & {
  data?: any;
};

export async function createManyNotification(data: NotificationType[]) {
  const notifications = await prisma.notification.createManyAndReturn({
    data,
    select: {
      actor: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      entityId: true,
      entityType: true,
      data: true,
    },
  });

  await publisher.publish(
    "notification.created",
    JSON.stringify(notifications)
  );
}

export async function createNotificationEvent(payload: NotificationType) {
  await redisClient.xAdd(
    "notification:stream",
    "*",
    JSON.parse(JSON.stringify(payload))
  );
}
