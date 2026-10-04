-- Archive unanswered pickup requests after 30 elapsed days, keeping their history.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

ALTER TABLE public.solicitudes_paquetes
    DROP CONSTRAINT IF EXISTS solicitudes_paquetes_estado_check;

ALTER TABLE public.solicitudes_paquetes
    ADD CONSTRAINT solicitudes_paquetes_estado_check
    CHECK (estado IN ('pendiente', 'aceptada', 'completada', 'cancelada', 'archivada'));

CREATE INDEX IF NOT EXISTS idx_solicitudes_paquetes_pendientes_created_at
    ON public.solicitudes_paquetes (created_at)
    WHERE estado = 'pendiente';

-- Clean up existing stale requests when the migration is applied.
-- Hours keep the cutoff independent of the session time zone and DST changes.
UPDATE public.solicitudes_paquetes
SET estado = 'archivada'
WHERE estado = 'pendiente'
  AND created_at <= now() - interval '720 hours';

-- Run daily at midnight UTC, independently of app traffic.
-- Scheduling by name updates the existing job instead of duplicating it.
SELECT cron.schedule(
    'packages-archive-stale-requests',
    '0 0 * * *',
    $$
    UPDATE public.solicitudes_paquetes
    SET estado = 'archivada'
    WHERE estado = 'pendiente'
      AND created_at <= now() - interval '720 hours';
    $$
);
