export type DocumentType = "acta" | "libro_edificio" | "contrato" | "oferta" | "otro";

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "acta", label: "Actas" },
  { value: "libro_edificio", label: "Libro del edificio" },
  { value: "contrato", label: "Contratos" },
  { value: "oferta", label: "Ofertas" },
  { value: "otro", label: "Otros" },
];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  acta: "Actas",
  libro_edificio: "Libro del edificio",
  contrato: "Contratos",
  oferta: "Ofertas",
  otro: "Otros",
};

export const DOCUMENT_TYPE_SET = new Set<DocumentType>([
  "acta",
  "libro_edificio",
  "contrato",
  "oferta",
  "otro",
]);
