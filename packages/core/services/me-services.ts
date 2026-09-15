import { prisma } from "@workspace/db";

export async function getMe(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    include: {
      networks: true,
      memberships: {
        include: {
          network: true,
        },
      },
    },
  });
}

export async function updateMe(
  userId: string,
  data: { name?: string; image?: string; bio?: string; username?: string }
) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data,
  });
}

export async function isUsernameAvailable(username: string) {
  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });

  return { available: !existing };
}
