-- Enable Row Level Security on valid_phones table
ALTER TABLE public.valid_phones ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Deny all access to valid_phones" ON public.valid_phones;

-- Deny all access to valid_phones for all roles
-- (Admin client bypasses RLS, so this only affects regular API access)
CREATE POLICY "Deny all access to valid_phones" ON public.valid_phones
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Enable Row Level Security on signup_rate_limits table
ALTER TABLE public.signup_rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Deny all access to signup_rate_limits" ON public.signup_rate_limits;

-- Deny all access to signup_rate_limits for all roles
-- (Admin client bypasses RLS, so this only affects regular API access)
CREATE POLICY "Deny all access to signup_rate_limits" ON public.signup_rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Fix the function search_path security issue
-- Set a fixed, secure search_path to prevent search_path injection attacks
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
