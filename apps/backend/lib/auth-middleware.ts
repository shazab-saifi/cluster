import { NextFunction, Request, Response } from "express";
import "express";
import { sendErrorResponse, UnauthorizedError } from "@workspace/core/errors";
import {
  getSessionFromHeaders,
  type Session,
  type User,
} from "@workspace/auth";

declare module "express" {
  interface Request {
    user?: User;
    session?: Session;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await getSessionFromHeaders(req.headers);

    if (!session || !session.user || !session.session) {
      throw new UnauthorizedError();
    }

    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    console.error(error);
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
}
