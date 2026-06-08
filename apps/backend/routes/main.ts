import express, { Router } from "express";
import { meRouter } from "./me";
import { authMiddleware } from "@lib/auth-middleware";
import { messagesRouter } from "./messages";
import { networksRouter } from "./networks";
import { friendsRouter } from "./friends";
import { getInvitePreview, invitesRouter } from "./invites";

export const mainRouter: Router = express.Router();

mainRouter.get("/invites/:token", getInvitePreview);

mainRouter.use(authMiddleware);

mainRouter.use("/me", meRouter);
mainRouter.use("/networks", networksRouter);
mainRouter.use("/channels/:channelId/messages", messagesRouter);
mainRouter.use("/friends", friendsRouter);
mainRouter.use("/invites", invitesRouter);
