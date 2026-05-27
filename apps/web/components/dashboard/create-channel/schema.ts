import { z } from "zod";

export const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Channel name should have at least 3 characters")
    .max(255, "Channel name cannot be more than 255 characters"),
});

export type CreateChannelValues = z.infer<typeof createChannelSchema>;
