import { notificationSchema } from "@lib/zod.schemas";
import { sendErrorResponse, ValidationError } from "@workspace/core/errors";
import express, { Request, Response, Router } from "express";
import * as notifServices from "@workspace/core/services/notification-services";

export const notifRouter: Router = express.Router();

notifRouter.post("/", async (req: Request, res: Response) => {
  const { data, success, error } = notificationSchema.safeParse(req.body);

  if (!success) {
    throw new ValidationError(
      "Invalid inputs",
      error.issues[0]?.message ?? "Please check the body"
    );
  }

  try {
    await notifServices.createNotification(data);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
