-- Add numero_planta field to viviendas, garajes, and trasteros
-- Add escalera field to viviendas
-- All fields are NOT NULL with default values

-- Add numero_planta to viviendas (default 0)
ALTER TABLE public.viviendas
ADD COLUMN IF NOT EXISTS numero_planta INTEGER NOT NULL DEFAULT 0;

-- Add escalera to viviendas (default 'A')
ALTER TABLE public.viviendas
ADD COLUMN IF NOT EXISTS escalera TEXT NOT NULL DEFAULT 'A';

-- Add numero_planta to garajes (default 0)
ALTER TABLE public.garajes
ADD COLUMN IF NOT EXISTS numero_planta INTEGER NOT NULL DEFAULT 0;

-- Add numero_planta to trasteros (default 0)
ALTER TABLE public.trasteros
ADD COLUMN IF NOT EXISTS numero_planta INTEGER NOT NULL DEFAULT 0;
