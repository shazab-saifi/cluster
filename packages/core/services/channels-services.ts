import { Prisma, prisma, PrismaClient } from "@workspace/db";
import { ForbiddenError, NotFoundError } from "../errors";
import { isNetworkMember } from "./validation";

type dbClient = PrismaClient | Prisma.TransactionClient;

async function assertAdminChannelAccess(
  db: dbClient,
  networkId: string,
  userId: string,
  channelId?: string
) {
  const network = await db.network.findFirst({
    where: {
      id: networkId,
      members: {
        some: {
          userId,
          ...{ role: { in: ["ADMIN", "OWNER"] } },
        },
      },
      ...(channelId && {
        channels: {
          some: {
            id: channelId,
          },
        },
      }),
    },
  });

  if (!network) {
    throw new NotFoundError(
      "Either resouce does not exists or you don't have the permission to make this request"
    );
  }

  return network;
}

export async function createChannel(
  networkId: string,
  userId: string,
  name: string
) {
  return await prisma.$transaction(
    async (tx) => {
      await assertAdminChannelAccess(tx, networkId, userId);

      return await tx.channel.create({
        data: {
          name,
          networkId,
        },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

export async function getChannels(networkId: string, userId: string) {
  const isMember = await isNetworkMember(networkId, userId, prisma);

  if (!isMember) {
    throw new ForbiddenError("Only network member can access its channels");
  }

  return await prisma.channel.findMany({
    where: {
      networkId,
    },
  });
}

export async function updateChannelInfo(
  networkId: string,
  channelId: string,
  userId: string,
  data: { name: string }
) {
  return await prisma.$transaction(
    async (tx) => {
      await assertAdminChannelAccess(tx, networkId, userId, channelId);

      return await tx.channel.update({
        where: {
          networkId,
          id: channelId,
        },
        data: {
          name: data.name,
        },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

export async function deleteChannel(
  networkId: string,
  channelId: string,
  userId: string
) {
  return await prisma.$transaction(
    async (tx) => {
      await assertAdminChannelAccess(tx, networkId, userId, channelId);

      return await tx.channel.delete({ where: { id: channelId } });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}
