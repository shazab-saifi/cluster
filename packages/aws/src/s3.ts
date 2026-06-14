import { S3Client } from "@aws-sdk/client-s3";

// NOTE: aws will use local machine credentials if not provided explicitly in configuration. I've add an IAM in my machine
export const s3Client = new S3Client({
  region: "us-east-1",
});

export * from "@aws-sdk/client-s3";
export * from "@aws-sdk/s3-request-presigner";
