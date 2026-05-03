import { Prisma, prisma } from "@workspace/db";
import { ForbiddenError } from "../errors";

async function assertAdmin(
  tx: Prisma.TransactionClient,
  userId: string,
  networkId: string,
  message: string,
  suggestion: string
) {
  const isAllowed = await tx.networkMembers.findFirst({
    where: {
      networkId: networkId,
      userId,
      role: { in: ["ADMIN"] },
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
      await assertAdmin(
        tx,
        userId,
        networkId,
        "Administration level perimissions are required to create a channel.",
        "You don't have admin level perimissions."
      );

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
