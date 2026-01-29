import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const DOCUMENTS_BUCKET = "documentos";

function sanitizeFileName(originalName: string) {
  return originalName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function buildDocumentPath(userId: string, originalName: string) {
  const safeName = sanitizeFileName(originalName);
  const name = safeName || "documento";
  return `documentos/${userId}/${crypto.randomUUID()}-${name}`;
}

export async function createDocumentUploadUrl(params: { path: string }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUploadUrl(params.path, { upsert: false });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "No se pudo generar la URL de subida");
  }

  return data.signedUrl;
}

export async function createDocumentDownloadUrl(params: {
  path: string;
  expiresIn?: number;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(params.path, params.expiresIn ?? 60 * 10);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "No se pudo generar la URL de descarga");
  }

  return data.signedUrl;
}
