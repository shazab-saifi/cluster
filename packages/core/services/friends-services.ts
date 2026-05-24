import { prisma } from "@workspace/db";

export async function getAllFriends(userId: string) {
  return await prisma.friendship.findMany({
    where: { senderId: userId, receiverId: userId, status: "ACCEPTED" },
  });
}
