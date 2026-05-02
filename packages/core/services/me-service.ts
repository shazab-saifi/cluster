import { prisma } from "@workspace/db";
import { NotFoundError } from "../errors";

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      networks: true,
      memberships: true,
    },
  });

  if (!user) {
    throw new NotFoundError(
      "User not found.",
      "Verify the authenticated user still exists and try again."
    );
  }

  return user;
}

export async function updateMe(userId: string, data: any) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data,
  });

  if (!user) {
    throw new NotFoundError(
      "User not found.",
      "Verify the authenticated user still exists and try again."
    );
  }

  return user;
}
