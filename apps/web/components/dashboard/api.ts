import axios from "axios";

import { API_BASE_URL } from "@/lib/utils";
import type { Friendship, MeResponse, NetworkDetails } from "./types";

export async function getMe() {
  try {
    const response = await axios.get<MeResponse>(`${API_BASE_URL}/me`, {
      withCredentials: true,
    });

    return response.data;
  } catch {
    throw new Error("Could not load your profile.");
  }
}

export async function getNetworkDetails(networkId: string) {
  try {
    const response = await axios.get<NetworkDetails>(
      `${API_BASE_URL}/networks/${networkId}`,
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch {
    throw new Error("Could not load network channels.");
  }
}

export async function getFriends() {
  try {
    const response = await axios.get<Friendship[]>(
      `${API_BASE_URL}/friendship`,
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch {
    throw new Error("Could not load your friends.");
  }
}

export async function leaveNetwork(networkId: string) {
  try {
    const response = await axios.delete<{ msg: string }>(
      `${API_BASE_URL}/networks/${networkId}/members/me`,
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not leave network."));
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
