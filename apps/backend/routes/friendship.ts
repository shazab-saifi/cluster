import { uuidSchema } from "@lib/zod.schemas";
import {
  NotFoundError,
  sendErrorResponse,
  ValidationError,
} from "@workspace/core/errors";
import * as friendServices from "@workspace/core/services/friends-services";
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
    // TODO: A friend request notification needs to go to the receiver user
    // EDIT: Shifted the notification event trigger in addFriend function
    await friendServices.addFriend(userId, parsedFriendId.data);

    res.json({ msg: "friend request sent successfully" });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
