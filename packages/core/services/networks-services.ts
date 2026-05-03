import { prisma } from "@workspace/db";

export interface NetworkCreateType {
  name: string;
  type: "PUBLIC" | "PRIVATE";
  image?: string;
  ownerId: string;
  channels: {
    name: string;
  };
  members: {
    userId: string;
    role: "ADMIN" | "MODERATOR" | "MEMBER";
  };
}

export async function createNetwork(userId: string, data: NetworkCreateType) {
  return await prisma.network.create({
    data: {
      name: data.name,
      type: data.type,
      image: data.image,
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
  data: { name?: string; type?: "PUBLIC" | "PRIVATE"; image?: string }
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
