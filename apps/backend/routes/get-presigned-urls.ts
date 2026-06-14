import { sendErrorResponse } from "@workspace/core/errors";
import { getUploadUrl } from "@workspace/core/services/s3-services";
import express, { Request, Response, Router } from "express";

export const s3PresignedRouter: Router = express.Router();

s3PresignedRouter.post("/", async (req: Request, res: Response) => {
  const { filename, filetype } = req.body;

  try {
    const presignedUrl = await getUploadUrl(filetype, filename);

    res.json({ presignedUrl });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
