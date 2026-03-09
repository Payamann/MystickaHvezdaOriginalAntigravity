# Strategie Získání Prvních 20 Odběratelů — Mystická Hvězda

> Analýza a akční plán pro rychlé získání prvních 20 platících/registrovaných uživatelů na mystickahvezda.cz

---

## Současný Stav Infrastruktury

### Co už máme připraveno (a můžeme využít okamžitě)

| Nástroj | Stav | Soubor |
|---------|------|--------|
| Newsletter signup (footer + popup) | Implementováno | `server/newsletter.js`, `js/newsletter-popup.js` |
| Exit-intent modal (7denní trial) | Implementováno | `js/exit-intent.js` |
| Upgrade modal (soft paywall) | Implementováno | `js/upgrade-modal.js` |
| Email sekvence (welcome, upgrade, churn) | Implementováno | `server/email-service.js` |
| GA4 tracking + conversion funnel | Implementováno | `js/ga-tracking.js` |
| Stripe platby (4 cenové plány) | Implementováno | `server/payment.js` |
| AI Mentor (free 3 msg/den) | Implementováno | `server/mentor.js` |
| 20+ blog článků (SEO) | Implementováno | `server/data/blog-posts.js` |
| PWA + push notifikace | Implementováno | `server/routes/push.js` |

---

## FÁZE 1: Okamžité Akce (Den 1–3) — Cíl: 5 odběratelů

### 1.1 Osobní síť (Warm Outreach)

**Proč:** Nejrychlejší a nejspolehlivější kanál. Konverze z osobních kontaktů je 10–30x vyšší než z cold traffic.

**Akce:**
- Poslat osobní zprávu 30–50 lidem z okolí (přátelé, rodina, kolegové)
- Zaměřit se na lidi, kteří se zajímají o horoskopy, duchovnost, tarot
- Připravit krátkou zprávu (ne spam, ale upřímné sdílení):

> *"Ahoj! Spustil(a) jsem projekt Mystická Hvězda — česká appka s AI horoskopy, tarotem a osobním duchovním mentorem. Můžeš to zkusit zdarma na mystickahvezda.cz. Budu rád(a) za feedback!"*

- Požádat každého, aby to přeposlal 2–3 dalším lidem → viralní efekt
- **Očekávaný výsledek:** 5–10 registrací z 50 oslovených

### 1.2 Sociální sítě — Osobní profily

**Akce:**
- Post na vlastní Facebook, Instagram, LinkedIn
- Instagram Story s ukázkou tarot čtení nebo AI Mentora
- Facebook příspěvek do 3–5 tematických skupin (astrologie, duchovnost, horoskopy CZ/SK)

**Klíčové skupiny na Facebooku (CZ/SK):**
- Astrologie a horoskopy
- Duchovní rozvoj
- Tarot a výklad karet
- Numerologie CZ
- Alternativní medicína a spiritualita

> **Tip:** Neprodávat — sdílet hodnotu. Např. "Zajímavé, co mi vyšlo v AI tarot čtení..." s odkazem.

---

## FÁZE 2: Obsahová Strategie (Den 3–7) — Cíl: +8 odběratelů

### 2.1 Virální "Hook" Obsah

Vytvořit obsah, který lidi přirozeně sdílejí. Astrologický obsah má na sociálních sítích nadprůměrný engagement.

**Formáty s nejvyšším potenciálem:**

| Formát | Platforma | Příklad |
|--------|-----------|---------|
| Znamení meme/infografika | Instagram, Facebook | "Co dělá tvoje znamení, když je ve stresu" |
| Krátké video | TikTok, Instagram Reels | "AI mi vyložila tarot — tady je výsledek" |
| Interaktivní příběh | Instagram Stories | "Jaké je tvoje životní číslo? Spočítej si!" |
| Blog článek | Web + sdílení | "5 věcí, které o tobě prozradí tvoje natální karta" |

### 2.2 Lead Magnet — Bezplatné Čtení

Využít existující infrastrukturu (AI Mentor s 3 zprávami/den zdarma) jako lead magnet:

- **Nabídka:** "Získej ZDARMA své osobní AI tarotové čtení"
- **Požadavek:** Registrace (email)
- **Výsledek:** Uživatel je v databázi → automatická email sekvence se spustí

### 2.3 Cross-Posting na Reddit/Fóra

- r/astrology, r/tarot, r/spirituality (anglicky — rozšíření publika)
- české fórum emimino.cz, modrykonik.sk (sekce volný čas/zábava)
- Diskuzní fóra na novinky.cz, idnes.cz

---

## FÁZE 3: Cílený Outreach (Den 7–14) — Cíl: +7 odběratelů

### 3.1 Mikro-Influenceři

Najít 5–10 českých/slovenských mikro-influencerů (1K–10K followers) v nice:
- Astrologie / tarot / spiritualita
- Wellness / mindfulness / jóga
- Ženský lifestyle

**Nabídka pro ně:**
- Doživotní premium přístup zdarma (Hvězdný Průvodce — 199 CZK/měs hodnota)
- Provize z přivedených uživatelů (affiliate program — plánován)
- Exkluzivní "influencer" badge na profilu

**Kde je najít:**
- Instagram hashtag hledání: #astrologie, #tarotcz, #horoskopy, #duchovnost
- TikTok: čeští tvůrci obsahu o astrologii
- YouTube: české astrologické kanály

### 3.2 Partnerství s Komunitami

- Oslovit české astrologické školy/kurzy
- Nabídnout studentům 30denní trial premium přístupu
- Spolupráce s wellness centry, jóga studii

### 3.3 Product Hunt / Alternativy

- Registrovat na alternativní české produktové platformy
- Napsat článek na Medium/blog.cz o "Jak AI mění astrologii"
- Guest post na partnerském blogu

---

## FÁZE 4: Optimalizace Konverze (Průběžně)

### 4.1 Vylepšení Existujícího Onboardingu

Aktuální flow:
```
Návštěva → Newsletter popup (45s) → Exit-intent (opuštění) → Email sekvence
```

Optimalizovaný flow:
```
Návštěva → Okamžitý "hook" (bezplatné čtení) → Registrace →
→ Onboarding email (den 0) → Funkce discovery (den 1) →
→ "Co ti uniká" (den 7) → Sleva 50% (den 14)
```

### 4.2 A/B Test Newsletter Popup

Aktuální trigger: 45 sekund NEBO cursor exit
- **Test A:** Trigger po 30 sekundách
- **Test B:** Trigger po scrollu 50% stránky
- **Test C:** Trigger po interakci s první funkcí (horoskop)

### 4.3 Social Proof

Přidat na landing page:
- Počet provedených čtení (dynamický counter)
- Testimonials (i z beta uživatelů/přátel)
- "Právě teď si čte horoskop X lidí" (live counter)

---

## Konkrétní Časový Plán

```
DEN 1:  Osobní outreach (30-50 zpráv)                    → +3-5 subscribers
DEN 2:  Post na sociální sítě + FB skupiny                → +2-3 subscribers
DEN 3:  Vytvořit virální obsah (meme/infografika)         → +1-2 subscribers
DEN 4:  Sdílet obsah na IG, TikTok, FB                    → +2-3 subscribers
DEN 5:  Oslovit 5 mikro-influencerů                       → +1-2 subscribers
DEN 7:  Reddit/fóra posting                               → +1-2 subscribers
DEN 10: Follow-up s influencery, druhá vlna obsahu        → +2-3 subscribers
DEN 14: Zhodnocení, optimalizace na základě dat           → +1-2 subscribers
────────────────────────────────────────────────────────────────────────────
CELKEM:                                                   ~14-22 subscribers
```

---

## Měření Úspěchu

### KPIs ke Sledování (v GA4)

| Metrika | Cíl | Kde sledovat |
|---------|-----|-------------|
| Registrace | 20 za 14 dní | Supabase `users` tabulka |
| Newsletter signups | 50+ za 14 dní | `newsletter_subscribers` tabulka |
| Konverzní poměr návštěva→registrace | >5% | GA4 funnel |
| Konverzní poměr free→premium | >10% | Stripe dashboard |
| Email open rate | >30% | Resend dashboard |
| Průměrný čas na stránce | >3 min | GA4 |

### SQL Dotaz pro Sledování Růstu

```sql
-- Denní registrace
SELECT DATE(created_at) as den, COUNT(*) as nove_registrace
FROM users
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY DATE(created_at)
ORDER BY den;

-- Newsletter přihlášení podle zdroje
SELECT source, COUNT(*) as pocet
FROM newsletter_subscribers
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY source
ORDER BY pocet DESC;

-- Konverze free → premium
SELECT
  COUNT(*) FILTER (WHERE subscription_tier = 'free') as free_users,
  COUNT(*) FILTER (WHERE subscription_tier != 'free') as premium_users,
  ROUND(COUNT(*) FILTER (WHERE subscription_tier != 'free')::numeric /
        NULLIF(COUNT(*), 0) * 100, 1) as conversion_rate
FROM users;
```

---

## Nejúčinnější Taktiky (Seřazeno podle ROI)

| # | Taktika | Náklady | Čas | Očekávaný výsledek |
|---|---------|---------|-----|-------------------|
| 1 | Osobní zprávy přátelům | 0 Kč | 2 hodiny | 5-10 registrací |
| 2 | FB skupiny (astrologie CZ) | 0 Kč | 1 hodina | 3-5 registrací |
| 3 | Instagram Story + Reels | 0 Kč | 3 hodiny | 2-5 registrací |
| 4 | Bezplatné AI čtení jako lead magnet | 0 Kč | Existuje | 5-10 registrací |
| 5 | Mikro-influencer barter | 0 Kč (premium přístup) | 2 hodiny | 3-8 registrací |
| 6 | Reddit/fóra | 0 Kč | 1 hodina | 1-3 registrací |
| 7 | Blog cross-posting | 0 Kč | 2 hodiny | 1-2 registrací |

**Celkové náklady: 0 Kč | Celkový čas: ~11 hodin | Očekávaný výsledek: 20-43 registrací**

---

## Klíčová Doporučení

1. **Začněte dnes s osobní sítí** — je to nejrychlejší a nejvíce konvertující kanál
2. **Využijte existující infrastrukturu** — newsletter popup, exit-intent a email sekvence už fungují
3. **Sdílejte hodnotu, neprodávejte** — ukažte výsledky čtení, ne ceník
4. **Free tier je váš nejsilnější nástroj** — 3 zprávy AI Mentora/den stačí k vytvoření návyku
5. **Měřte od prvního dne** — GA4 je připraveno, sledujte konverze denně
6. **Každý uživatel = potenciální ambasador** — požádejte o sdílení a doporučení

---

*Poslední aktualizace: 2026-03-09*
*Projekt: Mystická Hvězda (mystickahvezda.cz)*
