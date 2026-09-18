import { Notification, prisma } from "@workspace/db";
import { redisClient } from "@workspace/redis";

export type NotificationEvent = {
  id: string;
  type: "FRIEND_REQUEST" | "MENTION" | "REACTION";
  actorId: string;
  userId: string;
  entityType: string | null;
  entityId: string | null;
  data: unknown;
  createdAt: Date;
  actor: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
};

export async function getNotifications(userId: string, cursor?: string) {
  const take = 10;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    take: take + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      actorId: true,
      userId: true,
      entityType: true,
      entityId: true,
      data: true,
      createdAt: true,
      actor: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  let nextCursor: string | null = null;
  if (notifications.length > take) {
    const nextItem = notifications.pop();
    nextCursor = nextItem ? nextItem.id : null;
  }

  return { notifications, nextCursor };
}

export type NotificationType = Omit<
  Notification,
  "id" | "createdAt" | "read" | "data"
> & {
  data?: any;
};

export async function upsertNotification(data: NotificationType) {
  return prisma.notification.upsert({
    where: {
      actorId_userId: { actorId: data.actorId, userId: data.userId },
    },
    create: {
      type: data.type,
      actorId: data.actorId,
      userId: data.userId,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      data: data.data ?? null,
    },
    update: {
      type: data.type,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      data: data.data ?? null,
      read: false,
      createdAt: new Date(),
    },
    select: {
      id: true,
      type: true,
      actorId: true,
      userId: true,
      entityType: true,
      entityId: true,
      data: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  });
}

export async function createNotificationEvent(payload: NotificationType) {
  const redisPayload: Record<string, string> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === "object") {
      redisPayload[key] = JSON.stringify(value);
    } else {
      redisPayload[key] = String(value);
    }
  }

  await redisClient.xAdd("notification:stream", "*", redisPayload);
}
