import { prisma } from "@workspace/db";

export async function createMessage(
  channelId: string,
  userId: string,
  message: string
) {
  return await prisma.message.create({
    data: {
      channelId,
      senderId: userId,
      message,
    },
  });
}

export async function updateMessage(messageId: string, message: string) {
  return await prisma.message.update({
    where: { id: messageId },
    data: { message },
  });
}

export async function deleteMessage(messageId: string) {
  return await prisma.message.delete({ where: { id: messageId } });
}
