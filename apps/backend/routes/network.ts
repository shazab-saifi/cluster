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

networkRouter.get("/search", async (req: Request, res: Response) => {
  const query = req.query.q;

  if (!query) {
    return res
      .status(400)
      .json({ error: "No 'q' query was provided in the URI!" });
  }

  try {
    const searcheResult = await prisma.$queryRaw`
        SELECT *, similarity(name, ${query}) AS score
        FROM "network"
        WHERE similarity(name, ${query}) > 0.1
        ORDER BY score DESC;
      `;

    res.json(searcheResult);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error, Please try again later!" });
  }
});
