import { prisma } from "@workspace/db";
import { NotFoundError } from "../errors";
import { assertHasFriendship, assertHasMembership } from "./validation";
import { redisClient } from "@workspace/redis";

async function assertCanManageMessage(
  userId: string,
  messageId: string,
  channelId: string
) {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: userId,
      channelId: channelId,
    },
  });

  if (!message) {
    throw new NotFoundError("Could not find message");
  }
}

export async function getMessages(
  userId: string,
  cursor?: string,
  channelId?: string,
  friendshipId?: string
) {
  if (channelId) await assertHasMembership(channelId, userId);
  if (friendshipId) await assertHasFriendship(friendshipId, userId);

  const messages = await prisma.message.findMany({
    where: channelId ? { channelId } : { friendshipId },
    include: {
      sender: {
        select: {
          id: true,
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

interface BaseMsgPayload {
  type: "NEW_MESSAGE" | "EDIT_MESSAGE" | "DELETE_MESSAGE";
  id: string;
  senderId: string;
  channelId: string;
}

interface NewMsgPayload extends BaseMsgPayload {
  type: "NEW_MESSAGE";
  message: string;
  attachment?: string;
  timestamp: string;
}

interface EditMessagePaylaod extends BaseMsgPayload {
  type: "EDIT_MESSAGE";
  editedMsg: string;
}

interface DeleteMessagePayload extends BaseMsgPayload {
  type: "DELETE_MESSAGE";
}

type MsgEventPayload =
  | NewMsgPayload
  | EditMessagePaylaod
  | DeleteMessagePayload;

async function addMsgEvent(payload: MsgEventPayload) {
  const redisPayload = payload as unknown as Record<string, string>;

  return await redisClient.xAdd("event:stream", "*", redisPayload, {
    TRIM: {
      strategy: "MAXLEN",
      strategyModifier: "~",
      threshold: 10000,
    },
  });
}

export async function newMsgEvent(payload: NewMsgPayload) {
  await addMsgEvent(payload);
}

export async function editMsgEvent(payload: EditMessagePaylaod) {
  await assertCanManageMessage(payload.senderId, payload.id, payload.channelId);

  await addMsgEvent(payload);
}

export async function deleteMsgEvent(payload: DeleteMessagePayload) {
  await assertCanManageMessage(payload.senderId, payload.id, payload.channelId);
  await addMsgEvent(payload);
}
