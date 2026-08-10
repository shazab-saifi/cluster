import { QueryFunctionContext } from "@tanstack/react-query";
import axios from "axios";
import type { MessageType } from "@/components/dashboard/types";

export type MessagesPage = {
  messages: MessageType[];
  nextCursor: string | null;
};

export const getMessagesQueryKey = (channelId: string) =>
  ["messages", channelId] as const;

export const APP_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://cluster.shazab.site";

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

    return response.data;
  } catch (error) {
    console.error(`Error while fetching ${key} data`, error);
    throw error;
  }
};

export async function fetchMessages({
  pageParam,
  queryKey,
}: QueryFunctionContext<
  readonly string[],
  string | null
>): Promise<MessagesPage> {
  const [, channelId] = queryKey;

  try {
    const res = await axios.get(
      `${API_BASE_URL}/channels/${channelId}/messages?cursor=${pageParam ?? ""}`,
      {
        withCredentials: true,
      }
    );

    return res.data;
  } catch (error) {
    console.error(`Error while fetching ${channelId} messages`, error);
    throw error;
  }
}
