import { prisma } from "@workspace/db";
import { AppError } from "../errors";

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
    throw new AppError("User not found.", {
      code: "USER_NOT_FOUND",
      statusCode: 404,
      suggestion: "Verify the authenticated user still exists and try again.",
    });
  }

  return user;
}
