import { QueryFunctionContext } from "@tanstack/react-query";
import axios from "axios";

export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://cluster.shazab.site/api";

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

export async function contextFetcher({ queryKey }: QueryFunctionContext) {
  const [key, url] = queryKey;

  try {
    console.log(url);
    const response = await axios(url as string, { withCredentials: true });

    return response.data;
  } catch (error) {
    console.error(`Error while fetching ${key} data`, error);
  }
}
