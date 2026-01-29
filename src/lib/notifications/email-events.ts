import { EMAIL_TEMPLATE_IDS, isValidTemplateId } from "./email-templates";

export type ParkingRequestSameFloorParams = {
  solicitudId: string;
  plantaSolicitada: number;
  fechaInicio: string;
  fechaFin: string;
  solicitanteNombre: string;
};

export type EmailEventPayload = {
  event: "parking_request_same_floor";
  data: ParkingRequestSameFloorParams;
};

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
  }
}
