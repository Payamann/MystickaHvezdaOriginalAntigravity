-- Retry tracking for one-time paid PDF orders (Osobní mapa, Roční horoskop).
-- Fulfillment (Claude generation + Playwright render + Resend delivery) runs
-- async after the Stripe webhook responds. Without these columns a failure
-- there leaves the order stuck at status='checkout_created' forever, with no
-- way to tell "still processing" apart from "failed and needs a retry".
-- Mirrors the retry_count/last_error convention from email_queue
-- (20260309_create_email_queue.sql).

ALTER TABLE public.one_time_order_inputs
    ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_one_time_order_inputs_status_created
    ON public.one_time_order_inputs (status, created_at);
