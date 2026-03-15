-- Migration: Create login_attempts table for account lockout mechanism
-- Tracks failed login attempts per user account to prevent brute-force attacks
-- Auto-locks account after 5 failed attempts for 15 minutes

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(254) NOT NULL,
    attempt_type VARCHAR(50) NOT NULL DEFAULT 'failed', -- 'failed', 'success'
    ip_address INET,
    user_agent TEXT,
    reason VARCHAR(100), -- 'invalid_password', 'account_locked', etc.
    is_locked BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMP,
    attempt_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(user_email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON public.login_attempts(locked_until);

-- RLS Policy: Only admins and the system can view login attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all login attempts"
    ON public.login_attempts FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Cleanup function: delete old login attempts (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM public.login_attempts
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
