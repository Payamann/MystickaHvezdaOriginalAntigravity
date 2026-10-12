-- Apply before deploying the relationship email delivery code.
-- Additive setup; existing orders retain NULL/unknown delivery metadata.
BEGIN;
ALTER TABLE public.one_time_order_inputs
    ADD COLUMN IF NOT EXISTS email_id text,
    ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS one_time_order_email_id_unique
    ON public.one_time_order_inputs(email_id) WHERE email_id IS NOT NULL;

-- A second worker cannot redirect this order's webhook history to another ID.
CREATE OR REPLACE FUNCTION public.preserve_one_time_email_id()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
    IF OLD.email_id IS NOT NULL AND NEW.email_id IS DISTINCT FROM OLD.email_id THEN
        RAISE EXCEPTION 'One-time email provider ID is immutable';
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.preserve_one_time_email_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preserve_one_time_email_id() TO service_role;
DROP TRIGGER IF EXISTS preserve_one_time_email_id ON public.one_time_order_inputs;
CREATE TRIGGER preserve_one_time_email_id BEFORE UPDATE ON public.one_time_order_inputs
    FOR EACH ROW EXECUTE FUNCTION public.preserve_one_time_email_id();

CREATE TABLE IF NOT EXISTS public.relationship_email_events (
    event_id text PRIMARY KEY,
    email_id text NOT NULL,
    event_type text NOT NULL CHECK (event_type IN (
        'email.sent', 'email.delivered', 'email.delivery_delayed',
        'email.bounced', 'email.failed', 'email.suppressed', 'email.complained'
    )),
    event_at timestamptz NOT NULL,
    alert_pending boolean NOT NULL DEFAULT false,
    alert_claim text NOT NULL DEFAULT 'idle',
    alert_claim_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS relationship_email_events_email_id_idx
    ON public.relationship_email_events(email_id);
CREATE INDEX IF NOT EXISTS relationship_email_events_pending_idx
    ON public.relationship_email_events(event_at) WHERE alert_pending = true;
ALTER TABLE public.relationship_email_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.relationship_email_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_email_events TO service_role;
CREATE OR REPLACE VIEW public.relationship_pending_email_alerts
WITH (security_invoker = true) AS
SELECT e.event_id, e.email_id, e.event_type, e.event_at, o.id AS order_id
FROM public.relationship_email_events e
JOIN public.one_time_order_inputs o ON o.email_id = e.email_id
WHERE e.alert_pending = true AND e.alert_claim = 'idle' AND o.product_type = 'relationship_tarot';
REVOKE ALL ON public.relationship_pending_email_alerts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.relationship_pending_email_alerts TO service_role;
COMMIT;
