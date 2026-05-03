import express, { Router } from "express";
import { usersRouter, meRouter, networkRouter } from "@routes";
import { authMiddleware } from "@lib/auth-middleware";

export const mainRouter: Router = express.Router();

mainRouter.use("/users", usersRouter);
mainRouter.use("/me", authMiddleware, meRouter);
mainRouter.use("/networks", authMiddleware, networkRouter);
