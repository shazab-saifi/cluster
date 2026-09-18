import { uuidSchema } from "@lib/zod.schemas";
import { sendErrorResponse, ValidationError } from "@workspace/core/errors";
import express, { Request, Response, Router } from "express";
import { getNotifications } from "@workspace/core/services/notification-services";

export const notifRouter: Router = express.Router();

// notifRouter.post("/", async (req: Request, res: Response) => {
//   const { data, success, error } = notificationSchema.safeParse(req.body);

//   try {
//     if (!success) {
//       throw new ValidationError(
//         "Invalid inputs",
//         error.issues[0]?.message ?? "Please check the body"
//       );
//     }

//     await createNotification(data);

//     res.json({ msg: "Notification sent", data });
//   } catch (error) {
//     sendErrorResponse(res, error, { path: req.originalUrl });
//   }
// });

notifRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const cursor =
    typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  if (cursor !== undefined && !uuidSchema.safeParse(cursor).success) {
    throw new ValidationError(
      "Invalid cursor param",
      "Please make sure cursor param is a valid uuid"
    );
  }

  try {
    const { notifications, nextCursor } = await getNotifications(
      userId,
      cursor
    );

    res.json({ notifications, nextCursor });
  } catch (error) {
    sendErrorResponse(res, error, { path: req.originalUrl });
  }
});
