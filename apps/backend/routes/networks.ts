import {
  BadRequestError,
  sendErrorResponse,
  ValidationError,
} from "@workspace/core/errors";
import {
  networkCreateSchema,
  networkInfoUpdateSchema,
  uuidSchema,
} from "@lib/zod.schemas";
import express, { Request, Response, Router } from "express";
import * as networksServices from "@workspace/core/services/networks-services";
import { channelsRouter } from "./channels";

export const networksRouter: Router = express.Router();
networksRouter.use("/:networkId/channels", channelsRouter);

networksRouter.post("/", async (req: Request, res: Response) => {
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

networksRouter.get("/search", async (req: Request, res: Response) => {
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

networksRouter.get("/:networkId", async (req: Request, res: Response) => {
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
    const network = await networksServices.getNetworkById(
      networkIdParsed.data,
      userId
    );

    res.json(network);
  } catch (error) {
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});

networksRouter.patch("/:id", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const idParsed = uuidSchema.safeParse(req.params.id);

  const { success, error, data } = networkInfoUpdateSchema.safeParse(req.body);

  if (!idParsed.success) {
    throw new ValidationError(
      "Invalid network id",
      idParsed.error.issues[0]?.message ?? "Param id should be a valid uuid"
    );
  }

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
      idParsed.data,
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
