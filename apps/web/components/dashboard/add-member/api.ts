import type { CreateInviteValues, InviteExpiry } from "./schema";

const API_BASE_URL = "http://localhost:4000";
const INVITE_MAX_USES = 10;

const EXPIRY_MS: Record<InviteExpiry, number> = {
  "10m": 10 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};

type CreateInviteInput = CreateInviteValues & {
  networkId: string;
};

type CreateInviteResponse = {
  inviteLink: string;
};

export async function createInvite({
  networkId,
  expiresIn,
}: CreateInviteInput) {
  const response = await fetch(`${API_BASE_URL}/invites`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      networkId,
      maxUses: INVITE_MAX_USES,
      expiresAt: new Date(Date.now() + EXPIRY_MS[expiresIn]).toISOString(),
    }),
  });

  if (!response.ok) {
    let message = "Could not create invite link.";

    try {
      const body = (await response.json()) as {
        message?: string;
        details?: string;
      };
      message = body.details ?? body.message ?? message;
    } catch {
      // Keep the generic message if the response is not JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as CreateInviteResponse;
}
