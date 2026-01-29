-- Create private bucket for incident images
INSERT INTO storage.buckets (id, name, public)
VALUES ('incidencias', 'incidencias', false)
ON CONFLICT (id) DO NOTHING;

-- Attachments for incidencias and comentarios
CREATE TABLE IF NOT EXISTS public.incidencias_adjuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incidencia_id UUID NOT NULL REFERENCES public.incidencias(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    comentario_id UUID REFERENCES public.incidencias_comentarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    autor_usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    autor_unidad_familiar_codigo TEXT NOT NULL REFERENCES public.unidades_familiares(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidencias_adjuntos_incidencia
  ON public.incidencias_adjuntos(incidencia_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_adjuntos_comentario
  ON public.incidencias_adjuntos(comentario_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_adjuntos_creadas
  ON public.incidencias_adjuntos(created_at);

ALTER TABLE public.incidencias_adjuntos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can add adjuntos" ON public.incidencias_adjuntos
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND autor_usuario_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = autor_unidad_familiar_codigo
    )
    AND EXISTS (
      SELECT 1
      FROM public.incidencias
      WHERE id = incidencia_id
    )
    AND (
      comentario_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.incidencias_comentarios
        WHERE id = comentario_id
          AND incidencia_id = public.incidencias_adjuntos.incidencia_id
      )
    )
  );

CREATE POLICY "Authenticated users can view adjuntos" ON public.incidencias_adjuntos
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
