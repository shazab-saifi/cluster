import { inviteCreateSchema } from "@lib/zod.schemas";
import { sendErrorResponse, ValidationError } from "@workspace/core/errors";
import express, { Request, Response, type Router } from "express";
import * as inviteServices from "@workspace/core/services/invites-services";
import { randomBytes } from "crypto";

export const invitesRouter: Router = express.Router();

invitesRouter.post("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { success, data, error } = inviteCreateSchema.safeParse(req.body);

  if (!success) {
    console.error(error);
    throw new ValidationError(
      "Invalid Inputs",
      error.issues[0]?.message ?? "Check the request body and try again."
    );
  }

  try {
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
