# Stale Scripts Archive

This folder keeps old one-off helper scripts that should no longer be used as
active project tooling.

- `generate_sitemap.js` used a hard-coded local Windows workspace path.
- `generate-sitemap.js` was a second, partial sitemap generator beside the
  server-side sitemap helper and the active `npm run audit:site` validation.
- `server-generate-sitemap.js` was the old `server/scripts/generate-sitemap.js`
  helper. It rewrote `sitemap.xml` with a non-canonical origin and current-date
  `lastmod` values, so it is archived until replaced by a safe generator.
- `add-pwa-support.js` was a one-off HTML patcher that injected PWA tags and
  inline service worker registration. Active pages now load
  `js/dist/register-sw.js` instead.
- `clear-sw-cache.js` was a browser-console development snippet. Active cache
  invalidation is handled by `scripts/update-service-worker-cache.mjs`.
- `generate-pwa-icons.js` was an older PNG-only PWA icon helper. The active
  icon generator is `server/scripts/create-pwa-icons.js`.
- `encoding-repair-scripts/` contains old one-off mojibake/content repair
  scripts. They intentionally contain broken character samples and historical
  patch logic, and are not part of active project validation.
- `bulk-html-mutators/` contains old broad HTML/CSS/SEO/performance/image
  patchers that predate the current build, CSP, and audit workflow.
  `update-seo.js` is archived there because it would reapply stale OG/JSON-LD
  snippets across HTML files instead of using the current audited page metadata.
  The old PurgeCSS runner/config is archived there as well; PurgeCSS is no
  longer a project dependency and the active CSS build is `npm run build:css`.
- `gemini-one-offs/` contains old manual Gemini probe/image test scripts that
  were not referenced by package scripts or active documentation. Current server
  AI runtime uses Anthropic; image generation helpers should be reviewed before
  being promoted back to active tooling.
- `server-one-offs/` contains old local diagnostics that are no longer part of
  active operations. `verify-horoscope.js` predated CSRF-protected API calls, and
  `debug-reading.js` dumped recent Supabase reading rows directly.
  `verify_db_data.js` checked the old `user_readings` table instead of the
  current `readings` table. `db-check.js` was a manual service-role Supabase
  diagnostic that printed user emails and message snippets, so it should not be
  presented as an active helper. `test-horoskop-email.js` was a manual paid
  Claude/PDF/email smoke script with live side effects and no package-script
  entrypoint; current payment email behavior is covered through application
  code paths instead.
- `tarot-one-offs/` contains the old manual Gemini tarot filename audit. The
  active guard is now `npm run audit:tarot-assets`, which validates
  `data/tarot-cards.json` against actual files. It also contains the old
  `process-tarot-images.js` batch converter, which expected a missing
  `temp_new_tarot/` source directory and historical filename mappings.
- `angel-one-offs/` contains old one-time angel card data patchers. The current
  `data/angel-cards.json` already contains archetype assignments.
- `asset-one-offs/` contains old one-time asset converters/generators. The logo
  converter expected a missing `img/logo-3d.png`, the Gemini planet SVG
  generator is superseded by deterministic checked-in SVGs, and the angel
  archetype PNG-to-WebP conversion has already been applied. The broad image
  converter and old background/map optimizers are archived as well because they
  rewrite checked-in assets from missing or intentionally preserved source files.

They are archived for traceability so they do not appear as runnable current
tools in `scripts/`.
