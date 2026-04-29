import express, { Request, Response, Router } from "express";
import { authMiddleware } from "../lib/auth-middleware";
import { prisma } from "@workspace/db";

export const meRouter: Router = express.Router();

meRouter.get("/", authMiddleware, async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json("Unauthorized!");
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        memberships: {
          include: {
            network: true,
          },
        },
      },
    });

    res.json({ userData });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error, Please try again later!" });
  }
});
