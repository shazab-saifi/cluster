import { z } from "zod";

export const channelCreateSchema = z.object({
  name: z.string().min(3).max(255),
});
