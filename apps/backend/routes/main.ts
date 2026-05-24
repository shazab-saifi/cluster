import express, { Router } from "express";
import { meRouter } from "./me";
import { authMiddleware } from "@lib/auth-middleware";
import { messagesRouter } from "./messages";
import { networkRouter } from "./networks";
import { friendsRouter } from "./friends";

export const mainRouter: Router = express.Router();

mainRouter.use("/me", authMiddleware, meRouter);
mainRouter.use("/networks", authMiddleware, networkRouter);
mainRouter.use("/channels/:channelId/messages", authMiddleware, messagesRouter);
mainRouter.use("/friends", authMiddleware, friendsRouter);
