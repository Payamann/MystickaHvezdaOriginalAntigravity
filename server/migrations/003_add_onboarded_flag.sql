-- Migration: Add onboarding completion flag to users table
-- Tracks whether a user has completed the onboarding flow
-- Replaces localStorage-based tracking with server-side state

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMP;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_is_onboarded ON public.users(is_onboarded);
