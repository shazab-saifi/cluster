import { NextFunction, Request, Response } from "express";
import { auth } from "./auth";
import { fromNodeHeaders } from "better-auth/node";
import "express";
import { Session, User } from "better-auth";

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

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error, Please try agains later!" });
  }
}
