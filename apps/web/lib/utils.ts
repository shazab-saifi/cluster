import axios from "axios";

export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://cluster.shazab.site";

export async function getPresignedUrl(filename: string, filetype: string) {
  const res = await axios.post(
    `${API_BASE_URL}/api/generate-presigned-url`,
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
