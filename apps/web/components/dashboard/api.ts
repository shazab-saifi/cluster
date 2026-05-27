import type { MeResponse, NetworkDetails } from "./types";

const API_BASE_URL = "http://localhost:4000";

export async function getMe() {
  const response = await fetch(`${API_BASE_URL}/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Could not load your profile.");
  }

  return (await response.json()) as MeResponse;
}

export async function getNetworkDetails(networkId: string) {
  const response = await fetch(`${API_BASE_URL}/networks/${networkId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Could not load network channels.");
  }

  return (await response.json()) as NetworkDetails;
}
