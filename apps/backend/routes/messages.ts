import { sendErrorResponse, ValidationError } from "@workspace/core/errors";
import {
  uuidSchema,
  messageCreateSchema,
  messageUpdateSchema,
} from "@lib/zod.schemas";
import express, { Request, Response, Router } from "express";
import * as messagesServices from "@workspace/core/services/messages-services";

export const messagesRouter: Router = express.Router({ mergeParams: true });

messagesRouter.post("/", async (req: Request, res: Response) => {
  const bodyParsed = messageCreateSchema.safeParse(req.body);
  const userId = req.user?.id as string;
  const { channelId, friendshipId } = req.params;
  let parsedChannelId;
  let parsedFriendshipId;

  if (Boolean(channelId) === Boolean(friendshipId)) {
    throw new ValidationError(
      "Invalid Params",
      "Exactly one of channelId or friendshipId is required"
    );
  }

  if (channelId) {
    parsedChannelId = uuidSchema.safeParse(channelId);

    if (!parsedChannelId.success) {
      throw new ValidationError(
        "Invalid Params",
        parsedChannelId.error.issues[0]?.message ??
          "Param channelId should be a valid uuid"
      );
    }
  } else {
    parsedFriendshipId = uuidSchema.safeDecode(friendshipId as string);

    if (!parsedFriendshipId.success) {
      throw new ValidationError(
        "Invalid Params",
        parsedFriendshipId.error.issues[0]?.message ??
          "Param friendshipId should be a valid uuid"
      );
    }
  }

  if (!bodyParsed.success) {
    throw new ValidationError(
      "Invalid Inputs",
      bodyParsed.error.issues[0]?.message ??
        "Check the request body and try again."
    );
  }

  try {
    const message = await messagesServices.createMessage({
      userId,
      message: bodyParsed.data.message,
      channelId: parsedChannelId ? parsedChannelId.data : undefined,
      friendshipId: parsedFriendshipId ? parsedFriendshipId.data : undefined,
    });

    res.json(message);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

messagesRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { channelId, friendshipId } = req.params;
  let parsedChannelId;
  let parsedFriendshipId;
  const cursor = req.query.cursor;

  if (Boolean(channelId) === Boolean(friendshipId)) {
    throw new ValidationError(
      "Invalid Params",
      "Exactly one of channelId or friendshipId is required"
    );
  }

  if (channelId) {
    parsedChannelId = uuidSchema.safeParse(channelId);

    if (!parsedChannelId.success) {
      throw new ValidationError(
        "Invalid Params",
        parsedChannelId.error.issues[0]?.message ??
          "Param channelId should be a valid uuid"
      );
    }
  } else {
    parsedFriendshipId = uuidSchema.safeDecode(friendshipId as string);

    if (!parsedFriendshipId.success) {
      throw new ValidationError(
        "Invalid Params",
        parsedFriendshipId.error.issues[0]?.message ??
          "Param friendshipId should be a valid uuid"
      );
    }
  }

  try {
    const { messages, nextCursor } = await messagesServices.getMessages(
      userId,
      cursor && (cursor as string),
      parsedChannelId?.data,
      parsedFriendshipId?.data
    );

    res.json({ messages, nextCursor });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

messagesRouter.patch("/:messageId", async (req: Request, res: Response) => {
  const parsedMessageId = uuidSchema.safeParse(req.params.messageId);
  const userId = req.user?.id as string;
  const bodyParsed = messageUpdateSchema.safeParse(req.body);

  if (!parsedMessageId.success) {
    throw new ValidationError(
      "Invalid Params",
      parsedMessageId.error.issues[0]?.message ??
        "Check the request body and try again."
    );
  }

  if (!bodyParsed.success) {
    throw new ValidationError(
      "Invalid Inputs",
      bodyParsed.error.issues[0]?.message ??
        "Check the request body and try again."
    );
  }

  let message = "";
  if (bodyParsed.data.message !== undefined) message = bodyParsed.data.message;

  try {
    const updatedMessage = await messagesServices.updateMessage(
      parsedMessageId.data,
      userId,
      message
    );

    res.json(updatedMessage);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

messagesRouter.delete("/:messageId", async (req: Request, res: Response) => {
  const parsedMessageId = uuidSchema.safeParse(req.params.messageId);
  const userId = req.user?.id as string;

  if (!parsedMessageId.success) {
    throw new ValidationError(
      "Invalid Params",
      parsedMessageId.error.issues[0]?.message ??
        "Check the request body and try again."
    );
  }

  try {
    const deletedMsg = await messagesServices.deleteMessage(
      parsedMessageId.data,
      userId
    );

    res.json({ msg: "Message Deleted Successfully!", deletedMsg });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
