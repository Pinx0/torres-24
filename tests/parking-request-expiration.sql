-- Run with psql -v ON_ERROR_STOP=1 -f tests/parking-request-expiration.sql
-- against a disposable database with the parking schema, as its migration owner.
-- Fixtures, migration changes and cron scheduling are all rolled back.
BEGIN;
SET LOCAL TIME ZONE 'Europe/Madrid';

INSERT INTO public.unidades_familiares (codigo)
VALUES ('__test_parking_expiration_a__'), ('__test_parking_expiration_b__');

CREATE TEMP TABLE parking_expiration_fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    unidad TEXT NOT NULL,
    initial_estado TEXT NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    expected_estado TEXT NOT NULL
);

INSERT INTO parking_expiration_fixtures
    (label, unidad, initial_estado, fecha_fin, expected_estado)
VALUES
    ('expired pending', '__test_parking_expiration_a__', 'pendiente', now() - interval '1 minute', 'cancelada'),
    ('expired other family', '__test_parking_expiration_b__', 'pendiente', now() - interval '1 day', 'cancelada'),
    ('ongoing', '__test_parking_expiration_a__', 'pendiente', now() + interval '1 hour', 'pendiente'),
    ('future', '__test_parking_expiration_a__', 'pendiente', now() + interval '2 days', 'pendiente'),
    ('exact end boundary', '__test_parking_expiration_a__', 'pendiente', now(), 'pendiente'),
    ('expired accepted', '__test_parking_expiration_a__', 'aceptada', now() - interval '1 day', 'aceptada'),
    ('already cancelled', '__test_parking_expiration_a__', 'cancelada', now() - interval '1 day', 'cancelada');

INSERT INTO public.solicitudes_parking
    (id, solicitante_unidad_familiar_codigo, planta_solicitada, fecha_inicio, fecha_fin, estado, updated_at)
SELECT id, unidad, 0, fecha_fin - interval '4 hours', fecha_fin, initial_estado, now() - interval '1 day'
FROM parking_expiration_fixtures;

-- Exercise the real migration, including its initial backlog cleanup.
\ir ../supabase/migrations/20261004000000_cancel_expired_parking_requests.sql

CREATE FUNCTION pg_temp.assert_parking_expiration() RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM parking_expiration_fixtures f
        LEFT JOIN public.solicitudes_parking r ON r.id = f.id
        WHERE r.id IS NULL OR r.estado <> f.expected_estado
           OR r.fecha_fin <> f.fecha_fin
    ) THEN
        RAISE EXCEPTION 'Expired pending requests must be cancelled; all other states, dates and history must be preserved';
    END IF;

    IF EXISTS (
        SELECT 1 FROM parking_expiration_fixtures f
        JOIN public.solicitudes_parking r ON r.id = f.id
        WHERE (f.initial_estado <> f.expected_estado AND r.updated_at <> now())
           OR (f.initial_estado = f.expected_estado AND r.updated_at <> now() - interval '1 day')
    ) THEN
        RAISE EXCEPTION 'Only requests cancelled by the cleanup may change updated_at';
    END IF;
END;
$$;

SELECT pg_temp.assert_parking_expiration();

DO $$
DECLARE
    cleanup_sql TEXT;
    job_schedule TEXT;
    zone TEXT;
BEGIN
    SELECT command, schedule INTO STRICT cleanup_sql, job_schedule
    FROM cron.job
    WHERE jobname = 'parkshare-cancel-expired-requests' AND active;

    IF job_schedule <> '0 0 * * *' THEN
        RAISE EXCEPTION 'Expected a single active cleanup job daily at midnight UTC';
    END IF;

    FOREACH zone IN ARRAY ARRAY['UTC', 'Europe/Madrid', 'America/New_York'] LOOP
        PERFORM set_config('TimeZone', zone, true);
        -- Simulate a later batch of requests expiring after the migration ran.
        UPDATE public.solicitudes_parking r
        SET estado = f.initial_estado
        FROM parking_expiration_fixtures f
        WHERE r.id = f.id AND f.initial_estado <> f.expected_estado;

        EXECUTE cleanup_sql;
        PERFORM pg_temp.assert_parking_expiration();
        EXECUTE cleanup_sql;
        PERFORM pg_temp.assert_parking_expiration();
    END LOOP;
END;
$$;

ROLLBACK;
