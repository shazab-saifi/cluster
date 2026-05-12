import { z } from "zod";

export const InputPayloadUnion = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("JOIN_CHANNEL"),
    payload: z.object({
      channelId: z.uuid(),
    }),
  }),
  z.object({
    type: z.literal("SEND_MESSAGE"),
    payload: z.object({
      channelId: z.uuid(),
      content: z.string(),
    }),
  }),
]);

export type InputPayload = z.infer<typeof InputPayloadUnion>;
