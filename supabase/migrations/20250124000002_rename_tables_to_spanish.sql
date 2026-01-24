-- Rename existing tables to Spanish

-- Rename valid_phones to telefonos_validos
ALTER TABLE IF EXISTS public.valid_phones RENAME TO telefonos_validos;

-- Rename column phone to telefono
ALTER TABLE IF EXISTS public.telefonos_validos RENAME COLUMN phone TO telefono;

-- Rename column apartment to apartamento
ALTER TABLE IF EXISTS public.telefonos_validos RENAME COLUMN apartment TO apartamento;

-- Rename column name to nombre
ALTER TABLE IF EXISTS public.telefonos_validos RENAME COLUMN name TO nombre;

-- Rename index idx_valid_phones_phone to idx_telefonos_validos_telefono
DROP INDEX IF EXISTS public.idx_valid_phones_phone;
CREATE INDEX IF NOT EXISTS idx_telefonos_validos_telefono ON public.telefonos_validos(telefono);

-- Rename trigger update_valid_phones_updated_at to update_telefonos_validos_updated_at
DROP TRIGGER IF EXISTS update_valid_phones_updated_at ON public.telefonos_validos;
CREATE TRIGGER update_telefonos_validos_updated_at
    BEFORE UPDATE ON public.telefonos_validos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Drop and recreate RLS policy for telefonos_validos
ALTER TABLE IF EXISTS public.telefonos_validos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all access to valid_phones" ON public.telefonos_validos;
DROP POLICY IF EXISTS "Deny all access to telefonos_validos" ON public.telefonos_validos;
CREATE POLICY "Deny all access to telefonos_validos" ON public.telefonos_validos
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Rename signup_rate_limits to limites_registro
ALTER TABLE IF EXISTS public.signup_rate_limits RENAME TO limites_registro;

-- Rename column email to correo
ALTER TABLE IF EXISTS public.limites_registro RENAME COLUMN email TO correo;

-- Rename column attempts to intentos
ALTER TABLE IF EXISTS public.limites_registro RENAME COLUMN attempts TO intentos;

-- Rename column last_attempt to ultimo_intento
ALTER TABLE IF EXISTS public.limites_registro RENAME COLUMN last_attempt TO ultimo_intento;

-- Rename column blocked_until to bloqueado_hasta
ALTER TABLE IF EXISTS public.limites_registro RENAME COLUMN blocked_until TO bloqueado_hasta;

-- Rename index idx_signup_rate_limits_blocked_until to idx_limites_registro_bloqueado_hasta
DROP INDEX IF EXISTS public.idx_signup_rate_limits_blocked_until;
CREATE INDEX IF NOT EXISTS idx_limites_registro_bloqueado_hasta ON public.limites_registro(bloqueado_hasta);

-- Drop and recreate RLS policy for limites_registro
ALTER TABLE IF EXISTS public.limites_registro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all access to signup_rate_limits" ON public.limites_registro;
DROP POLICY IF EXISTS "Deny all access to limites_registro" ON public.limites_registro;
CREATE POLICY "Deny all access to limites_registro" ON public.limites_registro
  FOR ALL
  USING (false)
  WITH CHECK (false);
