import { Prisma, PrismaClient } from "@workspace/db";

export type DbClient = PrismaClient | Prisma.TransactionClient;

export function getDbClient(
  tx?: Prisma.TransactionClient,
  client?: PrismaClient
) {
  return tx ?? client;
}

export async function networkExists(networkId: string, client: DbClient) {
  return await client.network.findUnique({ where: { id: networkId } });
}

export async function channelExists(
  channelId: string,
  networkId: string,
  client: DbClient
) {
  return await client.channel.findFirst({
    where: { id: channelId, networkId },
  });
}

export async function getAdminChannelAccess(
  networkId: string,
  userId: string,
  client: DbClient,
  channelId?: string
) {
  return await client.network.findFirst({
    where: {
      id: networkId,
      members: {
        some: {
          userId,
          ...{ role: { in: ["ADMIN", "OWNER"] } },
        },
      },
    },
    ...(channelId && {
      include: {
        channels: {
          where: {
            id: channelId,
          },
        },
      },
    }),
  });
}

export async function isNetworkMember(
  networkId: string,
  userId: string,
  client: DbClient
) {
  return client.networkMembers.findFirst({
    where: {
      networkId: networkId,
      userId,
    },
  });
}

export async function hasOwnerPermissions(
  networkId: string,
  userId: string,
  client: DbClient
) {
  return client.networkMembers.findFirst({
    where: {
      networkId,
      userId,
      role: "OWNER",
    },
  });
}
