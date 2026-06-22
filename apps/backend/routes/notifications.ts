import { notificationSchema } from "@lib/zod.schemas";
import { sendErrorResponse, ValidationError } from "@workspace/core/errors";
import express, { Request, Response, Router } from "express";
import { redisClient } from "@workspace/redis";

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
    const notification = redisClient.xAdd("notif:stream", "*", data, {
      TRIM: {
        strategy: "MAXLEN",
        strategyModifier: "~",
        threshold: 10000,
      },
    });

    res.json({ msg: "Notification sent", notification });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
