import { prisma, Prisma, PrismaClient } from "@workspace/db";
import { NotFoundError } from "../errors";

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

export async function assertHasMembership(channelId: string, userId: string) {
  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      network: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  if (!channel) {
    throw new NotFoundError("Could not find channel");
  }

  return channel;
}

export async function assertHasFriendship(
  friendshipId: string,
  userId: string
) {
  const friendship = await prisma.friendship.findUnique({
    where: {
      id: friendshipId,
      OR: [{ receiverId: userId }, { senderId: userId }],
    },
  });

  if (!friendship) {
    throw new NotFoundError("DM not found");
  }

  return friendship;
}

export async function isNetworkMember(
  networkId: string,
  userId: string,
  client?: DbClient
) {
  return (client ? client : prisma).networkMembers.findFirst({
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
