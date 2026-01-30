-- Require texto for encuesta opciones
ALTER TABLE public.encuesta_opciones
  ALTER COLUMN texto SET NOT NULL;

ALTER TABLE public.encuesta_opciones
  DROP CONSTRAINT IF EXISTS encuesta_opciones_contenido_check;

ALTER TABLE public.encuesta_opciones
  ADD CONSTRAINT encuesta_opciones_contenido_check CHECK (length(trim(texto)) > 0);
