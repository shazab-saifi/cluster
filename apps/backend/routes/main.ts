import express, { Router } from "express";
import { userRouter } from "./user";

export const mainRouter: Router = express.Router();

mainRouter.use("/user", userRouter);
