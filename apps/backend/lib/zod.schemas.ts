import { z } from "zod";

export const channelCreateSchema = z.object({
  name: z.string().min(3).max(255),
});

export const channelInfoUpdateSchema = channelCreateSchema.partial();

export const meInfoUpdateSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  image: z.string().max(1000).optional(),
});

export const messageCreateSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const messageUpdateSchema = messageCreateSchema.partial();

export const networkCreateSchema = z.object({
  name: z.string().min(3).max(255),
  image: z.string().max(1000).optional(),
  type: z.enum(["PUBLIC", "PRIVATE"]),
});

export const networkInfoUpdateSchema = networkCreateSchema.partial();

export const uuidSchema = z.uuid();
