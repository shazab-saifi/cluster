import { BadRequestError, sendErrorResponse } from "@workspace/core/errors";
import { findUserbyUsername } from "@workspace/core/services/friends-services";
import { isUsernameAvailable } from "@workspace/core/services/me-services";
import express, { Request, Response, Router } from "express";

export const userRouter: Router = express.Router();

userRouter.get("/search", async (req: Request, res: Response) => {
  const username = req.query.q;
  const userId = req.user?.id as string;

  if (!username) {
    throw new BadRequestError("Query 'q' must be provided");
  }

  try {
    const result = await findUserbyUsername(username as string, userId);

    res.json(result);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

export async function checkUsernameAvailable(req: Request, res: Response) {
  const username = req.query.username as string | undefined;

  if (!username) {
    throw new BadRequestError(
      "Username query param is required.",
      "Provide a username to check availability."
    );
  }

  try {
    const result = await isUsernameAvailable(username as string);

    res.json(result);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
}
