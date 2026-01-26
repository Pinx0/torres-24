import "server-only";

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Endpoint = process.env.R2_ENDPOINT;
const r2Bucket = process.env.R2_BUCKET;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

function assertR2Config() {
  if (!r2Endpoint || !r2Bucket || !r2AccessKeyId || !r2SecretAccessKey) {
    throw new Error("Missing R2 configuration environment variables");
  }
}

function createR2Client() {
  assertR2Config();

  return new S3Client({
    region: "auto",
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId!,
      secretAccessKey: r2SecretAccessKey!,
    },
  });
}

export function buildDocumentKey(userId: string, originalName: string) {
  const safeName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  const name = safeName || "documento";
  return `documentos/${userId}/${crypto.randomUUID()}-${name}`;
}

export async function createUploadUrl(params: {
  key: string;
  contentType: string;
  sizeBytes?: number;
  expiresIn?: number;
}) {
  assertR2Config();
  const client = createR2Client();

  const command = new PutObjectCommand({
    Bucket: r2Bucket!,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresIn ?? 60 * 5,
  });

  return uploadUrl;
}

export async function createDownloadUrl(params: { key: string; expiresIn?: number }) {
  assertR2Config();
  const client = createR2Client();

  const command = new GetObjectCommand({
    Bucket: r2Bucket!,
    Key: params.key,
  });

  const downloadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresIn ?? 60 * 5,
  });

  return downloadUrl;
}
