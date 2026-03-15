-- Migration: Create expired_tokens table for token blacklist
-- This table stores invalidated JWT tokens to prevent their reuse after logout or password change
-- Usage: INSERT into this table when a token should be invalidated
-- Check via: SELECT COUNT(*) FROM expired_tokens WHERE token_jti = ? AND user_id = ?

CREATE TABLE IF NOT EXISTS public.expired_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_jti VARCHAR(255) NOT NULL,
    reason VARCHAR(50) DEFAULT 'logout',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance (critical for token lookup)
CREATE INDEX IF NOT EXISTS idx_expired_tokens_user_id ON public.expired_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_expired_tokens_expires_at ON public.expired_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_expired_tokens_token_jti ON public.expired_tokens(token_jti);

-- RLS Policy: Users can only see their own blacklist entries
ALTER TABLE public.expired_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expired tokens"
    ON public.expired_tokens FOR SELECT
    USING (auth.uid() = user_id);
