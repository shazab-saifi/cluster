import express, { Router } from "express";
import { usersRouter, meRouter } from "./index";
import { authMiddleware } from "../lib/auth-middleware";

export const mainRouter: Router = express.Router();

mainRouter.use("/user", usersRouter);
mainRouter.use("/me", authMiddleware, meRouter);
