# Codex smyčka pro Mystickou Hvězdu

Tento soubor je lehká projektová varianta principu Manage–Execute–Audit (MEA) z LongHorizon-Harness. Neinstaluje dalšího agenta ani nemění globální nastavení Codexu. Je určená pro práci, která pokračuje přes více kol nebo více dní.

## Trvalý stav

- Původní cíl, obchodní hypotézy a platná rozhodnutí: `.agents/product-marketing-context.md`.
- Technické skutečnosti a postupy konkrétního produktu: odpovídající soubor v `docs/`.
- Aktuální změny: `git diff`, pracovní větev a poslední relevantní commit.
- Ověřený výsledek: skutečný stav souborů, lokálního náhledu, testu, API nebo produkce. Tvrzení z předchozí odpovědi bez současného důkazu se za checkpoint nepočítá.

## MEA kolo

1. **Manager — obnov stav.** Přečti produktový kontext a relevantní technický dokument. Napiš si stručně cíl, hotové ověřené body, zbývající body a jediný další krok. Neobnovuj celý historický chat, pokud to není potřeba.
2. **Executor — proveď jeden krok.** Změnu ohranič konkrétním souborem, stránkou nebo testem. Nemíchej redesign, SEO strategii, infrastrukturu a nasazení do jedné neurčité dávky. Při delší práci nejdřív dokonči nejmenší bezpečný díl.
3. **Auditor — ověř prostředí.** Zkontroluj diff, skutečný výstup a nejmenší relevantní test nebo náhled. Auditor nesmí pouze zopakovat tvrzení executoru. U produkce ověř konkrétní commit a cílový endpoint; lokální náhled není produkce.
4. **Checkpoint — zachovej stav.** Po smysluplném dokončeném kroku aktualizuj příslušný dokument nebo commit. Zapiš, co je ověřeno, co selhalo, jaký důkaz to ukazuje a co má následovat. Nedokončenou práci nepřepisuj jako hotovou.

## Pravidla proti ztrátě kontextu

- Dlouhý seznam možných nápadů není plán. Vždy existuje jedna hlavní priorita a nejbližší ověřitelný krok.
- Velký kontext nepřidává automaticky přesnost. Načti pouze relevantní skill, stránku, test a dokument; ostatní shrň nebo odlož.
- Při opravě chyby nejdřív zachovej přesné selhání, potom proveď nejmenší opravu a zopakuj původní kontrolu. Nezakládej nový test jen proto, aby zakryl změněné očekávání.
- Po změně požadujícího nasazení odděl kontrolu CI, Railway a veřejného endpointu. `DEPLOY OK` je důkaz konkrétního vydání, nikoli obecné tvrzení, že web funguje.
- Když je potřeba nový uživatelský nebo produkční krok, uveď ho jako blocker. Neprováděj skutečnou platbu, nezveřejňuj osobní data a neměň produkci mimo výslovně schválený rozsah.

## Kde je skutečný LongHorizon-Harness

Oficiální harness je samostatný Python nástroj pro Codex CLI s Managerem, Executor a read-only Auditorem. Na Windows je podle jeho dokumentace zahrnutý, ale zatím méně ověřený. Tento projektový postup přebírá jeho principy bez instalace dalšího procesu; instalace `lh-harness`, pluginu pro computer-use nebo dashboardu má smysl až pro opakované dlouhé CLI/GUI úkoly a vyžaduje samostatné rozhodnutí.
