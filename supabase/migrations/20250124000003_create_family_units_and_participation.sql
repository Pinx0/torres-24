-- Create tables for family units and participation percentages

-- Create unidades_familiares table (independent, with its own codigo)
CREATE TABLE IF NOT EXISTS public.unidades_familiares (
    codigo TEXT PRIMARY KEY,
    total_participacion NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (total_participacion >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create viviendas table (with FK to unidades_familiares)
CREATE TABLE IF NOT EXISTS public.viviendas (
    codigo TEXT PRIMARY KEY,
    porcentaje_participacion NUMERIC(5, 2) NOT NULL CHECK (porcentaje_participacion >= 0 AND porcentaje_participacion <= 100),
    unidad_familiar_codigo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_vivienda_unidad_familiar FOREIGN KEY (unidad_familiar_codigo) 
        REFERENCES public.unidades_familiares(codigo) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- Create garajes table
CREATE TABLE IF NOT EXISTS public.garajes (
    codigo TEXT PRIMARY KEY,
    porcentaje_participacion NUMERIC(5, 2) NOT NULL CHECK (porcentaje_participacion >= 0 AND porcentaje_participacion <= 100),
    unidad_familiar_codigo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_garaje_unidad_familiar FOREIGN KEY (unidad_familiar_codigo) 
        REFERENCES public.unidades_familiares(codigo) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create trasteros table
CREATE TABLE IF NOT EXISTS public.trasteros (
    codigo TEXT PRIMARY KEY,
    porcentaje_participacion NUMERIC(5, 2) NOT NULL CHECK (porcentaje_participacion >= 0 AND porcentaje_participacion <= 100),
    unidad_familiar_codigo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_trastero_unidad_familiar FOREIGN KEY (unidad_familiar_codigo) 
        REFERENCES public.unidades_familiares(codigo) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create usuarios_unidades_familiares table
CREATE TABLE IF NOT EXISTS public.usuarios_unidades_familiares (
    usuario_id UUID PRIMARY KEY,
    unidad_familiar_codigo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_unidad_familiar_usuario FOREIGN KEY (usuario_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_usuario_unidad_familiar_unidad FOREIGN KEY (unidad_familiar_codigo) 
        REFERENCES public.unidades_familiares(codigo) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_viviendas_unidad_familiar ON public.viviendas(unidad_familiar_codigo);
CREATE INDEX IF NOT EXISTS idx_garajes_unidad_familiar ON public.garajes(unidad_familiar_codigo);
CREATE INDEX IF NOT EXISTS idx_trasteros_unidad_familiar ON public.trasteros(unidad_familiar_codigo);
CREATE INDEX IF NOT EXISTS idx_usuarios_unidades_familiares_unidad ON public.usuarios_unidades_familiares(unidad_familiar_codigo);
CREATE INDEX IF NOT EXISTS idx_telefonos_validos_apartamento ON public.telefonos_validos(apartamento);

-- Create triggers for updated_at
CREATE TRIGGER update_viviendas_updated_at
    BEFORE UPDATE ON public.viviendas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unidades_familiares_updated_at
    BEFORE UPDATE ON public.unidades_familiares
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garajes_updated_at
    BEFORE UPDATE ON public.garajes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trasteros_updated_at
    BEFORE UPDATE ON public.trasteros
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_unidades_familiares_updated_at
    BEFORE UPDATE ON public.usuarios_unidades_familiares
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to recalculate total participation for a family unit
CREATE OR REPLACE FUNCTION public.recalcular_participacion_unidad_familiar(p_codigo_unidad_familiar TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_porcentaje_vivienda NUMERIC(5, 2) := 0;
    v_porcentaje_garajes NUMERIC(5, 2) := 0;
    v_porcentaje_trasteros NUMERIC(5, 2) := 0;
    v_total NUMERIC(5, 2) := 0;
BEGIN
    -- Get vivienda participation percentage (if vivienda is associated with this unidad_familiar)
    SELECT COALESCE(SUM(porcentaje_participacion), 0) INTO v_porcentaje_vivienda
    FROM public.viviendas
    WHERE unidad_familiar_codigo = p_codigo_unidad_familiar;

    -- Sum all garajes participation percentages
    SELECT COALESCE(SUM(porcentaje_participacion), 0) INTO v_porcentaje_garajes
    FROM public.garajes
    WHERE unidad_familiar_codigo = p_codigo_unidad_familiar;

    -- Sum all trasteros participation percentages
    SELECT COALESCE(SUM(porcentaje_participacion), 0) INTO v_porcentaje_trasteros
    FROM public.trasteros
    WHERE unidad_familiar_codigo = p_codigo_unidad_familiar;

    -- Calculate total
    v_total := v_porcentaje_vivienda + v_porcentaje_garajes + v_porcentaje_trasteros;

    -- Update unidades_familiares
    UPDATE public.unidades_familiares
    SET total_participacion = v_total
    WHERE codigo = p_codigo_unidad_familiar;
END;
$$;

-- Trigger function to automatically recalculate when garajes change
CREATE OR REPLACE FUNCTION public.trigger_recalcular_participacion_garaje()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.recalcular_participacion_unidad_familiar(OLD.unidad_familiar_codigo);
        RETURN OLD;
    ELSE
        PERFORM public.recalcular_participacion_unidad_familiar(NEW.unidad_familiar_codigo);
        RETURN NEW;
    END IF;
END;
$$;

-- Trigger function to automatically recalculate when trasteros change
CREATE OR REPLACE FUNCTION public.trigger_recalcular_participacion_trastero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.recalcular_participacion_unidad_familiar(OLD.unidad_familiar_codigo);
        RETURN OLD;
    ELSE
        PERFORM public.recalcular_participacion_unidad_familiar(NEW.unidad_familiar_codigo);
        RETURN NEW;
    END IF;
END;
$$;

-- Trigger function to automatically recalculate when vivienda participation changes
CREATE OR REPLACE FUNCTION public.trigger_recalcular_participacion_vivienda()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Recalculate for the unidad_familiar that this vivienda belongs to (if any)
    IF NEW.unidad_familiar_codigo IS NOT NULL THEN
        PERFORM public.recalcular_participacion_unidad_familiar(NEW.unidad_familiar_codigo);
    END IF;
    -- Also recalculate for old unidad_familiar if it changed
    IF OLD.unidad_familiar_codigo IS NOT NULL AND OLD.unidad_familiar_codigo IS DISTINCT FROM NEW.unidad_familiar_codigo THEN
        PERFORM public.recalcular_participacion_unidad_familiar(OLD.unidad_familiar_codigo);
    END IF;
    RETURN NEW;
END;
$$;

-- Create triggers for automatic recalculation
CREATE TRIGGER trigger_recalcular_garaje_insert
    AFTER INSERT ON public.garajes
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_recalcular_participacion_garaje();

CREATE TRIGGER trigger_recalcular_garaje_update
    AFTER UPDATE ON public.garajes
    FOR EACH ROW
    WHEN (OLD.porcentaje_participacion IS DISTINCT FROM NEW.porcentaje_participacion 
          OR OLD.unidad_familiar_codigo IS DISTINCT FROM NEW.unidad_familiar_codigo)
    EXECUTE FUNCTION public.trigger_recalcular_participacion_garaje();

CREATE TRIGGER trigger_recalcular_garaje_delete
    AFTER DELETE ON public.garajes
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_recalcular_participacion_garaje();

CREATE TRIGGER trigger_recalcular_trastero_insert
    AFTER INSERT ON public.trasteros
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_recalcular_participacion_trastero();

CREATE TRIGGER trigger_recalcular_trastero_update
    AFTER UPDATE ON public.trasteros
    FOR EACH ROW
    WHEN (OLD.porcentaje_participacion IS DISTINCT FROM NEW.porcentaje_participacion 
          OR OLD.unidad_familiar_codigo IS DISTINCT FROM NEW.unidad_familiar_codigo)
    EXECUTE FUNCTION public.trigger_recalcular_participacion_trastero();

CREATE TRIGGER trigger_recalcular_trastero_delete
    AFTER DELETE ON public.trasteros
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_recalcular_participacion_trastero();

CREATE TRIGGER trigger_recalcular_vivienda_insert
    AFTER INSERT ON public.viviendas
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_recalcular_participacion_vivienda();

CREATE TRIGGER trigger_recalcular_vivienda_update
    AFTER UPDATE ON public.viviendas
    FOR EACH ROW
    WHEN (
        OLD.porcentaje_participacion IS DISTINCT FROM NEW.porcentaje_participacion
        OR OLD.unidad_familiar_codigo IS DISTINCT FROM NEW.unidad_familiar_codigo
    )
    EXECUTE FUNCTION public.trigger_recalcular_participacion_vivienda();

-- Enable Row Level Security on all new tables
ALTER TABLE public.viviendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_familiares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trasteros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_unidades_familiares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (deny all access by default, admin client bypasses RLS)
CREATE POLICY "Deny all access to viviendas" ON public.viviendas
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all access to unidades_familiares" ON public.unidades_familiares
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all access to garajes" ON public.garajes
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all access to trasteros" ON public.trasteros
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all access to usuarios_unidades_familiares" ON public.usuarios_unidades_familiares
  FOR ALL
  USING (false)
  WITH CHECK (false);
