# Analýza šancí na úspěch a cenové strategie — Mystická Hvězda

## 1. Co je Mystická Hvězda

Česká spirituální SaaS platforma (PWA) nabízející:
- Denní horoskopy s personalizací
- Tarotové výklady (1 i 3 karty)
- Numerologické analýzy
- Natální karty
- Partnerskou shodu (synastrie)
- Astrokartografii
- AI mentora (chatbot)
- Křišťálovou kouli (AI odpovědi)
- Fáze měsíce

**Tech stack:** Node.js/Express, vanilla JS frontend, Supabase (PostgreSQL), Google Gemini 2.0 Flash Lite, Stripe, PWA.

---

## 2. Šance na úspěch

### Silné stránky

1. **Niche trh v češtině** — Většina konkurence (Co-Star, The Pattern, Sanctuary) je v angličtině. Česká lokalizace je velká výhoda.
2. **Široký záběr funkcí** — Horoskopy, tarot, numerologie, natální karty, synastrie, AI mentoring — nadprůměrně bohatý MVP.
3. **Funkční Stripe monetizace** — Freemium model s paywallem je správný přístup.
4. **PWA** — Instalovatelná bez App Store, nižší bariéra a distribuční náklady.
5. **AI generace** — Gemini API dává obsahu variabilitu a unikátnost.

### Rizika

1. **Kritické bezpečnostní chyby** — `/activate-premium` bypass, Stripe webhook bez ověření, XSS zranitelnosti.
2. **Bug v platbách** — `premium_yearly` uživatelé nemají přístup k premium funkcím (chyba v middleware).
3. **Chybí subscription lifecycle** — Žádný upgrade/downgrade, připomínky, grace period.
4. **Žádná analytika** — Nelze optimalizovat konverze ani sledovat churn.
5. **Výkon** — 42 MB obrázků, 15+ JS requestů/stránku, render-blokující skripty.
6. **Kvalita kódu** — Monolitické soubory, duplicity, minimální testy.

### Celkové hodnocení: 6/10

Dobrý základ a správná nika. Po opravě kritických bugů má reálnou šanci.

---

## 3. Aktuální cenová struktura

| Plán | Cena | Funkce |
|------|------|--------|
| **Poutník** (Free) | 0 Kč | Základní denní horoskop, 1 tarot karta, 3 zprávy mentorovi/den |
| **Hvězdný Průvodce** | 199 Kč/měsíc | Neomezené výklady, detailní horoskopy, plný přístup |
| **Osvícení** | 1 190 Kč/rok | Vše z Průvodce, roční sleva (~99 Kč/měsíc) |

### Hodnocení cen

- **199 Kč/měsíc** (~8 EUR) je pod hranicí impulsního nákupu a srovnatelné s globální konkurencí (Co-Star: $5-10, The Pattern: $15/měsíc).
- **1 190 Kč/rok** (~50% sleva oproti měsíčnímu) je standardní motivace pro roční závazek.

### Doporučené úpravy

1. **7denní free trial** — Výrazně zvyšuje konverze. Uživatel si zvykne na plné funkce.
2. **Intro cena** — 149 Kč/měsíc (první 3 měsíce) → 199 Kč poté.
3. **Jednorázové nákupy** — Detailní natální karta nebo partnerská analýza za 99–149 Kč pro uživatele, kteří nechtějí předplatné.
4. **VIP tier** — ~349 Kč/měsíc s prioritními AI odpověďmi a exkluzivními funkcemi.

---

## 4. Odhad příjmů

| Scénář | Registrovaní | Konverze (5%) | Platící | Měsíční příjem |
|--------|-------------|---------------|---------|----------------|
| Start | 1 000 | 50 | 50 | ~10 000 Kč |
| Růst | 5 000 | 250 | 250 | ~50 000 Kč |
| Etablovaná | 10 000 | 500 | 500 | ~100 000 Kč |

**Měsíční náklady:** Gemini API (~500 Kč), Supabase (free tier), Railway (~500 Kč), Stripe (1.4% + 6 Kč/transakce).

---

## 5. Kritické kroky k úspěchu

| Priorita | Úkol | Dopad |
|----------|------|-------|
| P0 | Odstranit `/activate-premium` endpoint | Uživatelé si dávají premium zdarma |
| P0 | Opravit `premium_yearly` v middleware | Roční předplatitelé nemají přístup |
| P0 | Vyžadovat Stripe webhook secret | Lze podvrhnout platby |
| P1 | Přidat 7denní trial | Zvýšení konverzí |
| P1 | Opravit XSS zranitelnosti | Bezpečnost uživatelů |
| P1 | Optimalizovat obrázky (42 MB → ~10 MB) | Rychlost načítání |
| P2 | Přidat analytiku konverzí | Data pro rozhodování |
| P2 | Implementovat email systém | Reset hesla, engagement |
| P2 | Bundlovat JS soubory | Výkon |
| P3 | Přidat subscription lifecycle | Snížení churnu |
| P3 | Přidat sociální sdílení | Virální růst |

---

## 6. Shrnutí

| Aspekt | Hodnocení |
|--------|-----------|
| Nápad a nika | 8/10 |
| Funkční rozsah | 8/10 |
| Technická připravenost | 4/10 |
| Cenová strategie | 7/10 |
| **Šance na úspěch (po opravách)** | **6–7/10** |

Aplikace má solidní základ, správně zvolenou cílovou skupinu a rozumné ceny. Klíčem k úspěchu je oprava kritických bezpečnostních chyb, přidání free trialu a investice do marketingu na českém trhu.
