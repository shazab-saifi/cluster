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

export async function getInviteInfo(token: string) {
  return await prisma.invite.findUnique({
    where: { token },
  });
}

export async function IncrementInviteCurrentUses(token: string) {
  return await prisma.invite.update({
    where: {
      token,
    },
    data: {
      currentUses: { increment: 1 },
    },
  });
}

export async function revokeInviteLink(token: string) {
  return await prisma.invite.update({
    where: { token },
    data: { revoked: true },
  });
}
