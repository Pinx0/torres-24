-- Add superficie_util and superficie_construida to viviendas, garajes, trasteros
-- Use NUMERIC(10, 2) with default 0 for consistency

ALTER TABLE public.viviendas
ADD COLUMN IF NOT EXISTS superficie_util NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS superficie_construida NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.garajes
ADD COLUMN IF NOT EXISTS superficie_util NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS superficie_construida NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.trasteros
ADD COLUMN IF NOT EXISTS superficie_util NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS superficie_construida NUMERIC(10, 2) NOT NULL DEFAULT 0;
