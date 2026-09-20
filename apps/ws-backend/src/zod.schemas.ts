import { z } from "zod";

const messageTarget = {
  channelId: z.uuid().optional(),
  friendshipId: z.uuid().optional(),
};

const exactlyOneTarget = <T extends z.ZodType>(target: T) =>
  target.superRefine((data, ctx) => {
    const value = data as { channelId?: string; friendshipId?: string };
    const hasChannel = Boolean(value.channelId);
    const hasFriendship = Boolean(value.friendshipId);

    if (hasChannel === hasFriendship) {
      ctx.addIssue({
        code: "custom",
        path: ["channelId"],
        message: "Exactly one of channelId or friendshipId is required",
      });
    }
  });

export const InputPayloadUnion = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("JOIN_CHANNEL"),
    channelId: z.uuid(),
  }),
  z.object({
    type: z.literal("JOIN_FRIENDSHIP"),
    friendshipId: z.uuid(),
  }),
  exactlyOneTarget(
    z.object({
      type: z.literal("NEW_MESSAGE"),
      message: z.string(),
      attachment: z.string().optional(),
      clientRequestId: z.uuid(),
      ...messageTarget,
    })
  ),
  exactlyOneTarget(
    z.object({
      type: z.literal("DELETE_MESSAGE"),
      messageId: z.uuid(),
      clientRequestId: z.uuid(),
      ...messageTarget,
    })
  ),
  exactlyOneTarget(
    z.object({
      type: z.literal("EDIT_MESSAGE"),
      messageId: z.uuid(),
      editedMessage: z.string(),
      clientRequestId: z.uuid(),
      ...messageTarget,
    })
  ),
]);

export type InputPayload = z.infer<typeof InputPayloadUnion>;
export type NewMessagePayload = Extract<InputPayload, { type: "NEW_MESSAGE" }>;
