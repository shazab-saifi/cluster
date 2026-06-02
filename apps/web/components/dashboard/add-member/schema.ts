import { z } from "zod";

export const inviteExpirySchema = z.enum(["10m", "30m", "1h", "1d"]);

export const createInviteSchema = z.object({
  expiresIn: inviteExpirySchema,
});

export type InviteExpiry = z.infer<typeof inviteExpirySchema>;
export type CreateInviteValues = z.infer<typeof createInviteSchema>;
