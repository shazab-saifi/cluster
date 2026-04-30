import { z } from "zod";

export const meInfoUpdateSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  image: z.string().max(1000).optional(),
});
