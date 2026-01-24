"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UserPossession {
  codigo: string;
  porcentaje_participacion: number;
}

export interface UserPossessions {
  vivienda: UserPossession | null;
  garajes: UserPossession[];
  trasteros: UserPossession[];
}

export async function getUserPossessions(): Promise<{ data: UserPossessions | null; error: string | null }> {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Get user's unidad_familiar
    const { data: userUnidad, error: unidadError } = await adminClient
      .from("usuarios_unidades_familiares")
      .select("unidad_familiar_codigo")
      .eq("usuario_id", user.id)
      .single();

    if (unidadError || !userUnidad) {
      return { data: null, error: "No se encontró unidad familiar asociada" };
    }

    const unidadFamiliarCodigo = userUnidad.unidad_familiar_codigo;

    // Get vivienda (the unidad_familiar codigo is the vivienda codigo)
    const { data: vivienda, error: viviendaError } = await adminClient
      .from("viviendas")
      .select("codigo, porcentaje_participacion")
      .eq("codigo", unidadFamiliarCodigo)
      .single();

    if (viviendaError || !vivienda) {
      return { data: null, error: "No se encontró la vivienda asociada" };
    }

    // Get all garajes for this unidad_familiar
    const { data: garajes, error: garajesError } = await adminClient
      .from("garajes")
      .select("codigo, porcentaje_participacion")
      .eq("unidad_familiar_codigo", unidadFamiliarCodigo)
      .order("codigo", { ascending: true });

    if (garajesError) {
      return { data: null, error: `Error al obtener garajes: ${garajesError.message}` };
    }

    // Get all trasteros for this unidad_familiar
    const { data: trasteros, error: trasterosError } = await adminClient
      .from("trasteros")
      .select("codigo, porcentaje_participacion")
      .eq("unidad_familiar_codigo", unidadFamiliarCodigo)
      .order("codigo", { ascending: true });

    if (trasterosError) {
      return { data: null, error: `Error al obtener trasteros: ${trasterosError.message}` };
    }

    return {
      data: {
        vivienda: {
          codigo: vivienda.codigo,
          porcentaje_participacion: Number(vivienda.porcentaje_participacion),
        },
        garajes: (garajes || []).map((g) => ({
          codigo: g.codigo,
          porcentaje_participacion: Number(g.porcentaje_participacion),
        })),
        trasteros: (trasteros || []).map((t) => ({
          codigo: t.codigo,
          porcentaje_participacion: Number(t.porcentaje_participacion),
        })),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error en getUserPossessions:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido al obtener datos",
    };
  }
}
