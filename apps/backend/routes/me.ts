import express, { Request, Response, Router } from "express";
import { prisma } from "@workspace/db";
import { meInfoUpdateSchema } from "@zod-schemas/me.schema";

export const meRouter: Router = express.Router();

meRouter.get("/", async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json("Unauthorized!");
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        memberships: {
          include: {
            network: true,
          },
        },
      },
    });

    res.json({ userData });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error, Please try again later!" });
  }
});

meRouter.patch("/", async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json("Unauthorized!");
  }

  const body = meInfoUpdateSchema.safeParse(req.body);

  if (!body.success) {
    return res
      .status(400)
      .json({ error: "Invalid Inputs", issues: body.error.issues });
  }

  const { name, image } = body.data;
  const data: any = {};

  if (name !== undefined) data.name = name;
  if (image !== undefined) data.image = image;

  try {
    const updateData = await prisma.user.update({
      where: { id: user.id },
      data: data,
    });

    res.json(updateData);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error, Please try again later!" });
  }
});
