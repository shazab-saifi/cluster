import { prisma } from "@workspace/db";

export async function getMe(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    include: {
      networks: true,
      memberships: true,
    },
  });
}

export async function updateMe(
  userId: string,
  data: { name?: string; image?: string }
) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data,
  });
}
