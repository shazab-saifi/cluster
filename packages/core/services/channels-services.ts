import { Prisma, prisma } from "@workspace/db";
import { ForbiddenError, NotFoundError } from "../errors";
import {
  channelExists,
  hasAdminPermissions,
  isMember,
  networkExists,
} from "./validation";

type AssertUserParams = {
  userId: string;
  networkId: string;
  message?: string;
  suggestion?: string;
  tx?: Prisma.TransactionClient;
  isCheckPermissions?: boolean;
  channelId?: string;
};

async function assertUser({
  userId,
  networkId,
  message,
  suggestion,
  tx,
  isCheckPermissions,
  channelId,
}: AssertUserParams) {
  const dbClient = tx ? tx : prisma;

  const existingNetwork = await networkExists(networkId, dbClient);

  if (!existingNetwork) {
    throw new NotFoundError(`Counld not find network with id ${networkId}`);
  }

  if (channelId) {
    const existingChannel = await channelExists(channelId, networkId, dbClient);

    if (!existingChannel) {
      throw new NotFoundError(`Counld not find channel with id ${channelId}`);
    }
  }

  let isAllowed;

  if (isCheckPermissions) {
    isAllowed = await hasAdminPermissions(networkId, userId, dbClient);
  } else {
    isAllowed = await isMember(networkId, userId, dbClient);
  }

  if (!isAllowed) throw new ForbiddenError(message, suggestion);
}

export async function createChannel(
  networkId: string,
  userId: string,
  name: string
) {
  return await prisma.$transaction(
    async (tx) => {
      await assertUser({
        userId,
        networkId,
        message:
          "Administration level perimissions are required to create a channel.",
        suggestion: "You don't have admin level perimissions.",
        tx,
        isCheckPermissions: true,
      });

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
  await assertUser({
    userId,
    networkId,
    message:
      "You need to be a member of this network to be able fetch its channels.",
    suggestion:
      "You don't have the permissions to fetch channels of this network.",
  });

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
      await assertUser({
        userId,
        networkId,
        message:
          "You don't have the permissions to update this channel's info.",
        suggestion: "Seek permission from network's administrator or owner.",
        isCheckPermissions: true,
        channelId,
        tx,
      });

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
      await assertUser({
        userId,
        networkId,
        message:
          "You don't have the permissions to delete this channel's info.",
        suggestion: "Seek permission from network's administrator or owner.",
        isCheckPermissions: true,
        tx,
        channelId,
      });

      return await tx.channel.delete({ where: { id: channelId } });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}
