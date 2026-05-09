import { prisma } from "@workspace/db";
import { isNetworkMember } from "./validation";
import { ForbiddenError } from "../errors";

export async function createMessage(
  networkId: string,
  channelId: string,
  userId: string,
  message: string
) {
  const hasPermission = await isNetworkMember(networkId, userId, prisma);

  if (!hasPermission) {
    throw new ForbiddenError(
      "You are not allowed to send message in this network",
      "You need to be a member of this network to send messages"
    );
  }

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
