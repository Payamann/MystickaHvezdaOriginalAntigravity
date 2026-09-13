---
name: railway-deploy-guard
description: Use for Mysticka Hvezda Railway deployment, failed releases or read-only production status checks.
  Distinguishes checking what is live from authorization to push, deploy, change flags or migrate production.
metadata:
  author: internal-team
  license: Internal
  tags:
  - deploy
  - railway
  - github-actions
  - production
  version: 1.1.0
---

# Railway Deploy Guard

## Nejdříve rozliš úkol

- **Kontrola stavu:** „Je to v produkci?“ znamená zjistit verzi a dostupnost. Sama neopravňuje k pushi, redeployi, migraci ani zapnutí produktu.
- **Lokální práce:** dokonči návrh a potřebné ověření. Existující zákaz nasazení z [kontextu](../../product-marketing-context.md) platí, dokud jej uživatel výslovně nezmění; „pokračuj“ jej neruší.
- **Autorizované nasazení:** existující souhlas respektuj, neptej se znovu bez konkrétního důvodu. Nasaď pouze zamýšlené změny, zachovej cizí a rozpracovanou práci.

## Kontrola produkčního stavu

Railway je podle konfigurace projektu navázaný na `Payamann/MystickaHvezdaOriginalAntigravity`, větev `origin/main`. Před závěrem ověř aktuální nastavení; `production/main` a `origin/codex/*` samy nedokazují nasazení.

Zjisti požadovaný commit, aktuální vzdálenou větev, GitHub checks a Railway deployment. Ověř `/api/health` a relevantní veřejnou stránku. Rozpracovaná pracovní kopie může být novější než produkce; necommituj ji jen kvůli kontrole a nevydávej její nečistotu za výpadek webu.

`npm run deploy:guard` porovnává lokální HEAD s `origin/main` a standardně vyžaduje čistou pracovní kopii. Pro pouhý stav s odlišnou lokální verzí ověř konkrétní vzdálený SHA a runtime samostatně. Dostupný je `npm run verify:production:commit -- --sha <skutečný-commit> --skip-astro`; před spuštěním zkontroluj rozsah skriptu. Výsledky vždy popiš jako kontrolu dané verze, ne jako nově provedený deploy.

## Autorizované nasazení

1. Prohlédni diff a stav větve. Ověř relevantní změny podle rizika a splň aktuálně vyžadované release/CI kontroly. Neopakuj dříve úspěšnou lokální sadu bez změny jejích vstupů; povinné kontroly neoslabuj.
2. Připrav commit jen s určeným rozsahem. Před pushem ověř, že `origin/main` nepokročil, a případný konflikt vyřeš bez force push.
3. Pro tuto konfiguraci se nasazuje přes `git push origin HEAD:main`. Záložní remote ani další větve nemusíš synchronizovat, pokud to úkol nevyžaduje.
4. Spusť `npm run deploy:guard`. Úspěšné dokončení hlásí až `[deploy-guard] DEPLOY OK`: správný commit, GitHub checks, Railway success a runtime smoke.
5. Zkontroluj konkrétní nasazovaný veřejný vstup nebo dostupnost produktu; homepage sama nepotvrzuje novou funkci. Neprováděj skutečný nákup jako automatickou součást ověření.

Záměrně přeskočené plánované E2E a Production Smoke Test mohou být podle aktuální CI konfigurace přípustné; neočekávané přeskočení či selhání vyšetři. Při pending stavu použij čekání s postupným odstupem, ne časté stejné dotazy. Opravu pokračující v již schváleném rozsahu dokonči; chybějící externí přístup či nové zásadní rozhodnutí popiš konkrétně. Nikdy neoznač neověřený deploy za hotový.

## Lokální náhled

Nejprve zjisti existující server a port. `deploy:guard:local` má nyní napevno port 3001; pro jiný port použij skutečnou adresu přes `node scripts/deploy-guard.mjs --skip-remote --skip-railway --allow-dirty --base-url=http://localhost:PORT`. Jde o širší lokální smoke, nikoli povinný krok pro barvu nebo text. Lokální náhled nepotvrzuje produkční stav.
