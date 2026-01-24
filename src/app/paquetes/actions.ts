"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PackageRequest {
  id: string;
  solicitante_unidad_familiar_codigo: string;
  aceptante_unidad_familiar_codigo: string | null;
  descripcion: string;
  estado: "pendiente" | "aceptada" | "completada";
  fecha_aceptacion: string | null;
  fecha_expiracion: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackageRequestWithDetails extends PackageRequest {
  solicitante_codigo?: string;
  aceptante_codigo?: string | null;
}

/**
 * Get the user's family unit code
 */
async function getUserFamilyUnit(): Promise<{ codigo: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { codigo: null, error: "Usuario no autenticado" };
    }

    const adminClient = createAdminClient();
    const { data: userUnidad, error: unidadError } = await adminClient
      .from("usuarios_unidades_familiares")
      .select("unidad_familiar_codigo")
      .eq("usuario_id", user.id)
      .single();

    if (unidadError || !userUnidad) {
      return { codigo: null, error: "No se encontró unidad familiar asociada" };
    }

    return { codigo: userUnidad.unidad_familiar_codigo, error: null };
  } catch (error) {
    console.error("Error en getUserFamilyUnit:", error);
    return {
      codigo: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Create a new package pickup request
 */
export async function createPackageRequest(
  descripcion: string
): Promise<{ data: PackageRequest | null; error: string | null }> {
  try {
    if (!descripcion || descripcion.trim().length === 0) {
      return { data: null, error: "La descripción es requerida" };
    }

    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: request, error: insertError } = await adminClient
      .from("solicitudes_paquetes")
      .insert({
        solicitante_unidad_familiar_codigo: codigo,
        descripcion: descripcion.trim(),
        estado: "pendiente",
      })
      .select()
      .single();

    if (insertError || !request) {
      console.error("Error al crear solicitud:", insertError);
      return {
        data: null,
        error: insertError?.message || "Error al crear la solicitud",
      };
    }

    return { data: request as PackageRequest, error: null };
  } catch (error) {
    console.error("Error en createPackageRequest:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Get all pending requests (excluding user's own requests)
 */
export async function getPendingRequests(): Promise<{
  data: PackageRequestWithDetails[];
  error: string | null;
}> {
  try {
    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: [], error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: requests, error: fetchError } = await adminClient
      .from("solicitudes_paquetes")
      .select("*")
      .eq("estado", "pendiente")
      .neq("solicitante_unidad_familiar_codigo", codigo)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error al obtener solicitudes pendientes:", fetchError);
      return {
        data: [],
        error: fetchError.message || "Error al obtener solicitudes pendientes",
      };
    }

    const requestsWithDetails: PackageRequestWithDetails[] = (requests || []).map((req) => ({
      ...req,
      solicitante_codigo: req.solicitante_unidad_familiar_codigo,
      aceptante_codigo: req.aceptante_unidad_familiar_codigo,
    }));

    return { data: requestsWithDetails, error: null };
  } catch (error) {
    console.error("Error en getPendingRequests:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Get user's own requests (as solicitante)
 */
export async function getMyRequests(): Promise<{
  data: PackageRequestWithDetails[];
  error: string | null;
}> {
  try {
    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: [], error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: requests, error: fetchError } = await adminClient
      .from("solicitudes_paquetes")
      .select("*")
      .eq("solicitante_unidad_familiar_codigo", codigo)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error al obtener mis solicitudes:", fetchError);
      return {
        data: [],
        error: fetchError.message || "Error al obtener mis solicitudes",
      };
    }

    const requestsWithDetails: PackageRequestWithDetails[] = (requests || []).map((req) => ({
      ...req,
      solicitante_codigo: req.solicitante_unidad_familiar_codigo,
      aceptante_codigo: req.aceptante_unidad_familiar_codigo,
    }));

    return { data: requestsWithDetails, error: null };
  } catch (error) {
    console.error("Error en getMyRequests:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Get accepted requests where user is involved (solicitante or aceptante)
 * Only shows non-expired requests
 */
export async function getAcceptedRequests(): Promise<{
  data: PackageRequestWithDetails[];
  error: string | null;
}> {
  try {
    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: [], error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: requests, error: fetchError } = await adminClient
      .from("solicitudes_paquetes")
      .select("*")
      .eq("estado", "aceptada")
      .or(
        `solicitante_unidad_familiar_codigo.eq.${codigo},aceptante_unidad_familiar_codigo.eq.${codigo}`
      )
      .gt("fecha_expiracion", new Date().toISOString())
      .order("fecha_aceptacion", { ascending: false });

    if (fetchError) {
      console.error("Error al obtener solicitudes aceptadas:", fetchError);
      return {
        data: [],
        error: fetchError.message || "Error al obtener solicitudes aceptadas",
      };
    }

    const requestsWithDetails: PackageRequestWithDetails[] = (requests || []).map((req) => ({
      ...req,
      solicitante_codigo: req.solicitante_unidad_familiar_codigo,
      aceptante_codigo: req.aceptante_unidad_familiar_codigo,
    }));

    return { data: requestsWithDetails, error: null };
  } catch (error) {
    console.error("Error en getAcceptedRequests:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Accept a pending request
 */
export async function acceptRequest(
  requestId: string
): Promise<{ data: PackageRequest | null; error: string | null }> {
  try {
    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();

    // First, verify the request exists and is pending, and user is not the solicitante
    const { data: existingRequest, error: fetchError } = await adminClient
      .from("solicitudes_paquetes")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !existingRequest) {
      return { data: null, error: "La solicitud no existe" };
    }

    if (existingRequest.estado !== "pendiente") {
      return { data: null, error: "La solicitud ya no está pendiente" };
    }

    if (existingRequest.solicitante_unidad_familiar_codigo === codigo) {
      return { data: null, error: "No puedes aceptar tu propia solicitud" };
    }

    // Update the request
    const fechaAceptacion = new Date().toISOString();
    const { data: updatedRequest, error: updateError } = await adminClient
      .from("solicitudes_paquetes")
      .update({
        estado: "aceptada",
        aceptante_unidad_familiar_codigo: codigo,
        fecha_aceptacion: fechaAceptacion,
        fecha_expiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month from now
      })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError || !updatedRequest) {
      console.error("Error al aceptar solicitud:", updateError);
      return {
        data: null,
        error: updateError?.message || "Error al aceptar la solicitud",
      };
    }

    return { data: updatedRequest as PackageRequest, error: null };
  } catch (error) {
    console.error("Error en acceptRequest:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
