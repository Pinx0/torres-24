-- Create categorias de gastos y gastos

CREATE TABLE IF NOT EXISTS public.gastos_categoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    color TEXT,
    orden INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES public.gastos_categoria(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    descripcion TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('real', 'presupuestado')),
    periodicidad TEXT NOT NULL CHECK (
        periodicidad IN ('puntual', 'mensual', 'bimensual', 'trimestral', 'semestral', 'anual')
    ),
    importe NUMERIC(12, 2) NOT NULL CHECK (importe >= 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_gastos_fechas_validas
        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON public.gastos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_gastos_tipo ON public.gastos(tipo);
CREATE INDEX IF NOT EXISTS idx_gastos_periodicidad ON public.gastos(periodicidad);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha_inicio ON public.gastos(fecha_inicio);

-- Trigger for updated_at
CREATE TRIGGER update_gastos_updated_at
    BEFORE UPDATE ON public.gastos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.gastos_categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for select (writes via admin client)
CREATE POLICY "Authenticated users can view gastos categorias" ON public.gastos_categoria
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view gastos" ON public.gastos
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
