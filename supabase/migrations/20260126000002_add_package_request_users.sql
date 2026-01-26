-- Add user references to package requests

ALTER TABLE public.solicitudes_paquetes
  ADD COLUMN IF NOT EXISTS solicitante_usuario_id UUID,
  ADD COLUMN IF NOT EXISTS aceptante_usuario_id UUID;

CREATE INDEX IF NOT EXISTS idx_solicitudes_paquetes_solicitante_usuario
  ON public.solicitudes_paquetes(solicitante_usuario_id);

CREATE INDEX IF NOT EXISTS idx_solicitudes_paquetes_aceptante_usuario
  ON public.solicitudes_paquetes(aceptante_usuario_id);
