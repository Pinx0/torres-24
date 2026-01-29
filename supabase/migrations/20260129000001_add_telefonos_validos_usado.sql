-- Add "usado" flag to prevent phone reuse
ALTER TABLE IF EXISTS public.telefonos_validos
    ADD COLUMN IF NOT EXISTS usado BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_telefonos_validos_usado ON public.telefonos_validos(usado);
