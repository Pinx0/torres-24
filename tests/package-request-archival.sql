-- Run with psql -v ON_ERROR_STOP=1 -f tests/package-request-archival.sql
-- against a disposable database with the package schema, as its migration owner.
-- Fixtures, migration changes and cron scheduling are all rolled back.
BEGIN;
SET LOCAL TIME ZONE 'Europe/Madrid';

INSERT INTO public.unidades_familiares (codigo)
VALUES ('__test_package_archive_a__'), ('__test_package_archive_b__');

CREATE TEMP TABLE package_archive_fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    unidad TEXT NOT NULL,
    initial_estado TEXT NOT NULL,
    created_at TIMESTAMPTZ,
    expected_estado TEXT NOT NULL,
    initial_data JSONB
);

INSERT INTO package_archive_fixtures
    (label, unidad, initial_estado, created_at, expected_estado)
VALUES
    ('seven months pending', '__test_package_archive_a__', 'pendiente', now() - interval '7 months', 'archivada'),
    ('old pending other family', '__test_package_archive_b__', 'pendiente', now() - interval '721 hours', 'archivada'),
    ('exact cutoff', '__test_package_archive_a__', 'pendiente', now() - interval '720 hours', 'archivada'),
    ('just inside cutoff', '__test_package_archive_a__', 'pendiente', now() - interval '720 hours' + interval '1 second', 'pendiente'),
    ('recent pending', '__test_package_archive_a__', 'pendiente', now() - interval '1 day', 'pendiente'),
    ('missing creation time', '__test_package_archive_a__', 'pendiente', NULL, 'pendiente'),
    ('old accepted', '__test_package_archive_a__', 'aceptada', now() - interval '7 months', 'aceptada'),
    ('old completed', '__test_package_archive_a__', 'completada', now() - interval '7 months', 'completada'),
    ('old cancelled', '__test_package_archive_a__', 'cancelada', now() - interval '7 months', 'cancelada');

INSERT INTO public.solicitudes_paquetes
    (id, solicitante_unidad_familiar_codigo, descripcion, estado, created_at, updated_at)
SELECT id, unidad, label, initial_estado, created_at, now() - interval '1 day'
FROM package_archive_fixtures;

-- Render timestamps consistently for the history comparison across time zones.
SET LOCAL TIME ZONE 'UTC';
UPDATE package_archive_fixtures f
SET initial_data = to_jsonb(r) - 'estado' - 'updated_at'
FROM public.solicitudes_paquetes r
WHERE r.id = f.id;
SET LOCAL TIME ZONE 'Europe/Madrid';

-- Exercise the real migration, including its initial backlog cleanup.
\ir ../supabase/migrations/20261004000001_archive_stale_package_requests.sql

CREATE FUNCTION pg_temp.assert_package_archival() RETURNS VOID
LANGUAGE plpgsql SET TimeZone = 'UTC' AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM package_archive_fixtures f
        LEFT JOIN public.solicitudes_paquetes r ON r.id = f.id
        WHERE r.id IS NULL OR r.estado <> f.expected_estado
           OR (to_jsonb(r) - 'estado' - 'updated_at') IS DISTINCT FROM f.initial_data
    ) THEN
        RAISE EXCEPTION 'Only pending requests at least 30 days old must be archived; all history and other states must be preserved';
    END IF;

    IF EXISTS (
        SELECT 1 FROM package_archive_fixtures f
        JOIN public.solicitudes_paquetes r ON r.id = f.id
        WHERE (f.initial_estado <> f.expected_estado AND r.updated_at <> now())
           OR (f.initial_estado = f.expected_estado AND r.updated_at <> now() - interval '1 day')
    ) THEN
        RAISE EXCEPTION 'Only requests archived by the cleanup may change updated_at';
    END IF;
END;
$$;

SELECT pg_temp.assert_package_archival();

-- Reapplying must keep a single named job and leave archived requests unchanged.
\ir ../supabase/migrations/20261004000001_archive_stale_package_requests.sql
SELECT pg_temp.assert_package_archival();

DO $$
DECLARE
    cleanup_sql TEXT;
    job_schedule TEXT;
    zone TEXT;
BEGIN
    SELECT command, schedule INTO STRICT cleanup_sql, job_schedule
    FROM cron.job
    WHERE jobname = 'packages-archive-stale-requests' AND active;

    IF job_schedule <> '0 0 * * *' THEN
        RAISE EXCEPTION 'Expected a single active cleanup job daily at midnight UTC';
    END IF;

    FOREACH zone IN ARRAY ARRAY['UTC', 'Europe/Madrid', 'America/New_York'] LOOP
        PERFORM set_config('TimeZone', zone, true);
        -- Simulate requests becoming stale after the migration ran.
        UPDATE public.solicitudes_paquetes r
        SET estado = f.initial_estado
        FROM package_archive_fixtures f
        WHERE r.id = f.id AND f.initial_estado <> f.expected_estado;

        EXECUTE cleanup_sql;
        PERFORM pg_temp.assert_package_archival();
        EXECUTE cleanup_sql;
        PERFORM pg_temp.assert_package_archival();
    END LOOP;
END;
$$;

ROLLBACK;
