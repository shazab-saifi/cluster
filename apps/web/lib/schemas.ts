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

export const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Channel name should have at least 3 characters")
    .max(255, "Channel name cannot be more than 255 characters"),
});

export type CreateChannelValues = z.infer<typeof createChannelSchema>;

export const editChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Channel name should have at least 3 characters")
    .max(255, "Channel name cannot be more than 255 characters"),
});

export type EditChannelValues = z.infer<typeof editChannelSchema>;

export const inviteExpirySchema = z.enum(["10m", "30m", "1h", "1d"]);

export const createInviteSchema = z.object({
  expiresIn: inviteExpirySchema,
});

export type InviteExpiry = z.infer<typeof inviteExpirySchema>;
export type CreateInviteValues = z.infer<typeof createInviteSchema>;

export type SignUpFormValues = {
  name: string;
  email: string;
  username: string;
  password: string;
  bio: string;
};

export const nameSchema = z
  .string()
  .min(3, "Name should have at least 3 characters.")
  .max(128, "Name cannot be more than 128 characters.");

export const emailSchema = z.email();

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username cannot be more than 30 characters.")
  .regex(
    /^[a-zA-Z0-9_.]+$/,
    "Username can only contain letters, numbers, underscores, and dots."
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password cannot be more than 128 characters.");

export const bioSchema = z
  .string()
  .max(160, "Bio cannot be more than 160 characters.");
