import { BadRequestError, sendErrorResponse } from "@workspace/core/errors";
import { findUserbyUsername } from "@workspace/core/services/friends-services";
import express, { Request, Response, Router } from "express";

export const userRouter: Router = express.Router();

userRouter.get("/search", async (req: Request, res: Response) => {
  const username = req.query.q;

  if (!username) {
    throw new BadRequestError("Query 'q' must be provided");
  }

  try {
    const result = await findUserbyUsername(username as string);

    res.json(result);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
