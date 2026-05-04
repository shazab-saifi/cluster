import { NextFunction, Request, Response } from "express";
import { auth } from "./auth";
import { fromNodeHeaders } from "better-auth/node";
import "express";
import { Session, User } from "better-auth";
import { sendErrorResponse, UnauthorizedError } from "@workspace/core/errors";

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
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

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
