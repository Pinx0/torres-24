-- Cancel pending requests once their entire requested time slot has ended.
-- TIMESTAMPTZ and now() compare instants, regardless of the session time zone.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

CREATE INDEX IF NOT EXISTS idx_solicitudes_parking_pendientes_fecha_fin
    ON public.solicitudes_parking (fecha_fin)
    WHERE estado = 'pendiente';

-- Clean up the backlog immediately when this migration is applied.
UPDATE public.solicitudes_parking
SET estado = 'cancelada'
WHERE estado = 'pendiente'
  AND fecha_fin < now();

-- Run daily at midnight UTC (01:00/02:00 in Madrid), independently of app traffic.
-- The named job is updated rather than duplicated if it is scheduled again.
SELECT cron.schedule(
    'parkshare-cancel-expired-requests',
    '0 0 * * *',
    $$
    UPDATE public.solicitudes_parking
    SET estado = 'cancelada'
    WHERE estado = 'pendiente'
      AND fecha_fin < now();
    $$
);
