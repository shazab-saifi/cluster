import {
  BadRequestError,
  sendErrorResponse,
  ValidationError,
} from "@workspace/core/errors";
import express, { Request, Response, Router } from "express";
import * as channelsServices from "@workspace/core/services/channels-services";
import { channelCreateSchema } from "@zod-schemas/channels.schema";

export const channelsRouter: Router = express.Router({ mergeParams: true });

channelsRouter.post("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { networkId } = req.params;

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
      userId,
      data.name
    );

    res.json(channel);
  } catch (error) {
    sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});

channelsRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { networkId } = req.params;

  if (!networkId) {
    throw new BadRequestError(
      "No 'networkId' param was sent in the URI.",
      "Provide the networkId param and try again"
    );
  }

  try {
    const channels = await channelsServices.getChannels(
      networkId as string,
      userId
    );

    res.json(channels);
  } catch (error) {
    sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});
