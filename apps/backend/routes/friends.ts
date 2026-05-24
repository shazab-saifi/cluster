import { NotFoundError, sendErrorResponse } from "@workspace/core/errors";
import { getAllFriends } from "@workspace/core/services/friends-services";
import express, { Request, Response, Router } from "express";

export const friendsRouter: Router = express.Router();

friendsRouter.get("/", async (req: Request, res: Response) => {
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
