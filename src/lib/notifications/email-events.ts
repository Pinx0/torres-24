import { EMAIL_TEMPLATE_IDS, isValidTemplateId } from "./email-templates";

export type ParkingRequestSameFloorParams = {
  solicitudId: string;
  plantaSolicitada: number;
  fechaInicio: string;
  fechaFin: string;
  solicitanteNombre: string;
};

export type PackageRequestSameStairwayParams = {
  solicitudId: string;
  descripcion: string;
  solicitanteNombre: string;
  solicitanteUnidad: string;
  escalera: string;
  fechaSolicitud: string;
};

export type PackageRequestAcceptedParams = {
  solicitudId: string;
  descripcion: string;
  solicitanteNombre: string;
  aceptanteNombre: string;
  aceptanteUnidad: string;
  fechaAceptacion: string;
};

export type ParkingRequestAcceptedParams = {
  solicitudId: string;
  plantaSolicitada: number;
  fechaInicio: string;
  fechaFin: string;
  concedenteNombre: string;
  concedenteUnidad: string;
  plazaCodigo: string;
};

export type EmailEventPayload =
  | { event: "parking_request_same_floor"; data: ParkingRequestSameFloorParams }
  | {
      event: "package_request_same_stairway";
      data: PackageRequestSameStairwayParams;
    }
  | { event: "package_request_accepted"; data: PackageRequestAcceptedParams }
  | { event: "parking_request_accepted"; data: ParkingRequestAcceptedParams };

export function buildEmailForEvent(
  payload: EmailEventPayload,
): { templateId: number; params: Record<string, unknown> } | null {
  switch (payload.event) {
    case "parking_request_same_floor": {
      const templateId = EMAIL_TEMPLATE_IDS.parkingRequestSameFloor;

      if (!isValidTemplateId(templateId)) {
        return null;
      }

      return {
        templateId,
        params: {
          solicitudId: payload.data.solicitudId,
          plantaSolicitada: payload.data.plantaSolicitada,
          fechaInicio: payload.data.fechaInicio,
          fechaFin: payload.data.fechaFin,
          solicitanteNombre: payload.data.solicitanteNombre,
        },
      };
    }
    case "package_request_same_stairway": {
      const templateId = EMAIL_TEMPLATE_IDS.packageRequestSameStairway;

      if (!isValidTemplateId(templateId)) {
        return null;
      }

      return {
        templateId,
        params: {
          solicitudId: payload.data.solicitudId,
          descripcion: payload.data.descripcion,
          solicitanteNombre: payload.data.solicitanteNombre,
          solicitanteUnidad: payload.data.solicitanteUnidad,
          escalera: payload.data.escalera,
          fechaSolicitud: payload.data.fechaSolicitud,
        },
      };
    }
    case "package_request_accepted": {
      const templateId = EMAIL_TEMPLATE_IDS.packageRequestAccepted;

      if (!isValidTemplateId(templateId)) {
        return null;
      }

      return {
        templateId,
        params: {
          solicitudId: payload.data.solicitudId,
          descripcion: payload.data.descripcion,
          solicitanteNombre: payload.data.solicitanteNombre,
          aceptanteNombre: payload.data.aceptanteNombre,
          aceptanteUnidad: payload.data.aceptanteUnidad,
          fechaAceptacion: payload.data.fechaAceptacion,
        },
      };
    }
    case "parking_request_accepted": {
      const templateId = EMAIL_TEMPLATE_IDS.parkingRequestAccepted;

      if (!isValidTemplateId(templateId)) {
        return null;
      }

      return {
        templateId,
        params: {
          solicitudId: payload.data.solicitudId,
          plantaSolicitada: payload.data.plantaSolicitada,
          fechaInicio: payload.data.fechaInicio,
          fechaFin: payload.data.fechaFin,
          concedenteNombre: payload.data.concedenteNombre,
          concedenteUnidad: payload.data.concedenteUnidad,
          plazaCodigo: payload.data.plazaCodigo,
        },
      };
    }
  }
}
