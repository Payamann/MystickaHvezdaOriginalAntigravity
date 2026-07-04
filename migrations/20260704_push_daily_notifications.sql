-- Daily push notification support.
-- Adds per-subscription send tracking so the daily push job can dedupe
-- by Prague calendar day, mirroring horoscope_subscriptions.last_sent_at.

ALTER TABLE public.push_subscriptions
    ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_notified_at
    ON public.push_subscriptions(last_notified_at);
