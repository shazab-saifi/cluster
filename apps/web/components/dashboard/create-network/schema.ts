import { z } from "zod";

export const createNetworkSchema = z.object({
  name: z
    .string()
    .min(3, "Network name should have at least 3 characters")
    .max(255, "Network name cannot be more than 255 characters"),
  image: z.string().max(1000, "Image URL cannot be more than 1000 characters"),
  type: z.enum(["PUBLIC", "PRIVATE"]),
});

export type CreateNetworkValues = z.infer<typeof createNetworkSchema>;
