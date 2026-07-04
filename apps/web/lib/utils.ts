import { QueryFunctionContext } from "@tanstack/react-query";
import axios from "axios";

export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://cluster.shazab.site/api";

export const SOCKET_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://cluster.shazab.site";

export async function getPresignedUrl(filename: string, filetype: string) {
  const res = await axios.post(
    `${API_BASE_URL}/generate-presigned-url`,
    {
      filename,
      filetype,
    },
    { withCredentials: true }
  );

  return res.data;
}

export async function uploadToS3(presignedUrl: string, fileObject: File) {
  const res = await axios.put(presignedUrl, fileObject, {
    headers: {
      "Content-Type": fileObject.type,
    },
  });

  return res;
}

export const contextFetcher = async <T>({
  queryKey,
}: QueryFunctionContext): Promise<T> => {
  const [key, url] = queryKey;

  try {
    const response = await axios.get(url as string, { withCredentials: true });

    return response.data.messages;
  } catch (error) {
    console.error(`Error while fetching ${key} data`, error);
    throw error;
  }
};
