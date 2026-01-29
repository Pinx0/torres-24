-- Create parking offers and requests tables

CREATE TABLE IF NOT EXISTS public.ofertas_parking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    garaje_codigo TEXT NOT NULL,
    unidad_familiar_codigo TEXT NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'ocupada', 'cancelada')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ofertas_parking_garaje FOREIGN KEY (garaje_codigo)
        REFERENCES public.garajes(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_ofertas_parking_unidad_familiar FOREIGN KEY (unidad_familiar_codigo)
        REFERENCES public.unidades_familiares(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS public.solicitudes_parking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oferta_id UUID,
    solicitante_unidad_familiar_codigo TEXT NOT NULL,
    planta_solicitada INTEGER NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'cancelada')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_solicitudes_parking_oferta FOREIGN KEY (oferta_id)
        REFERENCES public.ofertas_parking(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_solicitudes_parking_solicitante FOREIGN KEY (solicitante_unidad_familiar_codigo)
        REFERENCES public.unidades_familiares(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ofertas_parking_garaje ON public.ofertas_parking(garaje_codigo);
CREATE INDEX IF NOT EXISTS idx_ofertas_parking_unidad_familiar ON public.ofertas_parking(unidad_familiar_codigo);
CREATE INDEX IF NOT EXISTS idx_ofertas_parking_estado ON public.ofertas_parking(estado);
CREATE INDEX IF NOT EXISTS idx_ofertas_parking_fechas ON public.ofertas_parking(fecha_inicio, fecha_fin);

CREATE INDEX IF NOT EXISTS idx_solicitudes_parking_oferta ON public.solicitudes_parking(oferta_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_parking_solicitante ON public.solicitudes_parking(solicitante_unidad_familiar_codigo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_parking_estado ON public.solicitudes_parking(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_parking_fechas ON public.solicitudes_parking(fecha_inicio, fecha_fin);

-- Triggers for updated_at
CREATE TRIGGER update_ofertas_parking_updated_at
    BEFORE UPDATE ON public.ofertas_parking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solicitudes_parking_updated_at
    BEFORE UPDATE ON public.solicitudes_parking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.ofertas_parking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_parking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ofertas_parking
CREATE POLICY "Users can create offers for their family unit" ON public.ofertas_parking
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = unidad_familiar_codigo
    )
  );

CREATE POLICY "Users can view active offers or their own" ON public.ofertas_parking
  FOR SELECT
  USING (
    estado = 'activa'
    OR EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = unidad_familiar_codigo
    )
  );

-- RLS Policies for solicitudes_parking
CREATE POLICY "Users can create parking requests for their family unit" ON public.solicitudes_parking
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = solicitante_unidad_familiar_codigo
    )
  );

CREATE POLICY "Users can view their requests or offers linked" ON public.solicitudes_parking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = solicitante_unidad_familiar_codigo
    )
    OR EXISTS (
      SELECT 1
      FROM public.ofertas_parking o
      JOIN public.usuarios_unidades_familiares u
        ON u.unidad_familiar_codigo = o.unidad_familiar_codigo
      WHERE o.id = oferta_id
        AND u.usuario_id = auth.uid()
    )
  );
