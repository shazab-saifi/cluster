import { inviteCreateSchema } from "@lib/zod.schemas";
import {
  ForbiddenError,
  sendErrorResponse,
  ValidationError,
} from "@workspace/core/errors";
import express, { Request, Response, type Router } from "express";
import * as inviteServices from "@workspace/core/services/invites-services";
import { randomBytes } from "crypto";
import { addMember } from "@workspace/core/services/networks-services";
import { isNetworkMember } from "@workspace/core/services/validation";

export const invitesRouter: Router = express.Router();

invitesRouter.post("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { success, data, error } = inviteCreateSchema.safeParse(req.body);

  try {
    const member = await isNetworkMember(data?.networkId as string, userId);

    if (member?.role !== "OWNER" && member?.role !== "ADMIN") {
      throw new ForbiddenError(
        "You don't have the permission to create an invite link",
        "Only owner and admin can create an invite link"
      );
    }

    if (!success) {
      console.error(error);
      throw new ValidationError(
        "Invalid Inputs",
        error.issues[0]?.message ?? "Check the request body and try again."
      );
    }

    const token = randomBytes(32).toString("hex");
    const invite = await inviteServices.createInvite(
      data.networkId,
      data.maxUses,
      userId,
      data.expiresAt,
      token
    );

    const inviteLink =
      process.env.NODE_ENV === "development"
        ? `http://localhost:4000/api/invites/${invite.token}`
        : `https://cluster.shazab.site/api/invites/${invite.token}`;

    res.json({ inviteLink });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

invitesRouter.get("/:token", async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const userId = req.user?.id as string;

  try {
    const tokenInfo = await inviteServices.getInviteInfo(token);
    const current = new Date();
    const isExpiredToken = tokenInfo?.expiresAt === current;
    const hasReachedMaxUses = tokenInfo?.currentUses === tokenInfo?.maxUses;

    if (isExpiredToken) {
      throw new ForbiddenError("This link has expired");
    } else if (hasReachedMaxUses) {
      throw new ForbiddenError("This link has reached its limit");
    }

    await addMember(tokenInfo?.networkId as string, userId);
    await inviteServices.updateInviteCurrentUses(
      (tokenInfo?.currentUses as number) + 1,
      token
    );

    res.json({ msg: "Joined network successfully" });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
