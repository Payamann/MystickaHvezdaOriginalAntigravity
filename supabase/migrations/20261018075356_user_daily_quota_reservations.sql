-- Atomic per-user daily free-tier reservations for AI features.
-- These tables are server-only; the app calls the RPCs with its service-role client.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE public.user_daily_quota_counters (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  feature text NOT NULL CHECK (feature IN ('mentor', 'crystal_ball')),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  PRIMARY KEY (user_id, usage_date, feature)
);

CREATE TABLE public.user_daily_quota_reservations (
  reservation_id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  feature text NOT NULL CHECK (feature IN ('mentor', 'crystal_ball')),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX user_daily_quota_counters_usage_date_idx
  ON public.user_daily_quota_counters (usage_date);

CREATE INDEX user_daily_quota_reservations_usage_date_idx
  ON public.user_daily_quota_reservations (usage_date);

ALTER TABLE public.user_daily_quota_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota_reservations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_daily_quota_counters FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.user_daily_quota_reservations FROM PUBLIC, anon, authenticated, service_role;

-- Preserve today's already-used quota when switching away from client-saved history counts.
WITH day_window AS (
  SELECT
    (pg_catalog.now() AT TIME ZONE 'UTC')::date AS usage_date,
    pg_catalog.date_trunc('day', pg_catalog.now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS start_at
), legacy_usage AS (
  SELECT messages.user_id, day.usage_date, 'mentor'::text AS feature, pg_catalog.count(*)::integer AS used_count
  FROM public.mentor_messages AS messages
  CROSS JOIN day_window AS day
  WHERE messages.role = 'user'
    AND messages.created_at >= day.start_at
    AND messages.created_at < day.start_at + INTERVAL '1 day'
  GROUP BY messages.user_id, day.usage_date

  UNION ALL

  SELECT readings.user_id, day.usage_date, 'crystal_ball'::text AS feature, pg_catalog.count(*)::integer AS used_count
  FROM public.readings AS readings
  CROSS JOIN day_window AS day
  WHERE readings.type = 'crystal-ball'
    AND readings.created_at >= day.start_at
    AND readings.created_at < day.start_at + INTERVAL '1 day'
  GROUP BY readings.user_id, day.usage_date
)
INSERT INTO public.user_daily_quota_counters AS current_counter (user_id, usage_date, feature, used_count)
SELECT user_id, usage_date, feature, used_count
FROM legacy_usage
ON CONFLICT (user_id, usage_date, feature)
DO UPDATE SET used_count = CASE
  WHEN current_counter.used_count > EXCLUDED.used_count
    THEN current_counter.used_count
  ELSE EXCLUDED.used_count
END;

CREATE OR REPLACE FUNCTION public.reserve_user_daily_quota(
  p_user_id uuid,
  p_date_key date,
  p_feature text,
  p_limit integer
)
RETURNS TABLE (allowed boolean, reservation_id uuid, used integer, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_used integer;
  v_reservation_id uuid;
BEGIN
  IF p_user_id IS NULL
    OR p_date_key IS NULL
    OR p_feature IS NULL
    OR p_feature NOT IN ('mentor', 'crystal_ball')
    OR p_limit IS NULL
    OR p_limit < 1
    OR p_limit > 100
  THEN
    RAISE EXCEPTION 'Invalid daily quota reservation arguments'
      USING ERRCODE = '22023';
  END IF;

  -- Old buckets no longer affect a daily allowance. Keep abandoned reservations
  -- for their original day; automatically refunding them could undo a successful
  -- response whose commit RPC had a transient failure.
  DELETE FROM public.user_daily_quota_reservations
  WHERE usage_date < p_date_key - 90;

  DELETE FROM public.user_daily_quota_counters
  WHERE usage_date < p_date_key - 90;

  INSERT INTO public.user_daily_quota_counters (user_id, usage_date, feature)
  VALUES (p_user_id, p_date_key, p_feature)
  ON CONFLICT (user_id, usage_date, feature) DO NOTHING;

  -- The row update serializes simultaneous reservations for the same quota.
  UPDATE public.user_daily_quota_counters
  SET used_count = used_count + 1,
      updated_at = pg_catalog.now()
  WHERE user_id = p_user_id
    AND usage_date = p_date_key
    AND feature = p_feature
    AND used_count < p_limit
  RETURNING used_count INTO v_used;

  IF v_used IS NULL THEN
    SELECT counter.used_count INTO v_used
    FROM public.user_daily_quota_counters AS counter
    WHERE counter.user_id = p_user_id
      AND counter.usage_date = p_date_key
      AND counter.feature = p_feature;
    RETURN QUERY SELECT false, NULL::uuid, COALESCE(v_used, 0), 0;
    RETURN;
  END IF;

  INSERT INTO public.user_daily_quota_reservations (user_id, usage_date, feature)
  VALUES (p_user_id, p_date_key, p_feature)
  RETURNING user_daily_quota_reservations.reservation_id INTO v_reservation_id;

  RETURN QUERY SELECT true, v_reservation_id, v_used, CASE WHEN p_limit > v_used THEN p_limit - v_used ELSE 0 END;
END;
$$;

CREATE OR REPLACE FUNCTION public.commit_user_daily_quota(p_reservation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_committed boolean;
BEGIN
  DELETE FROM public.user_daily_quota_reservations
  WHERE reservation_id = p_reservation_id;
  v_committed := FOUND;
  RETURN v_committed;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_user_daily_quota(p_reservation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_usage_date date;
  v_feature text;
BEGIN
  DELETE FROM public.user_daily_quota_reservations
  WHERE reservation_id = p_reservation_id
  RETURNING user_daily_quota_reservations.user_id,
            user_daily_quota_reservations.usage_date,
            user_daily_quota_reservations.feature
  INTO v_user_id, v_usage_date, v_feature;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.user_daily_quota_counters
  SET used_count = CASE WHEN used_count > 0 THEN used_count - 1 ELSE 0 END,
      updated_at = pg_catalog.now()
  WHERE user_id = v_user_id
    AND usage_date = v_usage_date
    AND feature = v_feature;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_user_daily_quota(uuid, date, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_user_daily_quota(uuid, date, text, integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.commit_user_daily_quota(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_user_daily_quota(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.release_user_daily_quota(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_user_daily_quota(uuid) TO service_role;

COMMIT;
