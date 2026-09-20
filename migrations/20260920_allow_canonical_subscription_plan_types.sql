-- Keep the subscriptions constraint aligned with server/config/constants.js.
-- The legacy `vip` value is normalized before the canonical constraint is
-- validated. This migration is idempotent and preserves all supported plans.

DO $$
DECLARE
    plan_constraint RECORD;
BEGIN
    IF to_regclass('public.subscriptions') IS NULL THEN
        RAISE NOTICE 'public.subscriptions does not exist; plan type migration not applied';
        RETURN;
    END IF;

    FOR plan_constraint IN
        SELECT constraint_row.conname
        FROM pg_constraint AS constraint_row
        JOIN pg_attribute AS plan_column
          ON plan_column.attrelid = constraint_row.conrelid
         AND plan_column.attname = 'plan_type'
         AND plan_column.attnum = ANY (constraint_row.conkey)
        WHERE constraint_row.conrelid = 'public.subscriptions'::regclass
          AND constraint_row.contype = 'c'
          AND cardinality(constraint_row.conkey) = 1
    LOOP
        EXECUTE format(
            'ALTER TABLE public.subscriptions DROP CONSTRAINT %I',
            plan_constraint.conname
        );
    END LOOP;

    UPDATE public.subscriptions
       SET plan_type = 'vip_majestrat'
     WHERE plan_type = 'vip';

    ALTER TABLE public.subscriptions
        ADD CONSTRAINT subscriptions_plan_type_check
        CHECK (plan_type IN (
            'free',
            'premium_monthly',
            'exclusive_monthly',
            'vip_majestrat'
        )) NOT VALID;

    ALTER TABLE public.subscriptions
        VALIDATE CONSTRAINT subscriptions_plan_type_check;
END
$$;
