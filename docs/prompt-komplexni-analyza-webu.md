# Prompt: Komplexní analýza webu Mystická Hvězda

Použití: zkopíruj celý blok níže a vlož jako zadání pro Claude (Claude Code v repozitáři, nebo jiného AI agenta s přístupem ke kódu). Prompt je šitý na míru tomuto projektu — statické HTML + Express server, Supabase, Stripe, PWA, ~900 stránek.

---

```
Proveď komplexní analýzu webu Mystická Hvězda (mystickahvezda.cz). Jde o českou
astrologicko-ezoterickou aplikaci: ~900 statických HTML stránek (nástroje, blog,
programově generované stránky jmen/snáře/numerologie/andělských karet a tarotu),
Express server (server/), Supabase (auth + DB), Stripe předplatné, PWA se
service workerem, Playwright E2E testy a sada auditních skriptů v package.json.

Analyzuj postupně těchto 10 oblastí. U každé dej známku 1–10, konkrétní nálezy
s cestou k souboru a řádkem, a doporučení seřazená podle poměru dopad/pracnost.

1. ARCHITEKTURA A TECHNICKÝ DLUH
   - Struktura repozitáře, duplicity mezi HTML stránkami, sdílené komponenty
     (components/, js/components.js) vs. copy-paste kód.
   - Generované stránky (scripts/generate-*.mjs): konzistence šablon, riziko
     rozjetí generátoru a ručních úprav.
   - Stav TECHNICAL_DEBT_BACKLOG.md — co je reálně vyřešené, co zastaralo.

2. SEO A INDEXACE
   - sitemap.xml vs. reálné soubory (npm run sitemap:check), canonicaly,
     robots.txt, llms.txt.
   - Meta tagy, Open Graph, strukturovaná data (JSON-LD) na klíčových stránkách
     (index, horoskopy, tarot, natální karta, blog).
   - Interní prolinkování: blog clustery (blog:cluster-links), orphan stránky,
     hloubka prokliku z homepage.
   - Duplicitní/thin content u generovaných stránek (jmena/, snar/, slovnik/).

3. VÝKON (Core Web Vitals)
   - Velikost a počet CSS/JS souborů na kritických stránkách, využití
     minifikovaných bundlů (css/*.min.css, js/dist/), render-blocking zdroje.
   - Obrázky: formáty, lazy loading, rozměry, sharp pipeline.
   - Service worker cache strategie (service-worker.js) — co cachuje, verze,
     riziko zastaralého obsahu.

4. BEZPEČNOST
   - Express middleware: helmet, CORS, rate limiting, xss — konfigurace a mezery.
   - Auth flow (auth-client.js, server auth endpointy, JWT), Supabase RLS.
   - Stripe webhooky: ověřování podpisu, idempotence, reconciliace
     (reconcile-stripe-subscriptions.mjs).
   - Úniky tajemství v kódu/HTML, admin.html přístupová ochrana, CSP.

5. PLATBY A MONETIZACE
   - Checkout funnel: cenik.html → auth → Stripe → aktivace. Kde může uživatel
     vypadnout, jak se řeší recovery (pending checkout po registraci).
   - Paywall/freemium logika (freemium-*.js): konzistence napříč nástroji,
     obcházení paywallu z klienta.
   - Soulad cen v UI vs. Stripe produkty.

6. UX A KONVERZNÍ CESTA
   - Homepage → nástroj → registrace → platba: počet kroků, jasnost CTA,
     exit-intent, onboarding.html.
   - Mobilní zážitek (mobile-nav.js, viewport, touch targety).
   - Konzistence navigace a patičky napříč ~900 stránkami.

7. PŘÍSTUPNOST (WCAG 2.1 AA)
   - Kontrast na tmavém kosmickém pozadí, alt texty, aria atributy,
     focus management v modálech, klávesová ovladatelnost nástrojů.

8. OBSAH A BRAND
   - Konzistence tónu (tykání, 2. os. j.č., žádné lomené tvary) napříč
     stránkami a e-maily.
   - Kvalita blogu: zastaralé roky/datované články, interní odkazy, CTA.
   - Čeština: encoding (check:encoding), typografie, gramatika na klíčových
     stránkách.

9. AI FUNKCE A NÁKLADY
   - Endpointy volající AI (mentor, křišťálová koule, minulý život, tarot):
     cost control (check:ai-cost-control), rate limity, cache odpovědí,
     kvalita promptů (viz /prompt-audit skill).

10. TESTY A PROVOZ
    - Pokrytí E2E sekcí (smoke/core/checkout/content/tools) vs. reálné kritické
      cesty; flaky testy.
    - Deploy pipeline (deploy-guard, verify:production, Railway), monitoring
      (revenue-truth-monitor), 404/offline stránky.

VÝSTUP:
a) Executive summary (max 10 vět) — celkové skóre a 3 nejzávažnější problémy.
b) Tabulka: Oblast | Známka | Nejzávažnější nález | Quick win.
c) TOP 10 akcí seřazených podle dopadu na tržby/SEO, každá s odhadem pracnosti
   (S/M/L) a konkrétními soubory.
d) Seznam věcí, které fungují dobře a nemají se měnit.

Nic neopravuj — pouze analyzuj a reportuj. Kde si nejsi jistý, spusť příslušný
auditní skript z package.json (audit:site, sitemap:check, lint, check:*) a
vycházej z jeho výstupu.
```

---

## Tipy k použití

- **Po částech:** pro hlubší výsledek spusť prompt po jednotlivých oblastech (např. jen sekce 2 + 3) — agent jde víc do hloubky.
- **Existující skilly v repu:** oblasti 2, 4, 7 mají vlastní slash commandy (`/seo-audit`, `/security-audit`, `/accessibility-audit`) — tenhle prompt je zastřešuje, ale pro detail použij je.
- **Živý web:** pro výkon (oblast 3) doplň výsledky z PageSpeed Insights / Lighthouse na produkci — z kódu se dá odhadnout jen část.
