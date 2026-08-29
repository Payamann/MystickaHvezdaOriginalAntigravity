# Sprint 1 release checklist

## Before application deployment

- Apply `migrations/20260828_user_consents.sql` in Supabase.
- Confirm that `public.user_consents` is writable only through the service role and has RLS enabled.
- Provide the legal operator/controller identity (legal name, registered address and company ID where applicable) and add it to `soukromi.html`, `podminky.html` and `kontakt.html`. These values must come from the operator and must not be inferred from the codebase.

## Edge configuration

- Configure Cloudflare/Railway so both `http://mystickahvezda.cz/*` and `https://mystickahvezda.cz/*` return a permanent redirect to `https://www.mystickahvezda.cz/$1` before the request is blocked by the edge.
- Preserve the path and query string.
- Verify with redirects disabled; the first response must be `301` or `308`, never `403`.

## Post-deployment verification

- Open `/prihlaseni.html?mode=register`, submit a new registration and verify a matching `user_consents` row.
- Verify that `/ochrana-soukromi.html?source=registration` redirects to `/soukromi.html?source=registration`.
- Verify that a seven-character password is rejected and an eight-character password is accepted.
- Run `npm run smoke:production:auth-handoff` and `npm run smoke:production:critical-assets`.
