import { getSignedUrl, PutObjectCommand, s3Client } from "@workspace/aws/s3";

export async function getUploadUrl(contentType: string, filename: string) {
  const name = filename.replace("", "-");
  const key = `uploads/${Date.now()}-${name}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  return { key, url };
}
