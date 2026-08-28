import { prisma } from "@workspace/db";

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

export async function createFriendShip(userId: string, friendId: string) {
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
