-- Create incidencias and comentarios tables

CREATE TABLE IF NOT EXISTS public.incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'resuelta')),
    autor_usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    autor_unidad_familiar_codigo TEXT NOT NULL REFERENCES public.unidades_familiares(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incidencias_comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incidencia_id UUID NOT NULL REFERENCES public.incidencias(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    autor_usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    autor_unidad_familiar_codigo TEXT NOT NULL REFERENCES public.unidades_familiares(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    mensaje TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON public.incidencias(estado);
CREATE INDEX IF NOT EXISTS idx_incidencias_autor ON public.incidencias(autor_usuario_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_creadas ON public.incidencias(created_at);

CREATE INDEX IF NOT EXISTS idx_incidencias_comentarios_incidencia
  ON public.incidencias_comentarios(incidencia_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_comentarios_creadas
  ON public.incidencias_comentarios(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_incidencias_updated_at
    BEFORE UPDATE ON public.incidencias
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias_comentarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incidencias
CREATE POLICY "Authenticated users can create incidencias" ON public.incidencias
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
  );

CREATE POLICY "Authenticated users can view incidencias" ON public.incidencias
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their incidencias" ON public.incidencias
  FOR UPDATE
  USING (autor_usuario_id = auth.uid())
  WITH CHECK (autor_usuario_id = auth.uid());

-- RLS Policies for incidencias_comentarios
CREATE POLICY "Authenticated users can comment on incidencias" ON public.incidencias_comentarios
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
  );

CREATE POLICY "Authenticated users can view comentarios" ON public.incidencias_comentarios
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
