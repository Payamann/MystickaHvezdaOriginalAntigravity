# Lessons Learned

| Pattern | Correction | Date |
|---------|------------|------|
| [near-miss] Změna marketingové copy ve statickém HTML se v prohlížeči neprojevila — cenik.js přepisuje texty karet přes textContent po načtení | Při změně copy v HTML vždy grepnout js/ na textContent/innerHTML přepisy téhož elementu a změnit obě místa | 2026-07-03 |
| [env] Jest ve worktree nenajde testy — testMatch glob se rozbije na `\.claude` v cestě | Spouštět s explicitním `--testMatch "**/server/tests/**/*.test.js" --testMatch "**/tests/frontend/**/*.test.js"` | 2026-07-03 |
| [env] Stránky načítají js/dist/* bundly, ne js/* zdrojáky | Po každé změně v js/ spustit `npm run build:js` a bumpnout `?v=` u dotčeného script tagu | 2026-07-03 |
| [near-miss] Slovo `export`/`import` KDEKOLIV ve zdroji js/ (i v komentáři nebo řetězci jako "Blob export fallback") přepne build-js.mjs na ES modul a static-html-csp test pak vyžaduje type="module" | V classic (IIFE) JS souborech se vyhnout samostatným slovům export/import i v textech; použít render/build/conversion | 2026-07-04 |
| [incident] Deploy-poller fetchoval novou verzovanou URL (?v=10) PŘED dokončením deploye → Cloudflare zacachoval starý obsah pod novou URL a servíroval ho i po deployi | Deploy ověřovat přes HTML marker nebo s náhodným cache-busterem (&cb=...); přesnou verzovanou asset URL fetchnout až JEDNOU po potvrzení HTML. Pozn.: esbuild eskapuje ne-ASCII (Sdílet→Sd\xEDlet), grep podle českých řetězců v dist nefunguje | 2026-07-04 |

## Golden Rules
1. **Never use `var`**: Always use `const` or `let`.
2. **Vanilla First**: No external libraries unless absolutely necessary.
3. **Responsive by Design**: All UI changes must be tested on mobile widths.
4. **Zero Placeholder Policy**: All images and text must be real/generated, never "lorem ipsum".
