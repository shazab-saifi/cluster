import { prisma } from "@workspace/db";

export async function createInvite(
  networkId: string,
  maxUses: number,
  userId: string,
  expiresAt: Date,
  token: string
) {
  return await prisma.invite.create({
    data: {
      token,
      expiresAt,
      maxUses,
      networkId,
      createdById: userId,
    },
  });
}
