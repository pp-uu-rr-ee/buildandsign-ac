import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

const BUCKET = process.env.STORAGE_BUCKET ?? "";
const ENDPOINT = process.env.STORAGE_ENDPOINT ?? "";
const PUBLIC_URL = process.env.NEXT_PUBLIC_STORAGE_URL ?? "";

function getClient() {
  if (!BUCKET || !ENDPOINT) throw new Error("R2 storage is not configured.");
  return new S3Client({
    region: "auto",
    endpoint: ENDPOINT,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY ?? "",
      secretAccessKey: process.env.STORAGE_SECRET_KEY ?? "",
    },
  });
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type UploadResult = {
  key: string;
  publicUrl: string;
};

// Server-side upload — file buffer goes Next.js → R2 (no browser CORS needed)
export async function uploadToR2(
  productId: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) throw new Error("Unsupported file type. Use JPEG, PNG, WebP, or AVIF.");

  const key = `products/${productId}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicUrl = `${PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  return { key, publicUrl };
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
