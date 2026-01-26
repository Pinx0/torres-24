"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  estado: "activa" | "resuelta";
  autor_usuario_id: string;
  autor_unidad_familiar_codigo: string;
  autor_display?: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidenciaComentario {
  id: string;
  incidencia_id: string;
  autor_usuario_id: string;
  autor_unidad_familiar_codigo: string;
  autor_display?: string;
  mensaje: string;
  created_at: string;
}

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

export async function getIncidenciasByEstado(estado: "activa" | "resuelta"): Promise<{
  data: Incidencia[];
  error: string | null;
}> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("incidencias")
      .select("*")
      .eq("estado", estado)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener incidencias:", error);
      return { data: [], error: error.message || "Error al obtener incidencias" };
    }

    return { data: (data || []) as Incidencia[], error: null };
  } catch (error) {
    console.error("Error en getIncidenciasByEstado:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getIncidenciaDetalle(incidenciaId: string): Promise<{
  data: { incidencia: Incidencia; comentarios: IncidenciaComentario[] } | null;
  error: string | null;
}> {
  try {
    if (!incidenciaId) {
      return { data: null, error: "Incidencia inválida" };
    }

    const adminClient = createAdminClient();
    const { data: incidencia, error: incidenciaError } = await adminClient
      .from("incidencias")
      .select("*")
      .eq("id", incidenciaId)
      .single();

    if (incidenciaError || !incidencia) {
      return { data: null, error: "No se encontró la incidencia" };
    }

    const { data: comentarios, error: comentariosError } = await adminClient
      .from("incidencias_comentarios")
      .select("*")
      .eq("incidencia_id", incidenciaId)
      .order("created_at", { ascending: true });

    if (comentariosError) {
      console.error("Error al obtener comentarios:", comentariosError);
      return { data: null, error: comentariosError.message || "Error al obtener comentarios" };
    }

    const displayCache = new Map<string, string>();
    const incidenciaDisplay = await getUserDisplayName(
      adminClient,
      incidencia.autor_usuario_id,
      incidencia.autor_unidad_familiar_codigo,
      displayCache
    );

    const comentariosWithDisplay = await Promise.all(
      (comentarios || []).map(async (comentario) => ({
        ...(comentario as IncidenciaComentario),
        autor_display: await getUserDisplayName(
          adminClient,
          comentario.autor_usuario_id,
          comentario.autor_unidad_familiar_codigo,
          displayCache
        ),
      }))
    );

    return {
      data: {
        incidencia: {
          ...(incidencia as Incidencia),
          autor_display: incidenciaDisplay,
        },
        comentarios: comentariosWithDisplay,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error en getIncidenciaDetalle:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function createIncidencia(
  titulo: string,
  descripcion: string
): Promise<{ data: Incidencia | null; error: string | null }> {
  try {
    if (!titulo?.trim() || !descripcion?.trim()) {
      return { data: null, error: "El título y la explicación son obligatorios" };
    }

    const { userId, familyCode, error } = await getCurrentUserContext();
    if (error || !userId || !familyCode) {
      return { data: null, error: error || "No se pudo obtener el usuario" };
    }

    const adminClient = createAdminClient();
    const { data, error: insertError } = await adminClient
      .from("incidencias")
      .insert({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        estado: "activa",
        autor_usuario_id: userId,
        autor_unidad_familiar_codigo: familyCode,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      console.error("Error al crear incidencia:", insertError);
      return { data: null, error: insertError?.message || "Error al crear incidencia" };
    }

    return { data: data as Incidencia, error: null };
  } catch (error) {
    console.error("Error en createIncidencia:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function createIncidenciaComentario(
  incidenciaId: string,
  mensaje: string
): Promise<{ data: IncidenciaComentario | null; error: string | null }> {
  try {
    if (!incidenciaId) {
      return { data: null, error: "Incidencia inválida" };
    }

    if (!mensaje?.trim()) {
      return { data: null, error: "El comentario no puede estar vacío" };
    }

    const { userId, familyCode, error } = await getCurrentUserContext();
    if (error || !userId || !familyCode) {
      return { data: null, error: error || "No se pudo obtener el usuario" };
    }

    const adminClient = createAdminClient();
    const { data, error: insertError } = await adminClient
      .from("incidencias_comentarios")
      .insert({
        incidencia_id: incidenciaId,
        autor_usuario_id: userId,
        autor_unidad_familiar_codigo: familyCode,
        mensaje: mensaje.trim(),
      })
      .select("*")
      .single();

    if (insertError || !data) {
      console.error("Error al crear comentario:", insertError);
      return { data: null, error: insertError?.message || "Error al crear comentario" };
    }

    return { data: data as IncidenciaComentario, error: null };
  } catch (error) {
    console.error("Error en createIncidenciaComentario:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function updateIncidenciaEstado(
  incidenciaId: string,
  nuevoEstado: "activa" | "resuelta"
): Promise<{ data: Incidencia | null; error: string | null }> {
  try {
    if (!incidenciaId) {
      return { data: null, error: "Incidencia inválida" };
    }

    const { userId, error } = await getCurrentUserContext();
    if (error || !userId) {
      return { data: null, error: error || "No se pudo obtener el usuario" };
    }

    const adminClient = createAdminClient();
    const { data: incidencia, error: incidenciaError } = await adminClient
      .from("incidencias")
      .select("autor_usuario_id")
      .eq("id", incidenciaId)
      .single();

    if (incidenciaError || !incidencia) {
      return { data: null, error: "No se encontró la incidencia" };
    }

    if (incidencia.autor_usuario_id !== userId) {
      return { data: null, error: "No tienes permisos para actualizar esta incidencia" };
    }

    const resolvedAt = nuevoEstado === "resuelta" ? new Date().toISOString() : null;
    const { data: updated, error: updateError } = await adminClient
      .from("incidencias")
      .update({ estado: nuevoEstado, resolved_at: resolvedAt })
      .eq("id", incidenciaId)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Error al actualizar incidencia:", updateError);
      return { data: null, error: updateError?.message || "Error al actualizar incidencia" };
    }

    return { data: updated as Incidencia, error: null };
  } catch (error) {
    console.error("Error en updateIncidenciaEstado:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
