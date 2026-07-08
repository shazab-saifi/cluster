import { uuidSchema } from "@lib/zod.schemas";
import {
  NotFoundError,
  sendErrorResponse,
  ValidationError,
} from "@workspace/core/errors";
import {
  getAllFriends,
  addFriend,
} from "@workspace/core/services/friends-services";
import { redisClient } from "@workspace/redis";
import express, { Request, Response, Router } from "express";

export const friendshipRouter: Router = express.Router();

friendshipRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;

  try {
    const friends = await getAllFriends(userId);

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
    await redisClient.xAdd(
      "notif:stream",
      "*",
      {
        type: "FRIEND_REQUEST",
        senderId: userId,
        receiverId: parsedFriendId.data,
      },
      {
        TRIM: {
          strategy: "MAXLEN",
          strategyModifier: "~",
          threshold: 10000,
        },
      }
    );
    await addFriend(userId, parsedFriendId.data);

    res.json({ msg: "friend request sent successfully" });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
