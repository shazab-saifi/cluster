import express, { Router } from "express";
import { usersRouter, meRouter } from "./index";

export const mainRouter: Router = express.Router();

mainRouter.use("/user", usersRouter);
mainRouter.use("/me", meRouter);
