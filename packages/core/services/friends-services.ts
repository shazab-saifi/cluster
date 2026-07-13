import { prisma } from "@workspace/db";
import { redisClient } from "@workspace/redis";

export async function getAllFriends(userId: string) {
  return await prisma.friendship.findMany({
    where: { senderId: userId, receiverId: userId, status: "ACCEPTED" },
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
