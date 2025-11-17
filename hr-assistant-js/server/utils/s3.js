import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

export async function uploadToS3(buffer, originalName, mimeType) {
  const key = `hr_docs/${uuidv4()}-${originalName.replace(/\s+/g, "_")}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: "private"
  }));

  return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
