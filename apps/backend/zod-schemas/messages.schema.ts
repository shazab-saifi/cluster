import { z } from "zod";

export const messageCreateSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const messageUpdateSchema = messageCreateSchema.partial();
