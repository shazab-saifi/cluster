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

export async function updateMe(
  data: Partial<{ name: string; bio: string; image: string }>
) {
  try {
    const response = await axios.patch<MeResponse>(`${API_BASE_URL}/me`, data, {
      withCredentials: true,
    });

    return response.data;
  } catch {
    throw new Error("Could not update your profile.");
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

export async function updateNetwork(
  networkId: string,
  data: Partial<{ name: string; desc: string; image: string }>
) {
  try {
    const response = await axios.patch<NetworkDetails>(
      `${API_BASE_URL}/networks/${networkId}`,
      data,
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not update network."));
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

export async function updateMemberRole(
  networkId: string,
  memberId: string,
  role: string
) {
  try {
    const response = await axios.patch<{ msg: string }>(
      `${API_BASE_URL}/networks/${networkId}/members/${memberId}/role`,
      { role },
      { withCredentials: true }
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not update member role."));
  }
}

export async function removeMemberFromNetwork(
  networkId: string,
  memberId: string
) {
  try {
    const response = await axios.delete<{ msg: string }>(
      `${API_BASE_URL}/networks/${networkId}/members/${memberId}`,
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not remove member."));
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (
    axios.isAxiosError<{
      error?: { message?: string; suggestion?: string };
      message?: string;
      details?: string;
    }>(error)
  ) {
    const data = error.response?.data;
    return (
      data?.error?.suggestion ??
      data?.error?.message ??
      data?.details ??
      data?.message ??
      fallback
    );
  }

  return fallback;
}
