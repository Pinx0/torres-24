-- Allow cancelling package requests

ALTER TABLE public.solicitudes_paquetes
  DROP CONSTRAINT IF EXISTS solicitudes_paquetes_estado_check;

ALTER TABLE public.solicitudes_paquetes
  ADD CONSTRAINT solicitudes_paquetes_estado_check
  CHECK (estado IN ('pendiente', 'aceptada', 'completada', 'cancelada'));
