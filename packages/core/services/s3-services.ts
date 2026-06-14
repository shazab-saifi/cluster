import {
  GetObjectCommand,
  getSignedUrl,
  PutObjectCommand,
  s3Client,
} from "@workspace/aws/s3";

export async function getUploadUrl(contentType: string, filename: string) {
  const key = `uploads/${Date.now()}-${filename}.${contentType}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  return { key, url };
}

export async function getObjectUrl(Key: string) {
  const getCommand = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key,
  });

  return await getSignedUrl(s3Client, getCommand, { expiresIn: 60 });
}
