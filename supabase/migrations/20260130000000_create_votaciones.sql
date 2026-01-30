-- Create private bucket for poll assets (images/PDF)
INSERT INTO storage.buckets (id, name, public)
VALUES ('encuestas', 'encuestas', false)
ON CONFLICT (id) DO NOTHING;

-- Create encuestas tables
CREATE TABLE IF NOT EXISTS public.encuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'finalizada')),
    autor_usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    autor_unidad_familiar_codigo TEXT NOT NULL REFERENCES public.unidades_familiares(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.encuesta_opciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encuesta_id UUID NOT NULL REFERENCES public.encuestas(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    texto TEXT,
    archivo_path TEXT,
    archivo_mime_type TEXT,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT encuesta_opciones_contenido_check CHECK (
      (texto IS NOT NULL AND length(trim(texto)) > 0)
      OR archivo_path IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS public.encuesta_votos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encuesta_id UUID NOT NULL REFERENCES public.encuestas(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    opcion_id UUID NOT NULL REFERENCES public.encuesta_opciones(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    unidad_familiar_codigo TEXT NOT NULL REFERENCES public.unidades_familiares(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (encuesta_id, unidad_familiar_codigo)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_encuestas_estado ON public.encuestas(estado);
CREATE INDEX IF NOT EXISTS idx_encuestas_creadas ON public.encuestas(created_at);
CREATE INDEX IF NOT EXISTS idx_encuestas_finalizadas ON public.encuestas(finalized_at);
CREATE INDEX IF NOT EXISTS idx_encuestas_autor ON public.encuestas(autor_usuario_id);

CREATE INDEX IF NOT EXISTS idx_encuesta_opciones_encuesta ON public.encuesta_opciones(encuesta_id);
CREATE INDEX IF NOT EXISTS idx_encuesta_opciones_orden ON public.encuesta_opciones(orden);

CREATE INDEX IF NOT EXISTS idx_encuesta_votos_encuesta ON public.encuesta_votos(encuesta_id);
CREATE INDEX IF NOT EXISTS idx_encuesta_votos_opcion ON public.encuesta_votos(opcion_id);
CREATE INDEX IF NOT EXISTS idx_encuesta_votos_unidad ON public.encuesta_votos(unidad_familiar_codigo);

-- Trigger for updated_at
CREATE TRIGGER update_encuestas_updated_at
    BEFORE UPDATE ON public.encuestas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.encuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuesta_opciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuesta_votos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for encuestas
CREATE POLICY "Authenticated users can create encuestas" ON public.encuestas
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

CREATE POLICY "Authenticated users can view encuestas" ON public.encuestas
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their encuestas" ON public.encuestas
  FOR UPDATE
  USING (autor_usuario_id = auth.uid())
  WITH CHECK (autor_usuario_id = auth.uid());

CREATE POLICY "Authors can delete their encuestas" ON public.encuestas
  FOR DELETE
  USING (autor_usuario_id = auth.uid());

-- RLS Policies for encuesta_opciones
CREATE POLICY "Authenticated users can view encuesta opciones" ON public.encuesta_opciones
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can add opciones" ON public.encuesta_opciones
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.encuestas
      WHERE id = encuesta_id
        AND autor_usuario_id = auth.uid()
    )
  );

-- RLS Policies for encuesta_votos
CREATE POLICY "Authenticated users can view votos" ON public.encuesta_votos
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can vote" ON public.encuesta_votos
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND usuario_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = public.encuesta_votos.unidad_familiar_codigo
    )
    AND EXISTS (
      SELECT 1
      FROM public.encuesta_opciones
      WHERE id = opcion_id
        AND encuesta_id = public.encuesta_votos.encuesta_id
    )
  );
