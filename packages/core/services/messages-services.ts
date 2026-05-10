import { prisma } from "@workspace/db";
import { NotFoundError } from "../errors";

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

export async function createMessage(
  channelId: string,
  userId: string,
  message: string
) {
  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      network: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  if (!channel) {
    throw new NotFoundError("Could not find channel");
  }

  return await prisma.message.create({
    data: {
      channelId,
      senderId: userId,
      message,
    },
  });
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
