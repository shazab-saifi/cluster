import {
  BadRequestError,
  sendErrorResponse,
  UnauthorizedError,
  ValidationError,
} from "@workspace/core/errors";
import {
  networkCreateSchema,
  networkInfoUpdateSchema,
} from "@zod-schemas/networks.schema";
import express, { Request, Response, Router } from "express";
import * as networksServices from "@workspace/core/services/networks-services";
import { channelRouter } from "./channels";

export const networkRouter: Router = express.Router();
networkRouter.use("/:networkId/channels", channelRouter);

networkRouter.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const { success, data, error } = networkCreateSchema.safeParse(req.body);

    if (!success) {
      throw new ValidationError(
        "Invalid Inputs",
        error.issues[0]?.message ?? "Check the request body and try again."
      );
    }

    const { name, type, image } = data;

    const network = await networksServices.createNetwork(user.id, {
      name,
      type,
      image,
      ownerId: user.id,
      channels: { name: "general" },
      members: { userId: user.id, role: "ADMIN" },
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

  if (!query) {
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
  try {
    const user = req.user;
    const id = req.params.id;

    if (!id) {
      throw new BadRequestError(
        "No 'id' param was sent in the URI.",
        "Provide the id param and try again"
      );
    }

    if (!user) {
      throw new UnauthorizedError();
    }

    const { success, error, data } = networkInfoUpdateSchema.safeParse(
      req.body
    );

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

    const updatedData = await networksServices.updateNetworkInfo(
      id as string,
      user.id,
      newData
    );

    res.json(updatedData);
  } catch (error) {
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});
