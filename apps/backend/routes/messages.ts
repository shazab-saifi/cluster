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
      channelId: parsedChannelId ? parsedChannelId.data : undefined,
      friendshipId: parsedFriendshipId ? parsedFriendshipId.data : undefined,
      userId,
      message: bodyParsed.data.message,
    });

    res.json(message);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

messagesRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const isChannelId = uuidSchema.safeParse(req.params.channelId);
  const cursor = req.query.cursor;

  if (!isChannelId.success) {
    throw new ValidationError(
      "Invalid Params",
      isChannelId.error.issues[0]?.message ??
        "Param channelId should be a valid uuid"
    );
  }

  try {
    const { messages, nextCursor } = await messagesServices.getMessages(
      isChannelId.data,
      userId,
      cursor && (cursor as string)
    );

    res.json({ messages, nextCursor });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

messagesRouter.patch("/:id", async (req: Request, res: Response) => {
  const idParsed = uuidSchema.safeParse(req.params.id);
  const userId = req.user?.id as string;
  const bodyParsed = messageUpdateSchema.safeParse(req.body);

  if (!idParsed.success) {
    throw new ValidationError(
      "Invalid Params",
      idParsed.error.issues[0]?.message ??
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
      idParsed.data,
      userId,
      message
    );

    res.json(updatedMessage);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

messagesRouter.delete("/:id", async (req: Request, res: Response) => {
  const idParsed = uuidSchema.safeParse(req.params.id);
  const userId = req.user?.id as string;

  if (!idParsed.success) {
    throw new ValidationError(
      "Invalid Params",
      idParsed.error.issues[0]?.message ??
        "Check the request body and try again."
    );
  }

  try {
    const deletedMsg = await messagesServices.deleteMessage(
      idParsed.data,
      userId
    );

    res.json({ msg: "Channel Deleted Successfully!", deletedMsg });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
