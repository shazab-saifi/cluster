import axios from "axios";

import { API_BASE_URL } from "@/lib/utils";
import type { MeResponse, NetworkDetails } from "./types";

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
