-- Keep the Stripe webhook reservation table aligned with the application state
-- machine. Failed handlers are persisted so a later Stripe retry can reclaim the
-- event instead of leaving it permanently locked in `processing`.

DO $$
DECLARE
    status_constraint RECORD;
BEGIN
    IF to_regclass('public.payment_events') IS NULL THEN
        RAISE NOTICE 'public.payment_events does not exist; failed status migration not applied';
        RETURN;
    END IF;

    FOR status_constraint IN
        SELECT constraint_row.conname
        FROM pg_constraint AS constraint_row
        JOIN pg_attribute AS status_column
          ON status_column.attrelid = constraint_row.conrelid
         AND status_column.attname = 'status'
         AND status_column.attnum = ANY (constraint_row.conkey)
        WHERE constraint_row.conrelid = 'public.payment_events'::regclass
          AND constraint_row.contype = 'c'
          AND cardinality(constraint_row.conkey) = 1
    LOOP
        EXECUTE format(
            'ALTER TABLE public.payment_events DROP CONSTRAINT %I',
            status_constraint.conname
        );
    END LOOP;

    ALTER TABLE public.payment_events
        ADD CONSTRAINT payment_events_status_check
        CHECK (status IN ('processing', 'success', 'failed')) NOT VALID;

    ALTER TABLE public.payment_events
        VALIDATE CONSTRAINT payment_events_status_check;
END
$$;
