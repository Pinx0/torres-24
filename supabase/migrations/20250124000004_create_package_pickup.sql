-- Create package pickup requests table

-- Create solicitudes_paquetes table
CREATE TABLE IF NOT EXISTS public.solicitudes_paquetes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitante_unidad_familiar_codigo TEXT NOT NULL,
    aceptante_unidad_familiar_codigo TEXT,
    descripcion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'completada')),
    fecha_aceptacion TIMESTAMPTZ,
    fecha_expiracion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_solicitante_unidad_familiar FOREIGN KEY (solicitante_unidad_familiar_codigo) 
        REFERENCES public.unidades_familiares(codigo_vivienda) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_aceptante_unidad_familiar FOREIGN KEY (aceptante_unidad_familiar_codigo) 
        REFERENCES public.unidades_familiares(codigo_vivienda) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_solicitudes_paquetes_solicitante ON public.solicitudes_paquetes(solicitante_unidad_familiar_codigo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_paquetes_aceptante ON public.solicitudes_paquetes(aceptante_unidad_familiar_codigo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_paquetes_estado ON public.solicitudes_paquetes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_paquetes_fecha_expiracion ON public.solicitudes_paquetes(fecha_expiracion);

-- Create trigger for updated_at
CREATE TRIGGER update_solicitudes_paquetes_updated_at
    BEFORE UPDATE ON public.solicitudes_paquetes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically set fecha_expiracion when a request is accepted
CREATE OR REPLACE FUNCTION public.set_fecha_expiracion_paquete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- When estado changes to 'aceptada' and fecha_aceptacion is set, calculate fecha_expiracion
    IF NEW.estado = 'aceptada' AND NEW.fecha_aceptacion IS NOT NULL AND NEW.fecha_expiracion IS NULL THEN
        NEW.fecha_expiracion := NEW.fecha_aceptacion + INTERVAL '1 month';
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger to automatically set fecha_expiracion
CREATE TRIGGER trigger_set_fecha_expiracion_paquete
    BEFORE INSERT OR UPDATE ON public.solicitudes_paquetes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_fecha_expiracion_paquete();

-- Enable Row Level Security
ALTER TABLE public.solicitudes_paquetes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can create requests for their own family unit
CREATE POLICY "Users can create requests for their family unit" ON public.solicitudes_paquetes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = solicitante_unidad_familiar_codigo
    )
  );

-- Policy: Users can view pending requests (from any family unit, except their own)
CREATE POLICY "Users can view pending requests" ON public.solicitudes_paquetes
  FOR SELECT
  USING (
    estado = 'pendiente'
    AND NOT EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = solicitante_unidad_familiar_codigo
    )
  );

-- Policy: Users can view their own requests (as solicitante)
CREATE POLICY "Users can view their own requests" ON public.solicitudes_paquetes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = solicitante_unidad_familiar_codigo
    )
  );

-- Policy: Users can view accepted requests where they are involved (solicitante or aceptante)
-- and the request hasn't expired
CREATE POLICY "Users can view accepted requests they are involved in" ON public.solicitudes_paquetes
  FOR SELECT
  USING (
    estado = 'aceptada'
    AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
    AND (
      EXISTS (
        SELECT 1
        FROM public.usuarios_unidades_familiares
        WHERE usuario_id = auth.uid()
          AND unidad_familiar_codigo = solicitante_unidad_familiar_codigo
      )
      OR EXISTS (
        SELECT 1
        FROM public.usuarios_unidades_familiares
        WHERE usuario_id = auth.uid()
          AND unidad_familiar_codigo = aceptante_unidad_familiar_codigo
      )
    )
  );

-- Policy: Users can update requests to accept them (only pending requests, and not their own)
CREATE POLICY "Users can accept pending requests" ON public.solicitudes_paquetes
  FOR UPDATE
  USING (
    estado = 'pendiente'
    AND NOT EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = solicitante_unidad_familiar_codigo
    )
  )
  WITH CHECK (
    estado = 'aceptada'
    AND aceptante_unidad_familiar_codigo IS NOT NULL
    AND fecha_aceptacion IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.usuarios_unidades_familiares
      WHERE usuario_id = auth.uid()
        AND unidad_familiar_codigo = aceptante_unidad_familiar_codigo
    )
  );
