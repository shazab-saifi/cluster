import type { Channel } from "../types";
import type { CreateChannelValues } from "./schema";

const API_BASE_URL = "http://localhost:4000";

type CreateChannelInput = CreateChannelValues & {
  networkId: string;
};

export async function createChannel({ networkId, name }: CreateChannelInput) {
  const response = await fetch(
    `${API_BASE_URL}/networks/${networkId}/channels`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
      }),
    }
  );

  if (!response.ok) {
    let message = "Could not create channel.";

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

  return (await response.json()) as Channel;
}
