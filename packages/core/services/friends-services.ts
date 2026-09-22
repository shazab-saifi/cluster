import { prisma } from "@workspace/db";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors";

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

export async function getIncomingFriendRequests(userId: string) {
  return prisma.friendship.findMany({
    where: {
      status: "PENDING",
      receiverId: userId,
    },
    include: {
      sender: {
        select: { id: true, name: true, username: true, image: true },
      },
      receiver: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOutgoingFriendRequests(userId: string) {
  return prisma.friendship.findMany({
    where: {
      status: "PENDING",
      senderId: userId,
    },
    include: {
      sender: {
        select: { id: true, name: true, username: true, image: true },
      },
      receiver: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function removeFriendRequest(
  friendshipId: string,
  userId: string
) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    throw new NotFoundError(
      "Friend request not found.",
      "The friend request may have been revoked or already removed."
    );
  }

  if (friendship.senderId !== userId && friendship.receiverId !== userId) {
    throw new ForbiddenError(
      "You can only cancel or decline your own friend requests.",
      "Only the sender can cancel a request, and only the recipient can decline it."
    );
  }

  if (friendship.status !== "PENDING" && friendship.status !== "ACCEPTED") {
    throw new BadRequestError(
      "This friendship is no longer active.",
      "A friendship can only be removed while pending or accepted."
    );
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });

  return {
    msg:
      friendship.status === "ACCEPTED"
        ? "Friend removed."
        : "Friend request removed.",
  };
}

export async function getFriendProfile(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    throw new NotFoundError(
      "Friendship not found.",
      "This friendship may have been removed."
    );
  }

  if (friendship.senderId !== userId && friendship.receiverId !== userId) {
    throw new ForbiddenError(
      "You can only view your own friendships.",
      "Only the friends involved can see this conversation."
    );
  }

  if (friendship.status !== "ACCEPTED") {
    throw new BadRequestError(
      "This friendship is not accepted yet.",
      "Accept the friend request before viewing profiles."
    );
  }

  const friendId =
    friendship.senderId === userId
      ? friendship.receiverId
      : friendship.senderId;

  const [friend, myMemberships, friendMemberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, name: true, username: true, image: true },
    }),
    prisma.networkMembers.findMany({
      where: { userId },
      select: { networkId: true },
    }),
    prisma.networkMembers.findMany({
      where: { userId: friendId },
      select: { networkId: true },
    }),
  ]);

  if (!friend) {
    throw new NotFoundError(
      "User not found.",
      "This user may no longer be active."
    );
  }

  const myNetworkIds = new Set(
    myMemberships.map((membership) => membership.networkId)
  );
  const mutualNetworkIds = friendMemberships
    .map((membership) => membership.networkId)
    .filter((networkId) => myNetworkIds.has(networkId));

  const mutualNetworks =
    mutualNetworkIds.length > 0
      ? await prisma.network.findMany({
          where: { id: { in: mutualNetworkIds } },
          select: { id: true, name: true, image: true },
        })
      : [];

  return { user: friend, mutualNetworks };
}

export async function createFriendShip(userId: string, friendId: string) {
  if (userId === friendId) {
    throw new BadRequestError(
      "You cannot send a friend request to yourself.",
      "Choose another user to send a friend request to."
    );
  }

  return await prisma.friendship.create({
    data: {
      senderId: userId,
      receiverId: friendId,
      status: "PENDING",
    },
  });
}

export type SearchUserResult = {
  id: string;
  username: string;
  image: string | null;
  status: "FRIENDS" | "PENDING_RECEIVED" | "NONE";
  friendshipId: string | null;
};

export async function findUserbyUsername(
  username: string,
  userId: string
): Promise<SearchUserResult[]> {
  const users = await prisma.user.findMany({
    where: {
      username: {
        startsWith: username,
      },
      id: { not: userId },
    },
    select: {
      id: true,
      username: true,
      image: true,
    },
  });

  if (users.length === 0) return [];

  const userIds = users.map((user) => user.id);

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: { in: userIds } },
        { receiverId: userId, senderId: { in: userIds } },
      ],
    },
    select: { id: true, senderId: true, receiverId: true, status: true },
  });

  const infoByUserId = new Map<
    string,
    {
      status: "FRIENDS" | "PENDING_SENT" | "PENDING_RECEIVED";
      friendshipId: string;
    }
  >();

  for (const friendship of friendships) {
    const otherUserId =
      friendship.senderId === userId
        ? friendship.receiverId
        : friendship.senderId;
    const outgoing = friendship.senderId === userId;

    if (friendship.status === "ACCEPTED") {
      infoByUserId.set(otherUserId, {
        status: "FRIENDS",
        friendshipId: friendship.id,
      });
    } else if (friendship.status === "PENDING") {
      infoByUserId.set(otherUserId, {
        status: outgoing ? "PENDING_SENT" : "PENDING_RECEIVED",
        friendshipId: friendship.id,
      });
    }
  }

  return users
    .filter((user) => infoByUserId.get(user.id)?.status !== "PENDING_SENT")
    .map((user) => {
      const info = infoByUserId.get(user.id);
      return {
        id: user.id,
        username: user.username,
        image: user.image,
        status:
          info?.status === "PENDING_SENT" ? "NONE" : (info?.status ?? "NONE"),
        friendshipId: info?.friendshipId ?? null,
      };
    });
}

export async function acceptFriendRequest(
  friendshipId: string,
  userId: string
) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    throw new NotFoundError(
      "Friendship request not found.",
      "The friend request may have been revoked or already removed."
    );
  }

  if (friendship.receiverId !== userId) {
    throw new ForbiddenError(
      "You can only accept friend requests sent to you.",
      "Only the recipient of a friend request can accept it."
    );
  }

  if (friendship.status !== "PENDING") {
    throw new BadRequestError(
      "This friend request is no longer pending.",
      "The request has already been accepted, blocked, or removed."
    );
  }

  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" },
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

export async function getMutualFriends(userA: string, userB: string) {
  const [friendsOfA, friendsOfB] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userA }, { receiverId: userA }],
      },
      select: { senderId: true, receiverId: true },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userB }, { receiverId: userB }],
      },
      select: { senderId: true, receiverId: true },
    }),
  ]);

  const peerIds = (rows: { senderId: string; receiverId: string }[]) =>
    new Set(rows.flatMap((row) => [row.senderId, row.receiverId]));

  const setA = peerIds(friendsOfA);
  setA.delete(userA);
  setA.delete(userB);

  const setB = peerIds(friendsOfB);
  setB.delete(userA);
  setB.delete(userB);

  let count = 0;
  for (const id of setA) {
    if (setB.has(id)) count++;
  }

  return count;
}
