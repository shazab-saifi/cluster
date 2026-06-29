import { prisma } from "@workspace/db";

export async function getAllFriends(userId: string) {
  return await prisma.friendship.findMany({
    where: { senderId: userId, receiverId: userId, status: "ACCEPTED" },
  });
}

export async function addFriend(userId: string, friendId: string) {
  return await prisma.friendship.create({
    data: {
      senderId: userId,
      receiverId: friendId,
      status: "PENDING",
    },
  });
}
