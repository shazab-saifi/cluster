import { Prisma, PrismaClient } from "@workspace/db";

type DbClient = PrismaClient | Prisma.TransactionClient;

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

export async function hasAdminPermissions(
  networkId: string,
  userId: string,
  client: DbClient
) {
  return client.networkMembers.findFirst({
    where: {
      networkId: networkId,
      userId,
      ...{ role: { in: ["ADMIN", "OWNER"] } },
    },
  });
}

export async function isMember(
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
      networkId: networkId,
      userId,
      role: { in: ["ADMIN", "OWNER"] },
    },
  });
}
