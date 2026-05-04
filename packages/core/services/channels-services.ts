import { Prisma, prisma } from "@workspace/db";
import { ForbiddenError } from "../errors";

type AssertUserParams = {
  userId: string;
  networkId: string;
  message?: string;
  suggestion?: string;
  tx?: Prisma.TransactionClient;
  isCheckMembership?: boolean;
};

async function assertUser({
  userId,
  networkId,
  message,
  suggestion,
  tx,
  isCheckMembership,
}: AssertUserParams) {
  const operator = tx ? tx : prisma;

  const isAllowed = await operator.networkMembers.findFirst({
    where: {
      networkId: networkId,
      userId,
      role: {
        in: isCheckMembership
          ? ["ADMIN", "OWNER", "MODERATOR", "MEMBER"]
          : ["ADMIN", "OWNER"],
      },
    },
  });

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
    isCheckMembership: true,
  });

  return await prisma.channel.findMany({
    where: {
      networkId,
    },
  });
}
