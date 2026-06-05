import axios from "axios";

import { API_BASE_URL } from "@/lib/utils";
import type { CreateInviteValues, InviteExpiry } from "./schema";

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
  try {
    const response = await axios.post<CreateInviteResponse>(
      `${API_BASE_URL}/invites`,
      {
        networkId,
        maxUses: INVITE_MAX_USES,
        expiresAt: new Date(Date.now() + EXPIRY_MS[expiresIn]).toISOString(),
      },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not create invite link."));
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string; details?: string }>(error)) {
    return (
      error.response?.data?.details ?? error.response?.data?.message ?? fallback
    );
  }

  return fallback;
}
