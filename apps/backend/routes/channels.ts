import { sendErrorResponse, ValidationError } from "@workspace/core/errors";
import { uuidSchema } from "@zod-schemas/index";
import express, { Request, Response, Router } from "express";
import * as channelsServices from "@workspace/core/services/channels-services";
import {
  channelCreateSchema,
  channelInfoUpdateSchema,
} from "@zod-schemas/channels.schema";

export const channelsRouter: Router = express.Router({ mergeParams: true });

channelsRouter.post("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const networkIdParsed = uuidSchema.safeParse(req.params.networkId);
  const { success, error, data } = channelCreateSchema.safeParse(req.body);

  if (!networkIdParsed.success) {
    throw new ValidationError(
      "Invalid network id",
      networkIdParsed.error.issues[0]?.message ??
        "Param networkId should be a valid uuid"
    );
  }

  if (!success) {
    throw new ValidationError(
      "Invalid Inputs",
      error.issues[0]?.message ?? "Check the request body and try again."
    );
  }

  try {
    const channel = await channelsServices.createChannel(
      networkIdParsed.data,
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
  const networkIdParsed = uuidSchema.safeParse(req.params.networkId);

  if (!networkIdParsed.success) {
    throw new ValidationError(
      "Invalid network id",
      networkIdParsed.error.issues[0]?.message ??
        "Param networkId should be a valid uuid"
    );
  }

  try {
    const channels = await channelsServices.getChannels(
      networkIdParsed.data,
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
  const networkIdParsed = uuidSchema.safeParse(req.params.networkId);
  const channelIdParsed = uuidSchema.safeParse(req.params.channelId);
  const { success, error, data } = channelInfoUpdateSchema.safeParse(req.body);

  if (!networkIdParsed.success) {
    throw new ValidationError(
      "Invalid network id",
      networkIdParsed.error.issues[0]?.message ??
        "Param networkId should be a valid uuid"
    );
  }

  if (!channelIdParsed.success) {
    throw new ValidationError(
      "Invalid channel id",
      channelIdParsed.error.issues[0]?.message ??
        "Param channelId should be a valid uuid"
    );
  }

  if (!success) {
    throw new ValidationError(
      "Invalid Inputs",
      error.issues[0]?.message ?? "Check the request body and try again."
    );
  }

  try {
    const updatedInfo = await channelsServices.updateChannelInfo(
      networkIdParsed.data,
      channelIdParsed.data,
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
  const networkIdParsed = uuidSchema.safeParse(req.params.networkId);
  const channelIdParsed = uuidSchema.safeParse(req.params.channelId);

  if (!networkIdParsed.success) {
    throw new ValidationError(
      "Invalid network id",
      networkIdParsed.error.issues[0]?.message ??
        "Param networkId should be a valid uuid"
    );
  }

  if (!channelIdParsed.success) {
    throw new ValidationError(
      "Invalid channel id",
      channelIdParsed.error.issues[0]?.message ??
        "Param channelId should be a valid uuid"
    );
  }

  try {
    const deletedChannel = await channelsServices.deleteChannel(
      networkIdParsed.data,
      channelIdParsed.data,
      userId
    );

    res.json({
      msg: `Channel with id ${channelIdParsed.data} deleted successfully.`,
      deletedChannel,
    });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
