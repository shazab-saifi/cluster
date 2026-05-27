import type { Network } from "../types";
import type { CreateNetworkValues } from "./schema";

const API_BASE_URL = "http://localhost:4000";

type CreateNetworkResponse = {
  msg: string;
  network: Network;
};

export async function createNetwork(values: CreateNetworkValues) {
  const response = await fetch(`${API_BASE_URL}/networks`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: values.name.trim(),
      image: values.image?.trim() || undefined,
      type: values.type,
    }),
  });

  if (!response.ok) {
    let message = "Could not create network.";

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

  return (await response.json()) as CreateNetworkResponse;
}
