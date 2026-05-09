import { sendErrorResponse, ValidationError } from "@workspace/core/errors";
import { uuidSchema } from "@zod-schemas/index";
import express, { Request, Response, Router } from "express";
import * as messagesServices from "@workspace/core/services/messages-services";
import { messageCreateSchema } from "@zod-schemas/messages.schema";

export const messagesRouter: Router = express.Router({ mergeParams: true });

messagesRouter.post("/", async (req: Request, res: Response) => {
  const { channelId } = req.params;
  const uuidParsed = uuidSchema.safeParse(channelId);
  const bodyParsed = messageCreateSchema.safeParse(req.body);
  const userId = req.user?.id as string;

  if (!uuidParsed.success) {
    throw new ValidationError(
      "Invalid channel id",
      uuidParsed.error.issues[0]?.message ??
        "Param channelId should be a valid uuid"
    );
  }

  if (!bodyParsed.success) {
    throw new ValidationError(
      "Invalid Inputs",
      bodyParsed.error.issues[0]?.message ??
        "Check the request body and try again."
    );
  }

  try {
    const message = await messagesServices.createMessage(
      uuidParsed.data,
      userId,
      bodyParsed.data.message
    );

    res.json(message);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
