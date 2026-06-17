import axios from "axios";
import { API_BASE_URL, getPresignedUrl, uploadToS3 } from "@/lib/utils";
import type { Network } from "../types";
import type { CreateNetworkValues } from "./schema";

type CreateNetworkResponse = {
  msg: string;
  network: Network;
};

export async function createNetwork(values: CreateNetworkValues) {
  try {
    let responseObject;

    if (values.image) {
      responseObject = await getPresignedUrl(
        values.image.name,
        values.image.type
      );

      await uploadToS3(responseObject.presignedUrl.url, values.image);
    }

    const response = await axios.post<CreateNetworkResponse>(
      `${API_BASE_URL}/networks`,
      {
        name: values.name.trim(),
        image: `https://cdn.cluster.shazab.site/${responseObject.presignedUrl.key}`,
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

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string; details?: string }>(error)) {
    return (
      error.response?.data?.details ?? error.response?.data?.message ?? fallback
    );
  }

  return fallback;
}
