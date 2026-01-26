"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PackageRequest {
  id: string;
  solicitante_usuario_id: string | null;
  solicitante_unidad_familiar_codigo: string;
  aceptante_usuario_id: string | null;
  aceptante_unidad_familiar_codigo: string | null;
  descripcion: string;
  estado: "pendiente" | "aceptada" | "completada" | "cancelada";
  fecha_aceptacion: string | null;
  fecha_expiracion: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackageRequestWithDetails extends PackageRequest {
  solicitante_codigo?: string;
  aceptante_codigo?: string | null;
  solicitante_display?: string;
  aceptante_display?: string | null;
  isRequester?: boolean;
}

/**
 * Get user display name including family unit
 */
async function getUserDisplayName(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  unidadCodigo: string,
  cache: Map<string, string>
): Promise<string> {
  if (cache.has(userId)) {
    return cache.get(userId)!;
  }

  let nombre = "Vecino";

  try {
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      console.error("Error al obtener usuario:", userError);
    } else {
      const user = userData.user;
      const telefono = (user.user_metadata as { phone?: string } | undefined)?.phone || user.phone;

      if (telefono) {
        const { data: telefonoData, error: telefonoError } = await adminClient
          .from("telefonos_validos")
          .select("nombre")
          .eq("telefono", telefono)
          .single();

        if (!telefonoError && telefonoData?.nombre) {
          nombre = telefonoData.nombre;
        } else if (telefonoError && telefonoError.code !== "PGRST116") {
          console.error("Error al obtener nombre:", telefonoError);
        }
      }
    }
  } catch (error) {
    console.error("Error en getUserDisplayName:", error);
  }

  const display = `${nombre} (${unidadCodigo})`;
  cache.set(userId, display);
  return display;
}

/**
 * Get the user's family unit code and user id
 */
async function getCurrentUserContext(): Promise<{
  userId: string | null;
  familyCode: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { userId: null, familyCode: null, error: "Usuario no autenticado" };
    }

    const adminClient = createAdminClient();
    const { data: userUnidad, error: unidadError } = await adminClient
      .from("usuarios_unidades_familiares")
      .select("unidad_familiar_codigo")
      .eq("usuario_id", user.id)
      .single();

    if (unidadError || !userUnidad) {
      return { userId: null, familyCode: null, error: "No se encontró unidad familiar asociada" };
    }

    return { userId: user.id, familyCode: userUnidad.unidad_familiar_codigo, error: null };
  } catch (error) {
    console.error("Error en getCurrentUserContext:", error);
    return {
      userId: null,
      familyCode: null,
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

    const { userId, familyCode, error } = await getCurrentUserContext();
    if (error || !userId || !familyCode) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: request, error: insertError } = await adminClient
      .from("solicitudes_paquetes")
      .insert({
        solicitante_usuario_id: userId,
        solicitante_unidad_familiar_codigo: familyCode,
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
    const { familyCode, error } = await getCurrentUserContext();
    if (error || !familyCode) {
      return { data: [], error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: requests, error: fetchError } = await adminClient
      .from("solicitudes_paquetes")
      .select("*")
      .eq("estado", "pendiente")
      .neq("solicitante_unidad_familiar_codigo", familyCode)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error al obtener solicitudes pendientes:", fetchError);
      return {
        data: [],
        error: fetchError.message || "Error al obtener solicitudes pendientes",
      };
    }

    const displayCache = new Map<string, string>();
    const requestsWithDetails: PackageRequestWithDetails[] = await Promise.all(
      (requests || []).map(async (req) => ({
        ...req,
        solicitante_codigo: req.solicitante_unidad_familiar_codigo,
        aceptante_codigo: req.aceptante_unidad_familiar_codigo,
        isRequester: false,
        solicitante_display: req.solicitante_usuario_id
          ? await getUserDisplayName(
              adminClient,
              req.solicitante_usuario_id,
              req.solicitante_unidad_familiar_codigo,
              displayCache
            )
          : req.solicitante_unidad_familiar_codigo,
        aceptante_display:
          req.aceptante_usuario_id && req.aceptante_unidad_familiar_codigo
            ? await getUserDisplayName(
                adminClient,
                req.aceptante_usuario_id,
                req.aceptante_unidad_familiar_codigo,
                displayCache
              )
            : req.aceptante_unidad_familiar_codigo,
      }))
    );

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
    const { familyCode, error } = await getCurrentUserContext();
    if (error || !familyCode) {
      return { data: [], error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: requests, error: fetchError } = await adminClient
      .from("solicitudes_paquetes")
      .select("*")
      .or(
        `solicitante_unidad_familiar_codigo.eq.${familyCode},aceptante_unidad_familiar_codigo.eq.${familyCode}`
      )
      .in("estado", ["pendiente", "aceptada"])
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error al obtener mis solicitudes:", fetchError);
      return {
        data: [],
        error: fetchError.message || "Error al obtener mis solicitudes",
      };
    }

    const displayCache = new Map<string, string>();
    const requestsWithDetails: PackageRequestWithDetails[] = await Promise.all(
      (requests || []).map(async (req) => ({
        ...req,
        solicitante_codigo: req.solicitante_unidad_familiar_codigo,
        aceptante_codigo: req.aceptante_unidad_familiar_codigo,
        isRequester: req.solicitante_unidad_familiar_codigo === familyCode,
        solicitante_display: req.solicitante_usuario_id
          ? await getUserDisplayName(
              adminClient,
              req.solicitante_usuario_id,
              req.solicitante_unidad_familiar_codigo,
              displayCache
            )
          : req.solicitante_unidad_familiar_codigo,
        aceptante_display:
          req.aceptante_usuario_id && req.aceptante_unidad_familiar_codigo
            ? await getUserDisplayName(
                adminClient,
                req.aceptante_usuario_id,
                req.aceptante_unidad_familiar_codigo,
                displayCache
              )
            : req.aceptante_unidad_familiar_codigo,
      }))
    );

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
    const { familyCode, error } = await getCurrentUserContext();
    if (error || !familyCode) {
      return { data: [], error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: requests, error: fetchError } = await adminClient
      .from("solicitudes_paquetes")
      .select("*")
      .eq("estado", "aceptada")
      .or(
        `solicitante_unidad_familiar_codigo.eq.${familyCode},aceptante_unidad_familiar_codigo.eq.${familyCode}`
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

    const displayCache = new Map<string, string>();
    const requestsWithDetails: PackageRequestWithDetails[] = await Promise.all(
      (requests || []).map(async (req) => ({
        ...req,
        solicitante_codigo: req.solicitante_unidad_familiar_codigo,
        aceptante_codigo: req.aceptante_unidad_familiar_codigo,
        isRequester: req.solicitante_unidad_familiar_codigo === familyCode,
        solicitante_display: req.solicitante_usuario_id
          ? await getUserDisplayName(
              adminClient,
              req.solicitante_usuario_id,
              req.solicitante_unidad_familiar_codigo,
              displayCache
            )
          : req.solicitante_unidad_familiar_codigo,
        aceptante_display:
          req.aceptante_usuario_id && req.aceptante_unidad_familiar_codigo
            ? await getUserDisplayName(
                adminClient,
                req.aceptante_usuario_id,
                req.aceptante_unidad_familiar_codigo,
                displayCache
              )
            : req.aceptante_unidad_familiar_codigo,
      }))
    );

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
    const { userId, familyCode, error } = await getCurrentUserContext();
    if (error || !userId || !familyCode) {
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

    if (existingRequest.solicitante_unidad_familiar_codigo === familyCode) {
      return { data: null, error: "No puedes aceptar tu propia solicitud" };
    }

    // Update the request
    const fechaAceptacion = new Date().toISOString();
    const { data: updatedRequest, error: updateError } = await adminClient
      .from("solicitudes_paquetes")
      .update({
        estado: "aceptada",
        aceptante_usuario_id: userId,
        aceptante_unidad_familiar_codigo: familyCode,
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

/**
 * Cancel a pending request (only solicitante)
 */
export async function cancelRequest(
  requestId: string
): Promise<{ data: PackageRequest | null; error: string | null }> {
  try {
    const { userId, familyCode, error } = await getCurrentUserContext();
    if (error || !userId || !familyCode) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: existingRequest, error: fetchError } = await adminClient
      .from("solicitudes_paquetes")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !existingRequest) {
      return { data: null, error: "La solicitud no existe" };
    }

    if (existingRequest.estado !== "pendiente") {
      return { data: null, error: "Solo puedes cancelar solicitudes pendientes" };
    }

    if (existingRequest.solicitante_unidad_familiar_codigo !== familyCode) {
      return { data: null, error: "No puedes cancelar esta solicitud" };
    }

    const { data: updatedRequest, error: updateError } = await adminClient
      .from("solicitudes_paquetes")
      .update({ estado: "cancelada" })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError || !updatedRequest) {
      console.error("Error al cancelar solicitud:", updateError);
      return {
        data: null,
        error: updateError?.message || "Error al cancelar la solicitud",
      };
    }

    return { data: updatedRequest as PackageRequest, error: null };
  } catch (error) {
    console.error("Error en cancelRequest:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Mark an accepted request as completed (only solicitante)
 */
export async function completeRequest(
  requestId: string
): Promise<{ data: PackageRequest | null; error: string | null }> {
  try {
    const { userId, familyCode, error } = await getCurrentUserContext();
    if (error || !userId || !familyCode) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: existingRequest, error: fetchError } = await adminClient
      .from("solicitudes_paquetes")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !existingRequest) {
      return { data: null, error: "La solicitud no existe" };
    }

    if (existingRequest.estado !== "aceptada") {
      return { data: null, error: "Solo puedes completar solicitudes aceptadas" };
    }

    if (existingRequest.solicitante_unidad_familiar_codigo !== familyCode) {
      return { data: null, error: "No puedes completar esta solicitud" };
    }

    const { data: updatedRequest, error: updateError } = await adminClient
      .from("solicitudes_paquetes")
      .update({ estado: "completada" })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError || !updatedRequest) {
      console.error("Error al completar solicitud:", updateError);
      return {
        data: null,
        error: updateError?.message || "Error al completar la solicitud",
      };
    }

    return { data: updatedRequest as PackageRequest, error: null };
  } catch (error) {
    console.error("Error en completeRequest:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
