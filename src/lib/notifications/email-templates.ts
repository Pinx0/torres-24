export const EMAIL_TEMPLATE_IDS = {
  parkingRequestSameFloor: 1,
  packageRequestSameStairway: 2,
  packageRequestAccepted: 3,
  parkingRequestAccepted: 4,
  pollCreated: 5,
  incidentCreated: 6,
  documentCreated: 7,
} as const;

export function isValidTemplateId(templateId: number) {
  return Number.isFinite(templateId) && templateId > 0;
}
