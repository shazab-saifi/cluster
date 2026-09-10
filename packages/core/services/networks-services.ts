import { NetworkRole, prisma } from "@workspace/db";
import { ForbiddenError, NotFoundError } from "../errors";
export { NetworkRole };

const ROLE_HIERARCHY: Record<NetworkRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MODERATOR: 1,
  MEMBER: 0,
};

export interface NetworkCreateType {
  name: string;
  type: "PUBLIC" | "PRIVATE";
  image?: string;
  desc?: string;
  ownerId: string;
  channels: {
    name: string;
  };
  members: {
    userId: string;
    role: NetworkRole;
  };
}

export async function createNetwork(userId: string, data: NetworkCreateType) {
  return await prisma.network.create({
    data: {
      name: data.name,
      type: data.type,
      image: data.image,
      desc: data.desc,
      ownerId: userId,
      channels: {
        create: {
          name: data.channels.name,
        },
      },
      members: {
        create: {
          userId: userId,
          role: data.members.role,
        },
      },
    },
  });
}

export async function updateNetworkInfo(
  networkId: string,
  userId: string,
  data: {
    name?: string;
    type?: "PUBLIC" | "PRIVATE";
    image?: string;
    desc?: string;
  }
) {
  await prisma.network.update({
    where: { id: networkId, ownerId: userId },
    data,
  });
}

export async function searchNetworks(query: string) {
  return await prisma.network.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
      type: "PUBLIC",
    },
  });
}

export async function getNetworkById(networkId: string, userId: string) {
  return await prisma.network.findFirst({
    where: {
      id: networkId,
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      channels: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

export async function getNetworkPreview(networkId: string) {
  return prisma.network.findUnique({
    where: { id: networkId },
    include: {
      members: {
        include: {
          user: {
            select: {
              image: true,
            },
          },
        },
        take: 3,
      },
      channels: {
        take: 5,
      },
    },
  });
}

export async function addMember(networkId: string, userId: string) {
  return await prisma.network.update({
    where: { id: networkId },
    data: {
      memberCount: { increment: 1 },
      members: {
        create: {
          userId,
          role: "MEMBER",
        },
      },
    },
  });
}

export async function searchNetworkMembers(
  networkId: string,
  query: string,
  cursor?: string
) {
  const members = await prisma.networkMembers.findMany({
    where: {
      networkId,
      user: {
        username: {
          startsWith: query,
          mode: "insensitive",
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: 50,
  });

  const nextCursor =
    members.length === 50 ? members[members.length - 1]?.id : null;

  return { members, nextCursor };
}

export async function removeMember(networkId: string, userId: string) {
  return await prisma.networkMembers.delete({
    where: {
      userId_networkId: {
        networkId,
        userId,
      },
    },
  });
}

async function fetchAndValidateMemberPair(
  networkId: string,
  requesterId: string,
  targetUserId: string
) {
  const requester = await prisma.networkMembers.findUnique({
    where: {
      userId_networkId: { networkId, userId: requesterId },
    },
  });

  if (!requester) {
    throw new ForbiddenError("You are not a member of this network.");
  }

  const target = await prisma.networkMembers.findUnique({
    where: {
      userId_networkId: { networkId, userId: targetUserId },
    },
  });

  if (!target) {
    throw new NotFoundError("Member not found in this network.");
  }

  return { requester, target };
}

export async function updateMemberRole(
  networkId: string,
  targetUserId: string,
  newRole: NetworkRole,
  requesterId: string
) {
  const { requester, target } = await fetchAndValidateMemberPair(
    networkId,
    requesterId,
    targetUserId
  );

  if (target.role === "OWNER") {
    throw new ForbiddenError("Cannot change the owner's role.");
  }

  if (ROLE_HIERARCHY[requester.role] <= ROLE_HIERARCHY[target.role]) {
    throw new ForbiddenError(
      "You cannot change the role of someone with equal or higher rank."
    );
  }

  if (requester.role !== "OWNER" && target.role === "ADMIN") {
    throw new ForbiddenError("Only the owner can manage admin roles.");
  }

  if (requester.role !== "OWNER" && newRole === "ADMIN") {
    throw new ForbiddenError("Only the owner can promote members to admin.");
  }

  return prisma.networkMembers.update({
    where: {
      userId_networkId: { networkId, userId: targetUserId },
    },
    data: { role: newRole },
  });
}

export async function removeMemberById(
  networkId: string,
  targetUserId: string,
  requesterId: string
) {
  const { requester, target } = await fetchAndValidateMemberPair(
    networkId,
    requesterId,
    targetUserId
  );

  if (target.role === "OWNER") {
    throw new ForbiddenError("Cannot remove the network owner.");
  }

  if (ROLE_HIERARCHY[requester.role] <= ROLE_HIERARCHY[target.role]) {
    throw new ForbiddenError(
      "You cannot remove someone with equal or higher rank."
    );
  }

  return prisma.networkMembers.delete({
    where: {
      userId_networkId: { networkId, userId: targetUserId },
    },
  });
}
