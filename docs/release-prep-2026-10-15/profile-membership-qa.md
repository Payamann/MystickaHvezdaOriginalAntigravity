# Profil · členské stavy · 17. října 2026

Navazuje na lokální `7e2fa6ca`. Ověřuje zobrazení členství a dostupnost správných ovládacích prvků. Žádná produkční změna, skutečná platební operace, session Stripe portálu ani e-mail.

## Nalezené a opravené problémy

1. **Faktury po ukončení členství:** server vrací `canManagePayments: true` také bez aktivního předplatného, pokud účet má zákaznické ID Stripe. Klient přesto schovával portál do větve placeného plánu. Portál je nyní dostupný podle serverové capability i u bezplatného/ukončeného účtu; jeho popis je „Platební údaje a faktury“.
2. **Nesouhlas štítků přístupu:** hlavička profilu používala dříve uložený plán a denní panel považoval samotný placený typ plánu za aktivní přístup. Oba štítky nyní čtou stejný aktuální stav. Pozastavený stav říká „Přístup pozastavený“, problém s platbou „Čeká na platbu“ a selhání načtení „Stav není ověřený“. Členský štítek dostane aktivní/trialing/cancel_pending stav. Jde o zobrazení, serverová oprávnění se neměnila.
3. **Texty a bezpečný fallback:** oba zápisy `cancelled` i `canceled` mají český popisek. Neznámý status se nevkládá jako HTML. Neplatné datum se neukazuje jako `Invalid Date`. Zrušení na konci období má budoucí formulaci; odpočet používá „0/5 dnů“ a neopakuje datum ve druhém odstavci.
4. **Obnova po chybě:** neúspěšné okamžité zrušení obnoví původní popis „Zrušit a zastavit další pokusy“. Existující chybový návrat portálu znovu zpřístupní tlačítko s původním textem.
5. **Vzhled trialu:** modrý odpočet a slabě kontrastní modrý štítek nahradilo tlumené zlato v navy panelu. [Finální desktopový snímek](qa-evidence/profile-membership-trial.png).

## Skutečný lokální klient nad modelovými odpověďmi

Soukromý QA server vystavil předem určené payloady se stejnými poli jako `/api/payment/subscription/status`. Všechny ostatní části stránky jsou skutečný klient aplikace. Tyto payloady **nejsou ověřením reálného předplatného nebo webhooku**.

| Modelový stav | Pozorovaný výsledek |
|---|---|
| active | Členský přístup, konec období, zrušení a správa plateb |
| trialing | Členský přístup, 5 dnů a jediné datum konce, zrušení a správa plateb |
| cancel_pending | Přístup do konce období, obnova předplatného a správa plateb |
| paused | Pozastavený přístup, konec pauzy, obnova a správa plateb |
| past_due | Čeká na platbu, aktualizace karty, zastavení dalších pokusů a správa plateb |
| canceled | Bezplatný přístup, české Zrušeno, dostupné faktury |
| ručně přidělený | Členský přístup, vysvětlení samostatného přidělení a platnost, bez Stripe tlačítek |
| free se zákaznickým ID | Bezplatný přístup a dostupné platební údaje/faktury |

Portál v modelu nejprve vrátil HTTP 503: chyba byla viditelná a tlačítko znovu aktivní. Druhý pokus otevřel výslovně označený **lokální modelový portál**. Nebyl vytvořen žádný skutečný Stripe portál. Zrušení/obnova předplatného se v browseru nepotvrzovaly; soukromý model je navíc blokuje. [Záznam pozorovaných textů a hranic](qa-evidence/profile-membership-matrix.json).

## Cílené kontroly

- **29/29 testů**: nová `profile-subscription` (15) a rozšířená `profile-refresh` (14). Skutečný `settings.js` se modelovaným DOM/API, celý dashboard ve VM. Očekávané chyby portálu/načtení/zrušení jsou řízené modelové odpovědi.
- Pokrytí: stavy a přesná sada jejich tlačítek, alias canceled/cancelled, neplatné datum a neznámý status, ruční přístup bez inkasa, chyba/retry, opožděná odpověď minulého účtu, CSRF a credentialed POST do portálu, výchozí a `payment_method_update` flow a obnovení tlačítka po chybě. Devět scénářů potvrzuje, že obě značky přístupu nespoléhají na starý placený plán v cache.
- Pomocník Luna nejdříve doložil neúspěšné regrese původního rendereru a připravil 15 testů. Hlavní agent opravil kód, zpřesnil přesnou sadu tlačítek, doplnil štítky a 9 scénářů, provedl nezávislý běh i browserovou matici. Číselná úspora spotřeby se netvrdí.
- JS build, cílený ESLint, kontrola encodingu změněných souborů a diffu. Cache `mysticka-hvezda-77aa257fccbf`, snapshot **1125** veřejných verzí, SW manifest **5/5**.

## Co stále čeká

PV02 má přijatou lokální klientskou matici. Ověření skutečné testovací Stripe session, změny stavu přes webhook/portál a následné synchronizace zůstává otevřené; tento checkbox se neuzavírá jen podle modelové odpovědi. Původní serverové billing regrese mají samostatné důkazy.

Nová vizuální evidence je desktop 1280 px. Závěrečný mobil/tablet, validní reset hesla PV03, živé AI vzorky a produkční přijetí patří do dalších kroků. Soukromé modelové ovladače nejsou součástí commitu ani vydání.
