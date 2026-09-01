import { NetworkRole, prisma } from "@workspace/db";
export { NetworkRole };

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
