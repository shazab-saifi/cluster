import {
  BadRequestError,
  sendErrorResponse,
  ValidationError,
} from "@workspace/core/errors";
import {
  networkCreateSchema,
  networkInfoUpdateSchema,
} from "@zod-schemas/networks.schema";
import express, { Request, Response, Router } from "express";
import * as networksServices from "@workspace/core/services/networks-services";
import { channelsRouter } from "./channels";

export const networkRouter: Router = express.Router();
networkRouter.use("/:networkId/channels", channelsRouter);

networkRouter.post("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;

  const { success, data, error } = networkCreateSchema.safeParse(req.body);

  if (!success) {
    throw new ValidationError(
      "Invalid Inputs",
      error.issues[0]?.message ?? "Check the request body and try again."
    );
  }

  try {
    const { name, type, image } = data;

    const network = await networksServices.createNetwork(userId, {
      name,
      type,
      image,
      ownerId: userId,
      channels: { name: "general" },
      members: { userId, role: "OWNER" },
    });

    res.json({
      msg: "Network created successfully",
      network,
    });
  } catch (error) {
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});

networkRouter.get("/search", async (req: Request, res: Response) => {
  const query = req.query.q;

  if (typeof query !== "string" || query.trim() === "") {
    throw new BadRequestError(
      "No 'q' query was provided in the URI!",
      "Provide the q query parameter and try again."
    );
  }

  try {
    const searcheResult = await networksServices.searchNetworks(
      query as string
    );

    res.json(searcheResult);
  } catch (error) {
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});

networkRouter.patch("/:id", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const id = req.params.id;

  const { success, error, data } = networkInfoUpdateSchema.safeParse(req.body);

  if (!success) {
    throw new ValidationError(
      "Invalid Inputs!",
      error.issues[0]?.message ?? "Check the request body and try again."
    );
  }

  const newData: {
    image?: string;
    name?: string;
    type?: "PRIVATE" | "PUBLIC";
  } = {};

  if (data.image !== undefined) newData.image = data.image;
  if (data.name !== undefined) newData.name = data.name;
  if (data.type !== undefined) newData.type = data.type;

  try {
    const updatedData = await networksServices.updateNetworkInfo(
      id as string,
      userId,
      newData
    );

    res.json(updatedData);
  } catch (error) {
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});
