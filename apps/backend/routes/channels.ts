import {
  BadRequestError,
  sendErrorResponse,
  UnauthorizedError,
  ValidationError,
} from "@workspace/core/errors";
import express, { Request, Response, Router } from "express";
import * as channelsServices from "@workspace/core/services/channels-services";
import { channelCreateSchema } from "@zod-schemas/channels.schema";

export const channelRouter: Router = express.Router({ mergeParams: true });

channelRouter.post("/", async (req: Request, res: Response) => {
  const user = req.user;
  const { networkId } = req.params;

  if (!user) {
    throw new UnauthorizedError();
  }

  if (!networkId) {
    throw new BadRequestError(
      "No 'networkId' param was sent in the URI.",
      "Provide the networkId param and try again"
    );
  }

  const { success, error, data } = channelCreateSchema.safeParse(req.body);

  if (!success) {
    throw new ValidationError(
      "Invalid Inputs",
      error.issues[0]?.message ?? "Check the request body and try again."
    );
  }

  try {
    const channel = await channelsServices.createChannel(
      networkId as string,
      user.id,
      data.name
    );

    res.json(channel);
  } catch (error) {
    sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});
