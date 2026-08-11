import { prisma } from "@workspace/db";
import { redisClient } from "@workspace/redis";

export async function getAllFriends(userId: string) {
  return prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: {
        select: { id: true, name: true, username: true, image: true },
      },
      receiver: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });
}

export async function addFriend(userId: string, friendId: string) {
  await redisClient.xAdd(
    "notif:stream",
    "*",
    {
      type: "FRIEND_REQUEST",
      senderId: userId,
      receiverId: friendId,
    },
    {
      TRIM: {
        strategy: "MAXLEN",
        strategyModifier: "~",
        threshold: 10000,
      },
    }
  );

  return await prisma.friendship.create({
    data: {
      senderId: userId,
      receiverId: friendId,
      status: "PENDING",
    },
  });
}

export async function findUserbyUsername(username: string) {
  return await prisma.user.findMany({
    where: {
      username: {
        startsWith: username,
      },
    },
    select: {
      id: true,
      username: true,
      image: true,
    },
  });
}
