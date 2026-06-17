import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const createNetworkSchema = z.object({
  name: z
    .string()
    .min(3, "Network name must have at least 3 characters")
    .max(255, "Network name cannot be more than 255 characters"),
  desc: z
    .string()
    .min(32, "Network description must have atleast 32 characters")
    .max(255, "Network description cannot have more than 255 characters"),

  image: z
    .file()
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "Avatar size must be less than 5MB"
    )
    .refine(
      (file) => ACCEPTED_TYPES.includes(file.type),
      "Avatar must be type of JPEG, PNG, or WEBP"
    )
    .optional(),
  type: z.enum(["PUBLIC", "PRIVATE"]),
});

export type CreateNetworkValues = z.infer<typeof createNetworkSchema>;
