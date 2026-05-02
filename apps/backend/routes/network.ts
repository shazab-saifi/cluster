import {
  BadRequestError,
  sendErrorResponse,
  UnauthorizedError,
  ValidationError,
} from "@workspace/core/errors";
import { prisma } from "@workspace/db";
import {
  networkCreateSchema,
  networkInfoUpdateSchema,
} from "@zod-schemas/network.schema";
import express, { Request, Response, Router } from "express";
export const networkRouter: Router = express.Router();

networkRouter.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const { success, data, error } = networkCreateSchema.safeParse(req.body);

    if (!success) {
      throw new ValidationError(
        "Invalid Inputs",
        error.issues[0]?.message ?? "Check the request body and try again."
      );
    }

    const { name, type, image } = data;

    const network = await prisma.network.create({
      data: {
        name,
        type,
        image,
        ownerId: user.id,
        channels: {
          create: {
            name: "general",
          },
        },
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
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});

networkRouter.get("/search", async (req: Request, res: Response) => {
  const query = req.query.q;

  if (!query) {
    return sendErrorResponse(
      res,
      new BadRequestError(
        "No 'q' query was provided in the URI!",
        "Provide the q query parameter and try again."
      ),
      {
        path: req.originalUrl,
      }
    );
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
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});

networkRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const id = req.params.id;

    if (!user) {
      throw new UnauthorizedError();
    }

    const { success, error, data } = networkInfoUpdateSchema.safeParse(
      req.body
    );

    if (!success) {
      throw new ValidationError(
        "Invalid Inputs!",
        error.issues[0]?.message ?? "Check the request body and try again."
      );
    }

    const newData: any = {};

    if (data.image !== undefined) newData.image = data.image;
    if (data.name !== undefined) newData.name = data.name;
    if (data.type !== undefined) newData.type = data.type.toUpperCase();

    const updatedData = await prisma.network.update({
      where: { id: id as string },
      data: newData,
    });

    res.json(updatedData);
  } catch (error) {
    return sendErrorResponse(res, error, {
      path: req.originalUrl,
    });
  }
});
