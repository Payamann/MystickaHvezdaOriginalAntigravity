-- Keep application terminal states aligned with the email_queue CHECK constraint.
-- Older installations only allow pending/sent/failed and reject preference or
-- entitlement skips at runtime. Constraint discovery uses the constrained column
-- instead of assuming PostgreSQL kept the original generated constraint name.

DO $$
DECLARE
    status_constraint RECORD;
BEGIN
    IF to_regclass('public.email_queue') IS NULL THEN
        RAISE NOTICE 'public.email_queue does not exist; skipped status migration not applied';
        RETURN;
    END IF;

    FOR status_constraint IN
        SELECT constraint_row.conname
        FROM pg_constraint AS constraint_row
        JOIN pg_attribute AS status_column
          ON status_column.attrelid = constraint_row.conrelid
         AND status_column.attname = 'status'
         AND status_column.attnum = ANY (constraint_row.conkey)
        WHERE constraint_row.conrelid = 'public.email_queue'::regclass
          AND constraint_row.contype = 'c'
          AND cardinality(constraint_row.conkey) = 1
    LOOP
        EXECUTE format(
            'ALTER TABLE public.email_queue DROP CONSTRAINT %I',
            status_constraint.conname
        );
    END LOOP;

    ALTER TABLE public.email_queue
        ADD CONSTRAINT email_queue_status_check
        CHECK (status IN ('pending', 'sent', 'skipped', 'failed')) NOT VALID;

    ALTER TABLE public.email_queue
        VALIDATE CONSTRAINT email_queue_status_check;
END
$$;

-- Retire already-known undeliverable subscribers. RFC-reserved example domains
-- are never real inboxes; other domains require an explicit permanent recipient
-- validation error recorded by the provider.
DO $$
DECLARE
    subscriber_table RECORD;
BEGIN
    IF to_regclass('public.email_queue') IS NULL THEN
        RAISE NOTICE 'public.email_queue does not exist; recipient cleanup not applied';
        RETURN;
    END IF;

    FOR subscriber_table IN
        SELECT * FROM (VALUES
            ('newsletter_subscribers', 'is_active'),
            ('horoscope_subscriptions', 'active')
        ) AS tables(table_name, active_column)
    LOOP
        IF to_regclass(format('public.%I', subscriber_table.table_name)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'UPDATE public.%I AS subscriber
                SET %I = false
              WHERE %I = true
                AND (
                    lower(subscriber.email) ~ ''@(example[.](com|org|net)|[^@]+[.]invalid)$''
                    OR EXISTS (
                        SELECT 1
                          FROM public.email_queue AS queued
                         WHERE lower(queued.email_to) = lower(subscriber.email)
                           AND queued.status = ''failed''
                           AND queued.last_error ~* ''invalid[[:space:]]+`?to`?[[:space:]]+field''
                    )
                )',
            subscriber_table.table_name,
            subscriber_table.active_column,
            subscriber_table.active_column
        );
    END LOOP;
END
$$;
