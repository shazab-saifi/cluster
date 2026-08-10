import express, { Router } from "express";
import { meRouter } from "./me";
import { authMiddleware } from "@lib/auth-middleware";
import { messagesRouter } from "./messages";
import { networksRouter } from "./networks";
import { friendshipRouter } from "./friendship";
import { getInvitePreview, invitesRouter } from "./invites";
import { s3PresignedRouter } from "./get-presigned-urls";
import { notifRouter } from "./notifications";
import { userRouter } from "./user";

export const mainRouter: Router = express.Router();

mainRouter.get("/invites/:token", getInvitePreview);

mainRouter.use(authMiddleware);

mainRouter.use("/me", meRouter);
mainRouter.use("/networks", networksRouter);
mainRouter.use("/channels/:channelId/messages", messagesRouter);
mainRouter.use("/friendship/:friendshipId/messages", messagesRouter);
mainRouter.use("/friendship", friendshipRouter);
mainRouter.use("/invites", invitesRouter);
mainRouter.use("/generate-presigned-url", s3PresignedRouter);
mainRouter.use("/notifications", notifRouter);
mainRouter.use("/user", userRouter);
