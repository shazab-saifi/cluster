import axios from "axios";

import { API_BASE_URL } from "@/lib/utils";
import type { Channel } from "../types";
import type { CreateChannelValues } from "./schema";

type CreateChannelInput = CreateChannelValues & {
  networkId: string;
};

export async function createChannel({ networkId, name }: CreateChannelInput) {
  try {
    const response = await axios.post<Channel>(
      `${API_BASE_URL}/networks/${networkId}/channels`,
      {
        name: name.trim(),
      },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not create channel."));
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
