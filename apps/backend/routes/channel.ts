import express, { Request, Response, Router } from "express";

export const channelRouter: Router = express.Router();

channelRouter.post("/", (req: Request, res: Response) => {
  const user = req.user;
});
