"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Vivienda {
  tipo: "vivienda";
  codigo: string;
  porcentaje_participacion: number;
  numero_planta: number;
  escalera: string;
  superficie_util: number;
  superficie_construida: number;
}

export interface Garaje {
  tipo: "garaje";
  codigo: string;
  porcentaje_participacion: number;
  numero_planta: number;
  superficie_util: number;
  superficie_construida: number;
}

export interface Trastero {
  tipo: "trastero";
  codigo: string;
  porcentaje_participacion: number;
  numero_planta: number;
  superficie_util: number;
  superficie_construida: number;
}

export type UserPossession = Vivienda | Garaje | Trastero;

export interface UserPossessions {
  vivienda: Vivienda | null;
  garajes: Garaje[];
  trasteros: Trastero[];
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
      .select("codigo, porcentaje_participacion, numero_planta, escalera, superficie_util, superficie_construida")
      .eq("codigo", unidadFamiliarCodigo)
      .single();

    if (viviendaError || !vivienda) {
      return { data: null, error: "No se encontró la vivienda asociada" };
    }

    // Get all garajes for this unidad_familiar
    const { data: garajes, error: garajesError } = await adminClient
      .from("garajes")
      .select("codigo, porcentaje_participacion, numero_planta, superficie_util, superficie_construida")
      .eq("unidad_familiar_codigo", unidadFamiliarCodigo)
      .order("codigo", { ascending: true });

    if (garajesError) {
      return { data: null, error: `Error al obtener garajes: ${garajesError.message}` };
    }

    // Get all trasteros for this unidad_familiar
    const { data: trasteros, error: trasterosError } = await adminClient
      .from("trasteros")
      .select("codigo, porcentaje_participacion, numero_planta, superficie_util, superficie_construida")
      .eq("unidad_familiar_codigo", unidadFamiliarCodigo)
      .order("codigo", { ascending: true });

    if (trasterosError) {
      return { data: null, error: `Error al obtener trasteros: ${trasterosError.message}` };
    }

    return {
      data: {
        vivienda: {
          tipo: "vivienda",
          codigo: vivienda.codigo,
          porcentaje_participacion: Number(vivienda.porcentaje_participacion),
          numero_planta: Number(vivienda.numero_planta),
          escalera: vivienda.escalera || 'A',
          superficie_util: Number(vivienda.superficie_util),
          superficie_construida: Number(vivienda.superficie_construida),
        },
        garajes: (garajes || []).map((g) => ({
          tipo: "garaje" as const,
          codigo: g.codigo,
          porcentaje_participacion: Number(g.porcentaje_participacion),
          numero_planta: Number(g.numero_planta),
          superficie_util: Number(g.superficie_util),
          superficie_construida: Number(g.superficie_construida),
        })),
        trasteros: (trasteros || []).map((t) => ({
          tipo: "trastero" as const,
          codigo: t.codigo,
          porcentaje_participacion: Number(t.porcentaje_participacion),
          numero_planta: Number(t.numero_planta),
          superficie_util: Number(t.superficie_util),
          superficie_construida: Number(t.superficie_construida),
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
