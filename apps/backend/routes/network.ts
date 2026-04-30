import { prisma } from "@workspace/db";
import { networkCreateSchema } from "@zod-schemas/network.schema";
import express, { Request, Response, Router } from "express";

export const networkRouter: Router = express.Router();

networkRouter.post("/", async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json("Unauthorized!");
  }

  const { success, data, error } = networkCreateSchema.safeParse(req.body);

  if (!success) {
    return res
      .status(400)
      .json({ error: "Invalid Inputs", issues: error.issues });
  }

  try {
    const { name, type, image } = data;

    const network = await prisma.network.create({
      data: {
        name,
        type,
        image,
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
    });

    res.json({ msg: "Network created successfully", network });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error, Please try again later!" });
  }
});
