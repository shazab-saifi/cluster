import axios from "axios";

import { API_BASE_URL } from "@/lib/utils";
import type { Channel } from "../types";
import type { EditChannelValues } from "./schema";

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
  try {
    const response = await axios.patch<Channel>(
      `${API_BASE_URL}/networks/${networkId}/channels/${channelId}`,
      {
        name: name.trim(),
      },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(getChannelErrorMessage(error, "Could not edit channel."));
  }
}

export async function deleteChannel({
  networkId,
  channelId,
}: ChannelRequestInput) {
  try {
    const response = await axios.delete<{
      msg: string;
      deletedChannel: Channel;
    }>(`${API_BASE_URL}/networks/${networkId}/channels/${channelId}`, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    throw new Error(getChannelErrorMessage(error, "Could not delete channel."));
  }
}

function getChannelErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string; details?: string }>(error)) {
    return (
      error.response?.data?.details ?? error.response?.data?.message ?? fallback
    );
  }

  return fallback;
}
