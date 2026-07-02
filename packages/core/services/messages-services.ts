import { prisma } from "@workspace/db";
import { NotFoundError } from "../errors";
import { assertHasFriendship, assertHasMembership } from "./validation";

async function assertCanManageMessage(userId: string, messageId: string) {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: userId,
    },
  });

  if (!message) {
    throw new NotFoundError("Could not find message");
  }
}

export async function createMessage({
  userId,
  message,
  channelId,
  friendshipId,
}: {
  userId: string;
  message: string;
  channelId?: string;
  friendshipId?: string;
}) {
  if (channelId) await assertHasMembership(channelId, userId);
  if (friendshipId) await assertHasFriendship(friendshipId, userId);

  return await prisma.message.create({
    data: {
      senderId: userId,
      message,
      ...(channelId ? { channelId } : { friendshipId }),
    },
  });
}

export async function getMessages(
  channelId: string,
  userId: string,
  cursor?: string
) {
  await assertHasMembership(channelId, userId);

  const messages = await prisma.message.findMany({
    where: {
      channelId,
    },
    include: {
      sender: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: 50,
  });

  const nextCursor =
    messages.length === 50 ? messages[messages.length - 1]?.id : null;

  return { messages, nextCursor };
}

export async function updateMessage(
  messageId: string,
  userId: string,
  message: string
) {
  await assertCanManageMessage(userId, messageId);

  return await prisma.message.update({
    where: { id: messageId },
    data: { message },
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  await assertCanManageMessage(userId, messageId);

  return await prisma.message.delete({ where: { id: messageId } });
}
