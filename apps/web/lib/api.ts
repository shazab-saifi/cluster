import axios from "axios";

import { API_BASE_URL, uploadAvatar } from "./utils";
import type {
  Channel,
  Friendship,
  MeResponse,
  Network,
  NetworkDetails,
} from "@/components/dashboard/types";
import type {
  CreateChannelValues,
  CreateInviteValues,
  CreateNetworkValues,
  EditChannelValues,
  InviteExpiry,
} from "./schemas";

const INVITE_MAX_USES = 10;

const EXPIRY_MS: Record<InviteExpiry, number> = {
  "10m": 10 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};

type CreateNetworkResponse = {
  msg: string;
  network: Network;
};

type CreateInviteResponse = {
  inviteLink: string;
};

type CreateInviteInput = CreateInviteValues & {
  networkId: string;
};

type CreateChannelInput = CreateChannelValues & {
  networkId: string;
};

type ChannelRequestInput = {
  networkId: string;
  channelId: string;
};

type EditChannelInput = ChannelRequestInput & EditChannelValues;

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
    throw new Error(getApiErrorMessage(error, "Could not edit channel."));
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
    throw new Error(getApiErrorMessage(error, "Could not delete channel."));
  }
}

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

export async function createNetwork(values: CreateNetworkValues) {
  try {
    let image: string | undefined;

    if (values.image) {
      image = await uploadAvatar(values.image);
    }

    const response = await axios.post<CreateNetworkResponse>(
      `${API_BASE_URL}/networks`,
      {
        name: values.name.trim(),
        image,
        type: values.type,
      },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(getApiErrorMessage(error, "Could not create network."));
  }
}

export async function checkUsernameAvailable(username: string) {
  const response = await axios.get<{ available: boolean }>(
    `${API_BASE_URL}/user/username-available`,
    { params: { username }, withCredentials: true }
  );

  return response.data;
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
