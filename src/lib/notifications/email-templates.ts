export const EMAIL_TEMPLATE_IDS = {
  // Actualiza este ID con el template de Brevo correspondiente.
  parkingRequestSameFloor: 1,
  packageRequestSameStairway: 2,
  packageRequestAccepted: 3,
  parkingRequestAccepted: 4,
} as const;

export function isValidTemplateId(templateId: number) {
  return Number.isFinite(templateId) && templateId > 0;
}
