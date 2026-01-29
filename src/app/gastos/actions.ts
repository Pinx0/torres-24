"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type GastoTipo = "real" | "presupuestado";
export type GastoPeriodicidad =
  | "puntual"
  | "mensual"
  | "bimensual"
  | "trimestral"
  | "semestral"
  | "anual";

export interface GastoCategoria {
  id: string;
  nombre: string;
  color: string | null;
  orden: number | null;
}

export interface GastoBase {
  id: string;
  categoria_id: string;
  descripcion: string;
  tipo: GastoTipo;
  periodicidad: GastoPeriodicidad;
  importe: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  created_at: string;
  updated_at: string;
  categoria: GastoCategoria | null;
}

export interface GastoCalculado extends GastoBase {
  mensual_comunidad: number;
  anual_comunidad: number;
  mensual_mi_parte: number;
  anual_mi_parte: number;
}

const MONTHLY_FACTORS: Record<GastoPeriodicidad, number> = {
  puntual: 1 / 12,
  mensual: 1,
  bimensual: 1 / 2,
  trimestral: 1 / 3,
  semestral: 1 / 6,
  anual: 1 / 12,
};

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeAmounts(importe: number, periodicidad: GastoPeriodicidad) {
  const mensual = importe * (MONTHLY_FACTORS[periodicidad] ?? 0);
  const anual =
    periodicidad === "puntual" || periodicidad === "anual" ? importe : mensual * 12;

  return {
    mensual,
    anual,
  };
}

export async function listGastos(): Promise<{
  data: { gastos: GastoCalculado[]; participacion: number } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    const adminClient = createAdminClient();
    const { data: userUnidad, error: unidadError } = await adminClient
      .from("usuarios_unidades_familiares")
      .select("unidad_familiar_codigo, unidades_familiares ( total_participacion )")
      .eq("usuario_id", user.id)
      .single();

    if (unidadError || !userUnidad) {
      return { data: null, error: "No se encontró unidad familiar asociada" };
    }

    const totalParticipacion = toNumber(
      (userUnidad as { unidades_familiares?: { total_participacion?: number | string | null } })
        .unidades_familiares?.total_participacion
    );
    const participacion = totalParticipacion / 100;

    const { data: gastosData, error: gastosError } = await adminClient
      .from("gastos")
      .select(
        "id, categoria_id, descripcion, tipo, periodicidad, importe, fecha_inicio, fecha_fin, created_at, updated_at, categoria:gastos_categoria(id, nombre, color, orden)"
      )
      .order("fecha_inicio", { ascending: false });

    if (gastosError) {
      console.error("Error al obtener gastos:", gastosError);
      return { data: null, error: gastosError.message || "Error al obtener gastos" };
    }

    const gastos = (gastosData || []).map((gasto) => {
      const importe = toNumber(gasto.importe);
      const periodicidad = gasto.periodicidad as GastoPeriodicidad;
      const { mensual, anual } = normalizeAmounts(importe, periodicidad);
      const mensualMiParte = mensual * participacion;
      const anualMiParte = anual * participacion;
      const categoria = Array.isArray(gasto.categoria)
        ? gasto.categoria[0]
        : gasto.categoria;

      return {
        id: gasto.id,
        categoria_id: gasto.categoria_id,
        descripcion: gasto.descripcion,
        tipo: gasto.tipo as GastoTipo,
        periodicidad,
        importe,
        fecha_inicio: gasto.fecha_inicio,
        fecha_fin: gasto.fecha_fin,
        created_at: gasto.created_at,
        updated_at: gasto.updated_at,
        categoria: categoria
          ? {
              id: categoria.id,
              nombre: categoria.nombre,
              color: categoria.color ?? null,
              orden: categoria.orden ?? null,
            }
          : null,
        mensual_comunidad: mensual,
        anual_comunidad: anual,
        mensual_mi_parte: mensualMiParte,
        anual_mi_parte: anualMiParte,
      } satisfies GastoCalculado;
    });

    return { data: { gastos, participacion }, error: null };
  } catch (error) {
    console.error("Error en listGastos:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
