import { z } from "zod";

export const InputPayloadUnion = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("JOIN_CHANNEL"),
    channelId: z.uuid(),
  }),
  z.object({
    type: z.literal("NEW_MESSAGE"),
    channelId: z.uuid(),
    message: z.string(),
    attachment: z.string().optional(),
  }),
  z.object({
    type: z.literal("DELETE_MESSAGE"),
    messageId: z.uuid(),
    channelId: z.uuid(),
  }),
  z.object({
    type: z.literal("EDIT_MESSAGE"),
    messageId: z.uuid(),
    channelId: z.uuid(),
    editedMessage: z.string(),
  }),
]);

export type InputPayload = z.infer<typeof InputPayloadUnion>;
export type NewMessagePayload = Extract<InputPayload, { type: "NEW_MESSAGE" }>;
