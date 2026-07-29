# Hodnotová analýza — max hodnota appky × přidaná hodnota pro uživatele

| | |
|---|---|
| **Datum** | 2026-07-14 |
| **Commit** | `364ed48c` |
| **Podklad** | živá funnel data (7 dní, 673 událostí), [WEB-KNOWLEDGE.md](WEB-KNOWLEDGE.md), operator-context, roadmapy, ověření v kódu |
| **Revize** | 2026-07-29 — ⚠️ opraveny dvě chybné diagnózy, viz banner níže |

> ### ⚠️ Revize 2026-07-29 — čti dřív, než z tohoto dokumentu vyvodíš závěr
>
> 1. **Diagnóza „Stripe webhook není nakonfigurovaný" je vyvrácená.** Dokument vycházel z URL `/api/payment/webhook`, kterou převzal z tehdy chybného WEB-KNOWLEDGE. **Taková cesta v kódu neexistuje** — správně je `POST /webhook/stripe` (`server/index.js:324`) a endpoint na Stripe Dashboardu je nastavený správně (potvrzeno Pavlem). Celá „vrstva 1" tedy stojí na příčině, která se nepotvrdila; skutečný stav doručování webhooků je **neověřený**.
> 2. **„Alerting nepostavený" je taky nepřesné** — kód existuje (`server/services/alerts.js`), chybí jen env proměnná.
> 3. **VAPID je hotové** (2026-07-29), viz vrstva 2.
>
> Čísla funnelu níže jsou ze 7denního okna v červenci 2026 a **od té doby zestárla** — mezitím se změřilo, že konverze paywallu se dramaticky liší podle plochy (dokončený vs. rozdělaný zážitek) a že strop je objem, ne míra konverze. Živá čísla ber z `GET /api/admin/funnel`, ne odsud.

## Rámec: hodnota má dvě strany

- **Value capture** = příjem (uživatel zaplatí za hodnotu, kterou dostal).
- **Value delivery** = užitek pro uživatele (vrací se, cítí, že mu produkt rozumí).

Maximální hodnota není nová funkce — je to **zacelení míst, kde už vytvořená hodnota uniká**. Data ukazují, že appka hodnotu VYTVÁŘÍ (151 first-value momentů/týden), ale ani nezachytává (0 nákupů), ani dlouhodobě nedoručuje (retenční kanály nestřílí). To jsou dvě největší páky — obě bez nové funkce.

## Důkazní báze: kde hodnota reálně uniká (7denní funnel)

```
151 first-value momentů  →  38 uložených výkladů  →  305 zobrazení paywallu
        ↓
 27 spuštěných Stripe checkoutů (auth handoff 94 %, session creation 100 %)
        ↓
  0 dokončených nákupů        ← VŠECHNA hodnota uniká přesně tady
```

- **Horní funnel je zdravý.** 151 lidí dostane osobní výsledek, 305× vidí nabídku premium. Produkt láká a doručuje první hodnotu.
- **Handoff je opravený.** 18 z 19 odešle auth formulář (94 %), všech 27 requestů vytvoří Stripe session (100 %). Práce z 3.–4. 7. zabrala.
- **Poslední krok je mrtvý.** 27 lidí spustí platbu, **0 ji dokončí** (v záznamech). `invoice_paid=1` naznačuje, že aspoň jedna platba prošla záchrannou cestou. Aktivní premium předplatná: **3**.
- ~~**Kořen** (WEB-KNOWLEDGE §8): `payment_events` prázdná → Stripe webhooky nikdy nedorazily.~~ ⚠️ **2026-07-29: tenhle „kořen" se nepotvrdil.** Vycházel ze špatné URL webhooku (viz banner). Endpoint je nakonfigurovaný správně; proč se platby nepropisovaly, **zůstává nezodpovězené** — příště začít delivery logem endpointu, ne domněnkou. Nezávisle na tom platí: předplatné se aktivuje i success-page cestou, jednorázová PDF jistí reconciliation job.

**Interpretace:** appka má lidi, kteří CHTĚJÍ zaplatit (27/týden dojde až na platební stránku), ale nemůžou se úspěšně stát platícími členy. To je zároveň největší únik příjmů I největší selhání user value — člověk zaplatí a nedostane přístup (nebo se bojí zaplatit a odejde). **Průnik obou stran hodnoty je přesně tady.**

---

## Vrstva 1 — ROZBITÝ ZÁCHYT HODNOTY (nejvyšší ROI, žádná nová funkce)

> Peníze už vydělané, ale nevybrané. Kde uživatel projevil ochotu zaplatit, ale transakce nedoběhla.

| Zásah | Uživatelská hodnota | Důkaz | Úsilí | Skóre |
|---|---|---|---|---|
| **Ověřit doručování Stripe webhooků** (⚠️ dřív „zprovoznit" — příčina se nepotvrdila) | Zaplatím → hned dostanu premium. Bez toho platba = frustrace | Endpoint `POST /webhook/stripe` je nakonfigurovaný správně (2026-07-29). Zbývá projít delivery log + `payment_events` — **neověřeno** | Malé (ověření) | **125** |
| **Ověřit doručení jednorázových PDF** (roční horoskop, osobní mapa) | Koupím PDF → přijde mi e-mailem | reconciliation job + PDF guard hotové; guard opraven 2026-07-12 | Malé | **75** |
| **Alert na webhook failures + 4xx/5xx** — ⚠️ *přeformulováno 2026-07-29:* **kód hotový**, chybí jen env | Nepřímá — dřív odhalíme, že se láme placení | `server/services/alerts.js` alertuje `stripe_webhook_failed` i `checkout_session_failed` (`server/payment.js:382`), ale `enabled = Boolean(webhookUrl)` → bez `OPERATIONAL_ALERT_WEBHOOK_URL` v Railway se alert tiše zahodí | Malé (env) | **45** |

**Proč vrstva 1 první:** 27 lidí/týden dojde na platbu. Kdyby jen polovina dokončila při 199 Kč/měs, je to ~2 700 Kč/měsíc nového MRR z traffic, který UŽ máme — nulová akvizice navíc. A hlavně: uživatel, který chce zaplatit a nemůže, je horší než ztracený lead.

**⚠️ Oprava 2026-07-29 — původní diagnóza byla špatná:** tenhle odstavec tvrdil, že root-cause je špatná URL endpointu na Stripe Dashboardu, a uváděl `/api/payment/webhook`. **Ta cesta v kódu neexistuje** — správně je `POST /webhook/stripe` (`server/index.js:324`). Endpoint na Dashboardu je nastavený správně (potvrzeno Pavlem 2026-07-29), takže „webhook není nakonfigurovaný" jako vysvětlení padá. Co z bodu zbývá: projít **delivery log** endpointu a stav `payment_events`. Lokální `.env` = TEST klíč, produkce LIVE (lesson 2026-07-07). Detaily: [WEB-KNOWLEDGE.md §3](WEB-KNOWLEDGE.md).

---

## Vrstva 2 — DORMANTNÍ DORUČENÍ HODNOTY (retence skoro zdarma)

> Hotová infra, co nestřílí. Postaveno, ale neběží → user value i retence leží ladem.

| Zásah | Uživatelská hodnota | Důkaz | Úsilí | Skóre |
|---|---|---|---|---|
| ~~**Push notifikace — nasadit VAPID klíče**~~ ✅ **hotovo 2026-07-29** | „Denní horoskop každé ráno v 8:00" — přesně to, co jsme slíbili v opt-inu | `/api/config` už vrací `vapidPublicKey` a `features.pushNotifications: true`; `/api/health` hlásí `"configured"`. Zbývá dosbírat `push_subscriptions` — publikum startuje od nuly | Hotovo | ~~100~~ |
| **Ověřit, že aktivační lifecycle e-maily reálně chodí** (Day 0/1/3/6) | Po registraci mě produkt vede zpátky k hodnotě | `sendActivationLifecycleSequence` volané z onboarding/complete, ale doručení Resend neověřeno v produkci | Malé | **80** |
| **Weekly digest + newsletter welcome — potvrdit běh** | Pravidelný důvod k návratu | job `weekly-newsletter.js` + `newsletter_welcome` template hotové | Malé | **60** |
| **PWA install prompt na 2.+ návštěvě** | Ikona na ploše = návykový návrat | `js/pwa-install.js` hotové, závisí na consent + 2. návštěvě | Malé | **50** |

**Proč vrstva 2:** retenční kanály jsou postavené, otestované a nasazené v kódu — chybí jen produkční env a potvrzení, že reálně doručují. To je nejlepší poměr hodnota/úsilí v celém produktu: uživatel dostane přesně to, co si opt-inl (denní vedení), a nám to roztočí retenční smyčku, která je předpokladem konverze. Bez ní 151 first-value momentů/týden jednou přijde a odejde.

---

## Vrstva 3 — NOVÁ TVORBA HODNOTY (až po vrstvě 1 a 2)

> Nový užitek, co zároveň monetizuje. Guardrail operator-contextu: nestavět nové funkce, dokud funnel neteče čistě.

Appka má neobvykle silný základ pro tohle — `js/personalization.js`, `saveReading()`, `retention.js`, uložené výklady, `daily_ritual_completed` eventy. **Skutečná premium hodnota není „víc ikonek", ale kontinuita: produkt, který si pamatuje moje výklady a spojuje opakující se témata v čase** (přesně north star: `weekly_ritual_to_paid_intent`).

| Zásah | Uživatelská hodnota | Skóre |
|---|---|---|
| **Návratová smyčka: „minule ti vyšla Věž, dnes…"** — spojit uložené výklady do příběhu | Produkt mi rozumí napříč časem, ne jen jednorázová věštba | **55** |
| **Post-purchase most jednorázový → předplatné** | Kdo koupil PDF, dostane pozvánku do denní opory | **45** |
| **Streak / návykový rituál na profilu** | Vizuální motivace vracet se denně | **40** |

Tyto tři jsou vysoce hodnotné, ale **sekvencovat až po vrstvě 1+2** — bez funkčního placení a retence nemá smysl prohlubovat premium hodnotu, kterou nikdo nemůže koupit ani pravidelně nedostává.

---

## Top 5 zásahů podle skóre (dopad × jistota × proveditelnost)

1. **[125] Ověřit doručování Stripe webhooků** (vrstva 1) — ⚠️ *zadání přeformulováno 2026-07-29:* endpoint **je** nakonfigurovaný správně na `POST /webhook/stripe` (dřív tu stála neexistující cesta `/api/payment/webhook`). Nezbývá „zprovoznit", ale **ověřit**: delivery log endpointu + stav `payment_events`.
2. ~~**[100] Nasadit VAPID klíče do Railway**~~ — **hotovo 2026-07-29**, ověřeno přes `/api/config` (`vapidPublicKey` vyplněn, `features.pushNotifications: true`). Push kanál startuje s prázdným publikem, subscriptions se teprve sbírají.
3. **[80] Ověřit doručení aktivačních lifecycle e-mailů** (vrstva 2) — mostí registraci k hodnotě. Krok: zkontrolovat Resend delivery log + `email_queue` outcomes v produkci.
4. **[75] Ověřit doručení jednorázových PDF** (vrstva 1) — koupené PDF se musí doručit. Krok: testovací nákup na produkci nebo kontrola reconciliation logu.
5. **[55] Návratová smyčka nad uloženými výklady** (vrstva 3) — jádro premium hodnoty. Krok: na profilu zobrazit „poslední výklad + opakující se téma" nad existující `saveReading` daty.

## Co NEstavět teď (a proč)

- **Nové mystické nástroje / funkce** — produkt už má 12+ nástrojů; problém není chybějící funkčnost (shodně profit-growth-roadmap i app-improvement-plan), ale únik hodnoty ve funnelu a retenci.
- **Další programatické SEO clustery** — seo-growth-plan explicitně říká „nepřidávat, dokud Google nestráví 500 nových stránek". Nejdřív číst indexaci v GSC.
- **Placené akvizice** — dokud 27 checkoutů dělá 0 nákupů, každá koruna do akvizice teče do rozbitého trychtýře.

## Jak aktualizovat

Po zprovoznění plateb přeměřit funnel (`npm run analyze:funnel`) — jakmile checkout→purchase začne téct, priorita se posune z vrstvy 1 na vrstvu 2/3. Přepsat skóre podle nových dat.
