import { Prisma, prisma } from "@workspace/db";
import {
  networkCreateSchema,
  networkInfoUpdateSchema,
} from "@zod-schemas/network.schema";
import express, { Request, Response, Router } from "express";
export const networkRouter: Router = express.Router();

networkRouter.post("/", async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) return res.status(401).json("Unauthorized!");

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

networkRouter.patch("/:id", async (req: Request, res: Response) => {
  const user = req.user;
  const id = req.params.id;

  if (!user) return res.status(401).json("Unauthorized!");

  const { success, error, data } = networkInfoUpdateSchema.safeParse(req.body);

  if (!success) {
    return res
      .status(400)
      .json({ error: "Invalid Inputs!", issues: error.issues });
  }

  const newData: any = {};

  if (data.image !== undefined) newData.image = data.image;
  if (data.name !== undefined) newData.name = data.name;
  if (data.type !== undefined) newData.type = data.type.toUpperCase();

  try {
    const updatedData = await prisma.network.update({
      where: { id: id as string },
      data: newData,
    });

    res.json(updatedData);
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ error: "A network cannot be found with this id!" });
      }
    }
    res
      .status(500)
      .json({ error: "Internal server error, Please try again later!" });
  }
});
