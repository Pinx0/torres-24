"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ParkingOffer {
  id: string;
  garaje_codigo: string;
  unidad_familiar_codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: "activa" | "ocupada" | "cancelada";
  created_at: string;
  updated_at: string;
  numero_planta?: number | null;
}

export interface ParkingRequest {
  id: string;
  oferta_id: string | null;
  solicitante_unidad_familiar_codigo: string;
  planta_solicitada: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: "pendiente" | "aceptada" | "cancelada";
  created_at: string;
  updated_at: string;
  solicitante_codigo?: string;
}

const MIN_SEGMENT_HOURS = 4;

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

function isValidRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start < end;
}

function segmentHours(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

/**
 * Get active parking offers (including user's own offers)
 */
export async function getParkingOffers(): Promise<{
  data: ParkingOffer[];
  error: string | null;
}> {
  try {
    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: [], error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: offers, error: fetchError } = await adminClient
      .from("ofertas_parking")
      .select("*, garajes(numero_planta)")
      .eq("estado", "activa")
      .order("fecha_inicio", { ascending: true });

    if (fetchError) {
      console.error("Error al obtener ofertas:", fetchError);
      return { data: [], error: fetchError.message || "Error al obtener ofertas" };
    }

    const offersWithDetails = (offers || []).map((offer) => ({
      ...offer,
      numero_planta: offer.garajes?.numero_planta ?? null,
    }));

    return { data: offersWithDetails as ParkingOffer[], error: null };
  } catch (error) {
    console.error("Error en getParkingOffers:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Get user's parking requests (as solicitante)
 */
export async function getParkingRequests(): Promise<{
  data: ParkingRequest[];
  error: string | null;
}> {
  try {
    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: [], error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: requests, error: fetchError } = await adminClient
      .from("solicitudes_parking")
      .select("*")
      .eq("solicitante_unidad_familiar_codigo", codigo)
      .neq("estado", "cancelada")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error al obtener solicitudes:", fetchError);
      return { data: [], error: fetchError.message || "Error al obtener solicitudes" };
    }

    const requestsWithDetails: ParkingRequest[] = (requests || []).map((req) => ({
      ...req,
      solicitante_codigo: req.solicitante_unidad_familiar_codigo,
    }));

    return { data: requestsWithDetails, error: null };
  } catch (error) {
    console.error("Error en getParkingRequests:", error);
    return {
      data: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Create a new parking offer
 */
export async function createParkingOffer(
  garajeCodigo: string,
  fechaInicio: string,
  fechaFin: string
): Promise<{ data: ParkingOffer | null; error: string | null }> {
  try {
    if (!garajeCodigo) {
      return { data: null, error: "Debes seleccionar una plaza de garaje" };
    }

    if (!isValidRange(fechaInicio, fechaFin)) {
      return { data: null, error: "El rango de fechas no es válido" };
    }

    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();

    // Verify the garage belongs to the user
    const { data: garaje, error: garajeError } = await adminClient
      .from("garajes")
      .select("codigo")
      .eq("codigo", garajeCodigo)
      .eq("unidad_familiar_codigo", codigo)
      .single();

    if (garajeError || !garaje) {
      return { data: null, error: "La plaza seleccionada no pertenece a tu unidad familiar" };
    }

    const { data: overlappingOffers, error: overlapError } = await adminClient
      .from("ofertas_parking")
      .select("id")
      .eq("garaje_codigo", garajeCodigo)
      .eq("estado", "activa")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio)
      .limit(1);

    if (overlapError) {
      console.error("Error al validar solapes:", overlapError);
      return { data: null, error: "Error al validar solapes de la oferta" };
    }

    if (overlappingOffers && overlappingOffers.length > 0) {
      return { data: null, error: "Ya existe una oferta para esa plaza que se solapa" };
    }

    const { data: offer, error: insertError } = await adminClient
      .from("ofertas_parking")
      .insert({
        garaje_codigo: garajeCodigo,
        unidad_familiar_codigo: codigo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: "activa",
      })
      .select()
      .single();

    if (insertError || !offer) {
      console.error("Error al crear oferta:", insertError);
      return { data: null, error: insertError?.message || "Error al crear la oferta" };
    }

    return { data: offer as ParkingOffer, error: null };
  } catch (error) {
    console.error("Error en createParkingOffer:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Create a new parking request (direct need)
 */
export async function createParkingRequest(
  plantaSolicitada: number,
  fechaInicio: string,
  fechaFin: string
): Promise<{ data: ParkingRequest | null; error: string | null }> {
  try {
    if (!Number.isFinite(plantaSolicitada)) {
      return { data: null, error: "La planta solicitada no es válida" };
    }

    if (!isValidRange(fechaInicio, fechaFin)) {
      return { data: null, error: "El rango de fechas no es válido" };
    }

    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: request, error: insertError } = await adminClient
      .from("solicitudes_parking")
      .insert({
        solicitante_unidad_familiar_codigo: codigo,
        planta_solicitada: plantaSolicitada,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: "pendiente",
      })
      .select()
      .single();

    if (insertError || !request) {
      console.error("Error al crear solicitud:", insertError);
      return { data: null, error: insertError?.message || "Error al crear la solicitud" };
    }

    return { data: request as ParkingRequest, error: null };
  } catch (error) {
    console.error("Error en createParkingRequest:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Accept a parking offer and optionally split remaining time slots
 */
export async function acceptParkingOffer(
  offerId: string,
  fechaInicio: string,
  fechaFin: string
): Promise<{ data: ParkingRequest | null; error: string | null }> {
  try {
    if (!isValidRange(fechaInicio, fechaFin)) {
      return { data: null, error: "El rango de fechas no es válido" };
    }

    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: offer, error: fetchError } = await adminClient
      .from("ofertas_parking")
      .select("*, garajes(numero_planta)")
      .eq("id", offerId)
      .single();

    if (fetchError || !offer) {
      return { data: null, error: "La oferta no existe" };
    }

    if (offer.estado !== "activa") {
      return { data: null, error: "La oferta ya no está disponible" };
    }

    if (offer.unidad_familiar_codigo === codigo) {
      return { data: null, error: "No puedes aceptar tu propia oferta" };
    }

    const offerStart = new Date(offer.fecha_inicio);
    const offerEnd = new Date(offer.fecha_fin);
    const acceptStart = new Date(fechaInicio);
    const acceptEnd = new Date(fechaFin);

    if (acceptStart < offerStart || acceptEnd > offerEnd) {
      return { data: null, error: "El tramo seleccionado está fuera de la oferta" };
    }

    const { data: request, error: insertError } = await adminClient
      .from("solicitudes_parking")
      .insert({
        oferta_id: offer.id,
        solicitante_unidad_familiar_codigo: codigo,
        planta_solicitada: Number(offer.garajes?.numero_planta ?? 0),
        fecha_inicio: acceptStart.toISOString(),
        fecha_fin: acceptEnd.toISOString(),
        estado: "aceptada",
      })
      .select()
      .single();

    if (insertError || !request) {
      console.error("Error al aceptar oferta:", insertError);
      return { data: null, error: insertError?.message || "Error al aceptar la oferta" };
    }

    const remainingSegments: Array<{ inicio: Date; fin: Date }> = [];

    if (offerStart < acceptStart) {
      remainingSegments.push({ inicio: offerStart, fin: acceptStart });
    }

    if (acceptEnd < offerEnd) {
      remainingSegments.push({ inicio: acceptEnd, fin: offerEnd });
    }

    const validSegments = remainingSegments.filter(
      (segment) => segmentHours(segment.inicio, segment.fin) >= MIN_SEGMENT_HOURS
    );

    if (validSegments.length > 0) {
      await adminClient.from("ofertas_parking").insert(
        validSegments.map((segment) => ({
          garaje_codigo: offer.garaje_codigo,
          unidad_familiar_codigo: offer.unidad_familiar_codigo,
          fecha_inicio: segment.inicio.toISOString(),
          fecha_fin: segment.fin.toISOString(),
          estado: "activa",
        }))
      );
    }

    await adminClient
      .from("ofertas_parking")
      .update({ estado: "ocupada" })
      .eq("id", offer.id);

    return { data: request as ParkingRequest, error: null };
  } catch (error) {
    console.error("Error en acceptParkingOffer:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Cancel a parking request created by the user
 */
export async function cancelParkingRequest(
  requestId: string
): Promise<{ data: ParkingRequest | null; error: string | null }> {
  try {
    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: existingRequest, error: fetchError } = await adminClient
      .from("solicitudes_parking")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !existingRequest) {
      return { data: null, error: "La solicitud no existe" };
    }

    if (existingRequest.solicitante_unidad_familiar_codigo !== codigo) {
      return { data: null, error: "No puedes cancelar esta solicitud" };
    }

    if (existingRequest.estado === "cancelada") {
      return { data: existingRequest as ParkingRequest, error: null };
    }

    const { data: updatedRequest, error: updateError } = await adminClient
      .from("solicitudes_parking")
      .update({ estado: "cancelada" })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError || !updatedRequest) {
      console.error("Error al cancelar solicitud:", updateError);
      return { data: null, error: updateError?.message || "Error al cancelar la solicitud" };
    }

    return { data: updatedRequest as ParkingRequest, error: null };
  } catch (error) {
    console.error("Error en cancelParkingRequest:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Cancel a parking offer created by the user
 */
export async function cancelParkingOffer(
  offerId: string
): Promise<{ data: ParkingOffer | null; error: string | null }> {
  try {
    const { codigo, error } = await getUserFamilyUnit();
    if (error || !codigo) {
      return { data: null, error: error || "No se pudo obtener la unidad familiar" };
    }

    const adminClient = createAdminClient();
    const { data: existingOffer, error: fetchError } = await adminClient
      .from("ofertas_parking")
      .select("*")
      .eq("id", offerId)
      .single();

    if (fetchError || !existingOffer) {
      return { data: null, error: "La oferta no existe" };
    }

    if (existingOffer.unidad_familiar_codigo !== codigo) {
      return { data: null, error: "No puedes retirar esta oferta" };
    }

    if (existingOffer.estado === "cancelada") {
      return { data: existingOffer as ParkingOffer, error: null };
    }

    const { data: updatedOffer, error: updateError } = await adminClient
      .from("ofertas_parking")
      .update({ estado: "cancelada" })
      .eq("id", offerId)
      .select()
      .single();

    if (updateError || !updatedOffer) {
      console.error("Error al cancelar oferta:", updateError);
      return { data: null, error: updateError?.message || "Error al cancelar la oferta" };
    }

    return { data: updatedOffer as ParkingOffer, error: null };
  } catch (error) {
    console.error("Error en cancelParkingOffer:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
