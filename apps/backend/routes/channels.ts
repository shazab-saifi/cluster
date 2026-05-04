import { sendErrorResponse, ValidationError } from "@workspace/core/errors";
import express, { Request, Response, Router } from "express";
import * as channelsServices from "@workspace/core/services/channels-services";
import {
  channelCreateSchema,
  channelInfoUpdateSchema,
} from "@zod-schemas/channels.schema";

export const channelsRouter: Router = express.Router({ mergeParams: true });

channelsRouter.post("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { networkId } = req.params;
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

channelsRouter.patch("/:channelId", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { networkId, channelId } = req.params;
  const { success, error, data } = channelInfoUpdateSchema.safeParse(req.body);

  if (!success) {
    throw new ValidationError(
      "Invalid Inputs",
      error.issues[0]?.message ?? "Check the request body and try again."
    );
  }

  try {
    const updatedInfo = await channelsServices.updateChannelInfo(
      networkId as string,
      channelId as string,
      userId,
      data
    );

    res.json(updatedInfo);
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});

channelsRouter.delete("/:channelId", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { networkId, channelId } = req.params;

  try {
    const deletedChannel = await channelsServices.deleteChannel(
      networkId as string,
      channelId as string,
      userId
    );

    res.json({
      msg: `Channel with id ${channelId} deleted successfully.`,
      deletedChannel,
    });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
