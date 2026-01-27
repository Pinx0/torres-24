-- Allow garajes and trasteros without unidad_familiar

ALTER TABLE public.garajes
ALTER COLUMN unidad_familiar_codigo DROP NOT NULL;

ALTER TABLE public.trasteros
ALTER COLUMN unidad_familiar_codigo DROP NOT NULL;
