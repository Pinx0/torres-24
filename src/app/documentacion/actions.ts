"use server";

import { createClient } from "@/lib/supabase/server";
import { buildDocumentKey, createDownloadUrl, createUploadUrl } from "@/lib/r2";
import { DOCUMENT_TYPE_SET, type DocumentType } from "@/lib/document-types";

export interface Documento {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: DocumentType;
  r2_key: string;
  mime_type: string;
  size_bytes: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  download_url?: string | null;
}

function normalizeTipo(tipo?: string | null) {
  if (!tipo) return null;
  return DOCUMENT_TYPE_SET.has(tipo as DocumentType) ? (tipo as DocumentType) : null;
}

export async function listDocumentos(params?: {
  search?: string;
  tipo?: string | null;
  orderBy?: "fecha" | "titulo";
  orderDir?: "asc" | "desc";
}): Promise<{ data: Documento[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: [], error: "Usuario no autenticado" };
    }

    const search = params?.search?.trim();
    const tipo = normalizeTipo(params?.tipo ?? null);
    const orderBy = params?.orderBy ?? "fecha";
    const orderDir = params?.orderDir ?? "desc";

    let query = supabase.from("documentos").select("*");

    if (search) {
      query = query.ilike("titulo", `%${search}%`);
    }

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    const orderColumn = orderBy === "titulo" ? "titulo" : "created_at";
    query = query.order(orderColumn, { ascending: orderDir === "asc" });

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener documentos:", error);
      return { data: [], error: error.message || "Error al obtener documentos" };
    }

    const documentos = (data || []) as Documento[];

    const documentosConUrl = await Promise.all(
      documentos.map(async (doc) => {
        try {
          const downloadUrl = await createDownloadUrl({ key: doc.r2_key, expiresIn: 60 * 10 });
          return { ...doc, download_url: downloadUrl };
        } catch (err) {
          console.error("Error al generar URL de descarga:", err);
          return { ...doc, download_url: null };
        }
      })
    );

    return { data: documentosConUrl, error: null };
  } catch (error) {
    console.error("Error en listDocumentos:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function createDocumentoUploadUrl(params: {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<{ data: { uploadUrl: string; r2Key: string } | null; error: string | null }> {
  try {
    if (!params.fileName?.trim()) {
      return { data: null, error: "Nombre de archivo inválido" };
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    const r2Key = buildDocumentKey(user.id, params.fileName);
    const uploadUrl = await createUploadUrl({
      key: r2Key,
      contentType: params.contentType || "application/octet-stream",
      sizeBytes: params.sizeBytes,
      expiresIn: 60 * 10,
    });

    return { data: { uploadUrl, r2Key }, error: null };
  } catch (error) {
    console.error("Error en createDocumentoUploadUrl:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function createDocumento(params: {
  titulo: string;
  tipo: DocumentType;
  descripcion?: string;
  r2Key: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ data: Documento | null; error: string | null }> {
  try {
    if (!params.titulo?.trim()) {
      return { data: null, error: "El título es obligatorio" };
    }

    if (!DOCUMENT_TYPE_SET.has(params.tipo)) {
      return { data: null, error: "Tipo de documento inválido" };
    }

    if (!params.r2Key) {
      return { data: null, error: "El archivo no está disponible" };
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    const { data, error } = await supabase
      .from("documentos")
      .insert({
        titulo: params.titulo.trim(),
        descripcion: params.descripcion?.trim() || null,
        tipo: params.tipo,
        r2_key: params.r2Key,
        mime_type: params.mimeType || "application/octet-stream",
        size_bytes: params.sizeBytes,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error al crear documento:", error);
      return { data: null, error: error.message || "Error al crear documento" };
    }

    return { data: data as Documento, error: null };
  } catch (error) {
    console.error("Error en createDocumento:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
