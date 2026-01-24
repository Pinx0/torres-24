-- Create valid_phones table
CREATE TABLE IF NOT EXISTS valid_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL UNIQUE,
    apartment TEXT,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_valid_phones_phone ON valid_phones(phone);

-- Create signup_rate_limits table
CREATE TABLE IF NOT EXISTS signup_rate_limits (
    email TEXT PRIMARY KEY,
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ
);

-- Create index on blocked_until for cleanup queries
CREATE INDEX IF NOT EXISTS idx_signup_rate_limits_blocked_until ON signup_rate_limits(blocked_until);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_valid_phones_updated_at
    BEFORE UPDATE ON valid_phones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
