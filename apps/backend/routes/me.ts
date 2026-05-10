import express, { Request, Response, Router } from "express";
import { sendErrorResponse, ValidationError } from "@workspace/core/errors";
import { meInfoUpdateSchema } from "@lib/zod.schemas";
import * as meService from "@workspace/core/services/me-services";

export const meRouter: Router = express.Router();

meRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;

    const userData = await meService.getMe(userId);

    res.json({ userData });
  } catch (error) {
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});

meRouter.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;

    const body = meInfoUpdateSchema.safeParse(req.body);

    if (!body.success) {
      throw new ValidationError(
        "Invalid Inputs",
        body.error.issues[0]?.message ?? "Check the request body and try again."
      );
    }

    const { name, image } = body.data;
    const data: { name?: string; image?: string } = {};

    if (name !== undefined) data.name = name;
    if (image !== undefined) data.image = image;

    const updateData = await meService.updateMe(userId, data);

    res.json(updateData);
  } catch (error) {
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});
