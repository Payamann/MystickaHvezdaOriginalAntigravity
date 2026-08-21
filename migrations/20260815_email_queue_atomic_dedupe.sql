-- Enforce lifecycle email deduplication in PostgreSQL so concurrent schedulers
-- cannot create the same logical message twice.

ALTER TABLE public.email_queue
    ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

-- Backfill the keys already stored in the historical JSONB payload.
UPDATE public.email_queue
SET dedupe_key = NULLIF(BTRIM(data ->> 'dedupeKey'), '')
WHERE dedupe_key IS NULL
  AND jsonb_typeof(data) = 'object'
  AND NULLIF(BTRIM(data ->> 'dedupeKey'), '') IS NOT NULL;

-- Keep one canonical row for each logical message. Prefer an already delivered
-- terminal row; otherwise preserve the oldest pending delivery. Extra pending
-- rows are marked skipped so a pre-existing race cannot send duplicates after
-- this migration. Historical duplicate rows receive an audit-only unique key;
-- the canonical row keeps the logical key that future inserts will conflict on.
WITH ranked_duplicates AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(email_to), template, dedupe_key
            ORDER BY
                CASE status
                    WHEN 'sent' THEN 0
                    WHEN 'skipped' THEN 1
                    WHEN 'failed' THEN 2
                    WHEN 'pending' THEN 3
                    ELSE 4
                END,
                scheduled_for ASC NULLS LAST,
                created_at ASC NULLS LAST,
                id ASC
        ) AS duplicate_rank
    FROM public.email_queue
    WHERE dedupe_key IS NOT NULL
)
UPDATE public.email_queue AS queue_row
SET
    status = CASE WHEN queue_row.status = 'pending' THEN 'skipped' ELSE queue_row.status END,
    sent_at = CASE
        WHEN queue_row.status = 'pending' THEN COALESCE(queue_row.sent_at, NOW())
        ELSE queue_row.sent_at
    END,
    last_error = CASE
        WHEN queue_row.status = 'pending'
            THEN 'Skipped while installing atomic email deduplication.'
        ELSE queue_row.last_error
    END,
    dedupe_key = CONCAT('legacy-duplicate:', queue_row.id),
    updated_at = NOW()
FROM ranked_duplicates
WHERE queue_row.id = ranked_duplicates.id
  AND ranked_duplicates.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS email_queue_recipient_template_dedupe_uidx
    ON public.email_queue (LOWER(email_to), template, dedupe_key)
    WHERE dedupe_key IS NOT NULL;

COMMENT ON COLUMN public.email_queue.dedupe_key IS
    'Stable logical delivery key. Uniqueness is scoped to normalized recipient and template.';
