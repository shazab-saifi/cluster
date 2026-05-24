import express, { Router } from "express";
import { meRouter, networkRouter } from "@routes";
import { authMiddleware } from "@lib/auth-middleware";
import { messagesRouter } from "./messages";

export const mainRouter: Router = express.Router();

mainRouter.use("/me", authMiddleware, meRouter);
mainRouter.use("/networks", authMiddleware, networkRouter);
mainRouter.use("/channels/:channelId/messages", authMiddleware, messagesRouter);
