"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPollOptionAssetPath,
  createPollOptionDownloadUrl,
  createPollOptionUploadUrl,
} from "@/lib/supabase/storage";

export interface Encuesta {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: "activa" | "finalizada";
  autor_usuario_id: string;
  autor_unidad_familiar_codigo: string;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EncuestaOpcion {
  id: string;
  encuesta_id: string;
  texto: string | null;
  archivo_path: string | null;
  archivo_mime_type: string | null;
  orden: number;
  created_at: string;
  download_url?: string | null;
  votos?: number;
  porcentaje?: number;
}

export interface EncuestaResumen extends Encuesta {
  opciones_count: number;
  votos_count: number;
}

const MAX_OPTION_ASSET_SIZE = 10 * 1024 * 1024;
const ALLOWED_ASSET_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

async function getCurrentUserContext(): Promise<{
  userId: string | null;
  familyCode: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        userId: null,
        familyCode: null,
        error: "Usuario no autenticado",
      };
    }

    const adminClient = createAdminClient();
    const { data: userUnidad, error: unidadError } = await adminClient
      .from("usuarios_unidades_familiares")
      .select("unidad_familiar_codigo")
      .eq("usuario_id", user.id)
      .single();

    if (unidadError || !userUnidad) {
      return {
        userId: null,
        familyCode: null,
        error: "No se encontró unidad familiar asociada",
      };
    }

    return {
      userId: user.id,
      familyCode: userUnidad.unidad_familiar_codigo,
      error: null,
    };
  } catch (error) {
    console.error("Error en getCurrentUserContext:", error);
    return {
      userId: null,
      familyCode: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

function getCutoffDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString();
}

export async function getActivePolls(): Promise<{
  data: EncuestaResumen[];
  error: string | null;
}> {
  try {
    const adminClient = createAdminClient();
    const cutoffDate = getCutoffDate();
    const { data, error } = await adminClient
      .from("encuestas")
      .select("*")
      .or(
        `estado.eq.activa,and(estado.eq.finalizada,finalized_at.gte.${cutoffDate})`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener encuestas:", error);
      return { data: [], error: error.message || "Error al obtener encuestas" };
    }

    const encuestas = (data || []) as Encuesta[];
    if (encuestas.length === 0) {
      return { data: [], error: null };
    }

    const encuestaIds = encuestas.map((encuesta) => encuesta.id);
    const [opcionesResult, votosResult] = await Promise.all([
      adminClient
        .from("encuesta_opciones")
        .select("encuesta_id")
        .in("encuesta_id", encuestaIds),
      adminClient
        .from("encuesta_votos")
        .select("encuesta_id")
        .in("encuesta_id", encuestaIds),
    ]);

    const opcionesCount = new Map<string, number>();
    (opcionesResult.data || []).forEach((row) => {
      const encuestaId = (row as { encuesta_id?: string }).encuesta_id;
      if (!encuestaId) return;
      opcionesCount.set(encuestaId, (opcionesCount.get(encuestaId) ?? 0) + 1);
    });

    const votosCount = new Map<string, number>();
    (votosResult.data || []).forEach((row) => {
      const encuestaId = (row as { encuesta_id?: string }).encuesta_id;
      if (!encuestaId) return;
      votosCount.set(encuestaId, (votosCount.get(encuestaId) ?? 0) + 1);
    });

    const result = encuestas.map((encuesta) => ({
      ...(encuesta as Encuesta),
      opciones_count: opcionesCount.get(encuesta.id) ?? 0,
      votos_count: votosCount.get(encuesta.id) ?? 0,
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error("Error en getActivePolls:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getPollDetail(pollId: string): Promise<{
  data: {
    encuesta: Encuesta;
    opciones: EncuestaOpcion[];
    totalVotos: number;
    hasVoted: boolean;
    selectedOptionId: string | null;
    isCreator: boolean;
  } | null;
  error: string | null;
}> {
  try {
    if (!pollId) {
      return { data: null, error: "Encuesta inválida" };
    }

    const adminClient = createAdminClient();
    const { data: encuesta, error: encuestaError } = await adminClient
      .from("encuestas")
      .select("*")
      .eq("id", pollId)
      .single();

    if (encuestaError || !encuesta) {
      return { data: null, error: "No se encontró la encuesta" };
    }

    const { data: opcionesRaw, error: opcionesError } = await adminClient
      .from("encuesta_opciones")
      .select("*")
      .eq("encuesta_id", pollId)
      .order("orden", { ascending: true });

    if (opcionesError) {
      console.error("Error al obtener opciones:", opcionesError);
      return {
        data: null,
        error: opcionesError.message || "Error al obtener opciones",
      };
    }

    const { data: votosRaw, error: votosError } = await adminClient
      .from("encuesta_votos")
      .select("opcion_id, unidad_familiar_codigo")
      .eq("encuesta_id", pollId);

    if (votosError) {
      console.error("Error al obtener votos:", votosError);
      return {
        data: null,
        error: votosError.message || "Error al obtener votos",
      };
    }

    const votosCount = new Map<string, number>();
    (votosRaw || []).forEach((row) => {
      const opcionId = (row as { opcion_id?: string }).opcion_id;
      if (!opcionId) return;
      votosCount.set(opcionId, (votosCount.get(opcionId) ?? 0) + 1);
    });

    const totalVotos = votosRaw?.length ?? 0;

    const opcionesWithUrls = await Promise.all(
      (opcionesRaw || []).map(async (opcion) => {
        let downloadUrl: string | null = null;
        if ((opcion as EncuestaOpcion).archivo_path) {
          try {
            downloadUrl = await createPollOptionDownloadUrl({
              path: (opcion as EncuestaOpcion).archivo_path!,
              expiresIn: 60 * 10,
            });
          } catch (error) {
            console.error("Error al generar URL de opción:", error);
          }
        }

        const votos = votosCount.get((opcion as EncuestaOpcion).id) ?? 0;
        const porcentaje =
          totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;

        return {
          ...(opcion as EncuestaOpcion),
          download_url: downloadUrl,
          votos,
          porcentaje,
        };
      }),
    );

    const {
      userId,
      familyCode,
      error: userError,
    } = await getCurrentUserContext();
    if (userError || !userId || !familyCode) {
      return {
        data: null,
        error: userError || "No se pudo obtener el usuario",
      };
    }

    const { data: votoRows, error: votoError } = await adminClient
      .from("encuesta_votos")
      .select("opcion_id")
      .eq("encuesta_id", pollId)
      .eq("unidad_familiar_codigo", familyCode)
      .limit(1);

    if (votoError) {
      console.error("Error al comprobar voto:", votoError);
    }

    const selectedOptionId = votoRows?.[0]?.opcion_id ?? null;
    const hasVoted = Boolean(selectedOptionId);
    const isCreator = (encuesta as Encuesta).autor_usuario_id === userId;

    return {
      data: {
        encuesta: encuesta as Encuesta,
        opciones: opcionesWithUrls,
        totalVotos,
        hasVoted,
        selectedOptionId,
        isCreator,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error en getPollDetail:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function createPollOptionUpload(params: {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<{
  data: { uploadUrl: string; r2Key: string } | null;
  error: string | null;
}> {
  try {
    if (!params.fileName?.trim()) {
      return { data: null, error: "Nombre de archivo inválido" };
    }

    if (!ALLOWED_ASSET_TYPES.has(params.contentType)) {
      return { data: null, error: "Tipo de archivo no permitido" };
    }

    if (params.sizeBytes > MAX_OPTION_ASSET_SIZE) {
      return { data: null, error: "El archivo supera el tamaño permitido" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    const r2Key = buildPollOptionAssetPath(user.id, params.fileName);
    const uploadUrl = await createPollOptionUploadUrl({ path: r2Key });

    return { data: { uploadUrl, r2Key }, error: null };
  } catch (error) {
    console.error("Error en createPollOptionUpload:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function createPoll(params: {
  titulo: string;
  descripcion?: string;
  opciones: {
    texto?: string;
    asset?: { path: string; mimeType: string; sizeBytes: number } | null;
  }[];
}): Promise<{ data: Encuesta | null; error: string | null }> {
  try {
    const titulo = params.titulo?.trim();
    if (!titulo) {
      return { data: null, error: "El título es obligatorio" };
    }

    if (!params.opciones || params.opciones.length < 2) {
      return { data: null, error: "Añade al menos dos opciones" };
    }

    const { userId, familyCode, error } = await getCurrentUserContext();
    if (error || !userId || !familyCode) {
      return { data: null, error: error || "No se pudo obtener el usuario" };
    }

    const opcionesNormalizadas = params.opciones.map((opcion) => {
      const texto = opcion.texto?.trim();
      const asset = opcion.asset ?? null;
      if (!texto) {
        throw new Error("Cada opción debe tener texto");
      }
      if (asset) {
        if (!ALLOWED_ASSET_TYPES.has(asset.mimeType)) {
          throw new Error("Tipo de archivo no permitido");
        }
        if (asset.sizeBytes > MAX_OPTION_ASSET_SIZE) {
          throw new Error("Algún archivo supera el tamaño permitido");
        }
      }
      return {
        texto,
        archivo_path: asset?.path ?? null,
        archivo_mime_type: asset?.mimeType ?? null,
      };
    });

    const adminClient = createAdminClient();
    const { data: encuesta, error: insertError } = await adminClient
      .from("encuestas")
      .insert({
        titulo,
        descripcion: params.descripcion?.trim() || null,
        estado: "activa",
        autor_usuario_id: userId,
        autor_unidad_familiar_codigo: familyCode,
      })
      .select("*")
      .single();

    if (insertError || !encuesta) {
      console.error("Error al crear encuesta:", insertError);
      return {
        data: null,
        error: insertError?.message || "Error al crear encuesta",
      };
    }

    const opcionesToInsert = opcionesNormalizadas.map((opcion, index) => ({
      encuesta_id: (encuesta as Encuesta).id,
      texto: opcion.texto,
      archivo_path: opcion.archivo_path,
      archivo_mime_type: opcion.archivo_mime_type,
      orden: index,
    }));

    const { error: opcionesError } = await adminClient
      .from("encuesta_opciones")
      .insert(opcionesToInsert);

    if (opcionesError) {
      console.error("Error al crear opciones:", opcionesError);
      return {
        data: encuesta as Encuesta,
        error: opcionesError.message || "Error al crear opciones",
      };
    }

    return { data: encuesta as Encuesta, error: null };
  } catch (error) {
    console.error("Error en createPoll:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function votePoll(
  pollId: string,
  optionId: string,
): Promise<{ data: { success: boolean } | null; error: string | null }> {
  try {
    if (!pollId || !optionId) {
      return { data: null, error: "Datos inválidos" };
    }

    const { userId, familyCode, error } = await getCurrentUserContext();
    if (error || !userId || !familyCode) {
      return { data: null, error: error || "No se pudo obtener el usuario" };
    }

    const adminClient = createAdminClient();
    const { data: encuesta, error: encuestaError } = await adminClient
      .from("encuestas")
      .select("estado, finalized_at")
      .eq("id", pollId)
      .single();

    if (encuestaError || !encuesta) {
      return { data: null, error: "No se encontró la encuesta" };
    }

    if (
      (encuesta as Pick<Encuesta, "estado" | "finalized_at">).estado !==
        "activa" ||
      (encuesta as Pick<Encuesta, "estado" | "finalized_at">).finalized_at
    ) {
      return { data: null, error: "La encuesta ya está finalizada" };
    }

    const { data: votoExistente, error: votoError } = await adminClient
      .from("encuesta_votos")
      .select("id")
      .eq("encuesta_id", pollId)
      .eq("unidad_familiar_codigo", familyCode)
      .limit(1);

    if (votoError) {
      console.error("Error al comprobar voto:", votoError);
      return { data: null, error: "No se pudo validar el voto" };
    }

    if (votoExistente && votoExistente.length > 0) {
      return { data: null, error: "Tu unidad familiar ya ha votado" };
    }

    const { data: opcion, error: opcionError } = await adminClient
      .from("encuesta_opciones")
      .select("id")
      .eq("id", optionId)
      .eq("encuesta_id", pollId)
      .single();

    if (opcionError || !opcion) {
      return { data: null, error: "La opción no es válida" };
    }

    const { error: insertError } = await adminClient
      .from("encuesta_votos")
      .insert({
        encuesta_id: pollId,
        opcion_id: optionId,
        usuario_id: userId,
        unidad_familiar_codigo: familyCode,
      });

    if (insertError) {
      console.error("Error al votar:", insertError);
      return {
        data: null,
        error: insertError.message || "Error al registrar el voto",
      };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Error en votePoll:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function finalizePoll(
  pollId: string,
): Promise<{ data: Encuesta | null; error: string | null }> {
  try {
    if (!pollId) {
      return { data: null, error: "Encuesta inválida" };
    }

    const { userId, error } = await getCurrentUserContext();
    if (error || !userId) {
      return { data: null, error: error || "No se pudo obtener el usuario" };
    }

    const adminClient = createAdminClient();
    const { data: encuesta, error: encuestaError } = await adminClient
      .from("encuestas")
      .select("autor_usuario_id, estado")
      .eq("id", pollId)
      .single();

    if (encuestaError || !encuesta) {
      return { data: null, error: "No se encontró la encuesta" };
    }

    if (
      (encuesta as { autor_usuario_id: string }).autor_usuario_id !== userId
    ) {
      return { data: null, error: "No tienes permisos para finalizarla" };
    }

    if ((encuesta as { estado: string }).estado === "finalizada") {
      return { data: encuesta as Encuesta, error: null };
    }

    const { data: updated, error: updateError } = await adminClient
      .from("encuestas")
      .update({
        estado: "finalizada",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", pollId)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Error al finalizar encuesta:", updateError);
      return {
        data: null,
        error: updateError?.message || "Error al finalizar encuesta",
      };
    }

    return { data: updated as Encuesta, error: null };
  } catch (error) {
    console.error("Error en finalizePoll:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function deletePoll(
  pollId: string,
): Promise<{ data: { success: boolean } | null; error: string | null }> {
  try {
    if (!pollId) {
      return { data: null, error: "Encuesta inválida" };
    }

    const { userId, error } = await getCurrentUserContext();
    if (error || !userId) {
      return { data: null, error: error || "No se pudo obtener el usuario" };
    }

    const adminClient = createAdminClient();
    const { data: encuesta, error: encuestaError } = await adminClient
      .from("encuestas")
      .select("autor_usuario_id")
      .eq("id", pollId)
      .single();

    if (encuestaError || !encuesta) {
      return { data: null, error: "No se encontró la encuesta" };
    }

    if (
      (encuesta as { autor_usuario_id: string }).autor_usuario_id !== userId
    ) {
      return { data: null, error: "No tienes permisos para eliminarla" };
    }

    const { error: deleteError } = await adminClient
      .from("encuestas")
      .delete()
      .eq("id", pollId);

    if (deleteError) {
      console.error("Error al eliminar encuesta:", deleteError);
      return {
        data: null,
        error: deleteError.message || "Error al eliminar encuesta",
      };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Error en deletePoll:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
