import { z } from "zod";

export const networkCreateSchema = z.object({
  name: z.string().min(3).max(255),
  image: z.string().max(1000).optional(),
  type: z.enum(["PUBLIC", "PRIVATE"]),
});

export const networkInfoUpdateSchema = networkCreateSchema.partial();
