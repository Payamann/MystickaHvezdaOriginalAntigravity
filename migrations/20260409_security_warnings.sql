-- ============================================================
-- Security warnings fix — 2026-04-09
-- Fixes 3 remaining Supabase Security Advisor warnings:
--   1. Function Search Path Mutable: increment_angel_likes
--   2. RLS Policy Always True (2x): newsletter_subscribers
-- Note: "Leaked Password Protection" fix requires manual dashboard action.
-- ============================================================


-- ============================================================
-- 1. FIX: increment_angel_likes — SET search_path
--    Zabrání schema injection útoku.
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_angel_likes(card_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.angel_cards_stats
  SET likes = likes + 1
  WHERE name = card_name;
END;
$$;


-- ============================================================
-- 2. FIX: newsletter_subscribers — odstranit "always true" policies
--    INSERT s WITH CHECK (true) je OK pro anonymní přihlášení k newsletteru.
--    SELECT policy odstraníme — pouze service_role (backend) může číst seznam.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can subscribe"        ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public read"                 ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can read newsletter"  ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow insert for all"        ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_insert_only"      ON public.newsletter_subscribers;

-- Povol INSERT pro všechny (anon i autentizované) — pro newsletter signup
CREATE POLICY "newsletter_insert_only"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Žádná SELECT policy → pouze service_role má přístup k seznamu emailů (bypass RLS)


-- ============================================================
-- 3. NOTE: Leaked Password Protection
--    Nelze opravit SQL migrací.
--    Jdi do: Supabase Dashboard → Authentication → Settings
--    → sekce "Password Protection" → zapni "Enable leaked password protection"
-- ============================================================
