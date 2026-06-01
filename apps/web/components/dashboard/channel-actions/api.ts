import type { Channel } from "../types";
import type { EditChannelValues } from "./schema";

const API_BASE_URL = "http://localhost:4000";

type ChannelRequestInput = {
  networkId: string;
  channelId: string;
};

type EditChannelInput = ChannelRequestInput & EditChannelValues;

export async function editChannel({
  networkId,
  channelId,
  name,
}: EditChannelInput) {
  const response = await fetch(
    `${API_BASE_URL}/networks/${networkId}/channels/${channelId}`,
    {
      method: "PATCH",
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
    throw new Error(
      await getChannelErrorMessage(response, "Could not edit channel.")
    );
  }

  return (await response.json()) as Channel;
}

export async function deleteChannel({
  networkId,
  channelId,
}: ChannelRequestInput) {
  const response = await fetch(
    `${API_BASE_URL}/networks/${networkId}/channels/${channelId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getChannelErrorMessage(response, "Could not delete channel.")
    );
  }

  return (await response.json()) as {
    msg: string;
    deletedChannel: Channel;
  };
}

async function getChannelErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      message?: string;
      details?: string;
    };

    return body.details ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
}
