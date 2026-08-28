import { uuidSchema } from "@lib/zod.schemas";
import {
  NotFoundError,
  sendErrorResponse,
  ValidationError,
} from "@workspace/core/errors";
import * as friendServices from "@workspace/core/services/friends-services";
import { createNotificationEvent } from "@workspace/core/services/notification-services";
import express, { Request, Response, Router } from "express";

export const friendshipRouter: Router = express.Router();

friendshipRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;

  try {
    const friends = await friendServices.getAllFriends(userId);

    if (!friends) {
      throw new NotFoundError("You don't have any friend, LOL.");
    }

    res.json(friends);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

friendshipRouter.post("/add/:friendId", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const parsedFriendId = uuidSchema.safeParse(req.params.friendId);

  if (!parsedFriendId.success) {
    throw new ValidationError(
      "Invalid network id",
      parsedFriendId.error.issues[0]?.message ??
        "Param networkId should be a valid uuid"
    );
  }

  try {
    const friendShip = await friendServices.createFriendShip(
      userId,
      parsedFriendId.data
    );
    await createNotificationEvent({
      type: "FRIEND_REQUEST",
      entityType: "friend_request",
      entityId: friendShip.id,
      userId: friendShip.receiverId,
      actorId: friendShip.senderId,
    });

    res.json({ msg: "friend request sent successfully" });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
