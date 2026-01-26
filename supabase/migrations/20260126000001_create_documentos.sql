-- Create documentos table for community documentation

CREATE TABLE IF NOT EXISTS public.documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('acta', 'libro_edificio', 'contrato', 'oferta', 'otro')),
    r2_key TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documentos_titulo ON public.documentos (lower(titulo));
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON public.documentos (tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_creadas ON public.documentos (created_at);

-- Trigger for updated_at
CREATE TRIGGER update_documentos_updated_at
    BEFORE UPDATE ON public.documentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documentos
CREATE POLICY "Authenticated users can create documentos" ON public.documentos
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can view documentos" ON public.documentos
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update documentos" ON public.documentos
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
