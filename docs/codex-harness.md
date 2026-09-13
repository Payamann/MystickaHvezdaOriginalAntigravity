# Codex smyčka pro Mystickou Hvězdu

Tento soubor je lehká projektová varianta principu Manage–Execute–Audit (MEA) z LongHorizon-Harness. Neinstaluje dalšího agenta ani nemění globální nastavení Codexu. Je určená pro práci, která pokračuje přes více kol nebo více dní.

## Trvalý stav

- Původní cíl, obchodní hypotézy a platná rozhodnutí: `.agents/product-marketing-context.md`.
- Technické skutečnosti a postupy konkrétního produktu: odpovídající soubor v `docs/`.
- Aktuální změny: `git diff`, pracovní větev a poslední relevantní commit.
- Ověřený výsledek: skutečný stav souborů, lokálního náhledu, testu, API nebo produkce. Tvrzení z předchozí odpovědi bez současného důkazu se za checkpoint nepočítá.

## Adaptivní volba modelu — preference Pavla, 13. 9. 2026

Cílem je celková kvalita a spotřeba včetně plánování, předávání a kontrol. Toto je pravidlo pro práci agenta, nikoli automatický runtime router nebo nastavení serverového modelu placených výkladů.

- Krátkou odpověď, jeden příkaz nebo drobnou opravu dokonči aktuálním modelem. Další agent by obvykle znamenal zbytečnou režii.
- Ohraničený průzkum souborů, mechanické úpravy a jednoduché kontroly lze delegovat na `gpt-5.6-luna` s úsilím `low` nebo `medium`.
- Běžnou implementaci přes několik souborů lze delegovat na `gpt-5.6-sol` s úsilím `medium`.
- Nejasné příčiny chyb, architekturu, kritické platby, přístupová práva a složité obchodní závěry řeš pomocí `gpt-6-astra`, obvykle s úsilím `medium`; vyšší úsilí jen pro konkrétní obtížný problém. Jde o pracovní rozdělení, ne doloženou úsporu pro každou úlohu.
- Použij jen model dostupný v aktuálním nástroji. Pavel tímto schvaluje pomocné agenty a tyto modelové volby; vždy respektuj případné novější výslovné zadání modelu.
- Deleguj pouze samostatný ohraničený díl, když hlavní agent zároveň má užitečnou práci. Standardně nejvýše jeden pomocník, další jen pro prokazatelně nezávislé rozsáhlejší části. Nespouštěj kopii celé práce a nepředávej celý chat; předej cíl, relevantní soubory, omezení a podmínky přijetí. Pro explicitní model použij krátký fork nebo `fork_turns=none`.
- Po prvním neúspěchu zachovej přesný důkaz a dovol jednu cílenou opravu. Pokud stejný problém přetrvá bez nového poznatku nebo výstup nesplní přijetí, zastav slabšího executora a eskaluj na Sol nebo přímo Astru podle obtížnosti. Chybějící přístup, neplatný klíč, výpadek či nejasné zadání silnější model sám nevyřeší.
- Při předání uchovej ověřený stav, diff, původní selhání a další krok. Dva agenti nesmí souběžně upravovat stejný soubor. Ověř jen relevantní výsledek; neopakuj celou implementaci ani úspěšné testy.
- Aktuální hlavní model nelze samotným textem v AGENTS.md přepnout. Bez dostupného nástroje k přepnutí hlavní konverzace toto neslibuj, neměň globální config za účelem zdánlivého přepnutí a neposílej sám sobě nové úkoly. Model pomocníka lze zvolit při jeho spuštění; eskalace může znamenat převzetí práce již běžící Astrou.
- U skutečné delegace stručně zaznamenej model, úlohu, výsledek ověření a důvod případné eskalace. Číselnou úsporu uváděj jen s odpovídajícími údaji o spotřebě.

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

Oficiální harness je samostatný Python nástroj, který opakovaně spouští Codex CLI v rolích Manager, Executor a Auditor. Tento projektový postup přebírá jeho principy bez instalace dalšího procesu.

## Kontrola plného harnessu — 13. 9. 2026

Aktuální počítač splňuje technické minimum:

- Codex CLI `0.154.0-alpha.6.2` je na `PATH`, spustí se a používá přihlášení přes ChatGPT.
- Python `3.14.2` a Node.js `24.12.0` splňují deklarované minimální verze.
- `lh-harness` `0.1.7` jde podle `pip --dry-run` na tomto Pythonu vyřešit včetně závislostí.
- Projektový `AGENTS.md` má 7,4 kB a vejde se do výchozího limitu instrukcí Codexu 32 KiB.

Plný `lh-harness` zatím neinstaluj ani nespouštěj nad skutečným repozitářem. Ve verzi `0.1.7` Codex adaptér bez výslovně předaného `sandbox_mode` používá `--dangerously-bypass-approvals-and-sandbox`, ale CLI sestavení rolí mu žádný režim nepředává. Stejný builder navíc uvádí, že Codex adaptér nemá ochranu auditora pomocí snapshot guardu. Oddělení rolí je tedy logické a kontextové, ale u Codex backendu není v této verzi vynucené oprávněními operačního systému. Pro bezobslužnou práci na počítači s přístupem k produkci a lokálním tajemstvím je to nepřiměřené riziko.

## Co používáme teď

- Běžné a interaktivní úkoly řeš v Codex Desktopu s touto projektovou MEA smyčkou.
- U práce přes více kol zachovej cíl a ověřené obchodní skutečnosti v `.agents/product-marketing-context.md`; technické checkpointy ukládej do odpovídajícího dokumentu nebo commitu.
- Po každém ohraničeném kroku použij nejmenší nezávislou kontrolu. Tato kontrola je u Mystické Hvězdy důležitější než další vrstva plánování.
- Produkční změny stále odděluj od lokální práce a nasazuj je pouze v rozsahu, který Pavel výslovně zadal.

## Kdy znovu zvážit instalaci

Plný harness má smysl pro několikahodinovou až vícedenní úlohu s jasnými akceptačními podmínkami, která se opakuje přes mnoho samostatných kol. Před pilotem zkontroluj novější vydání a zdrojový kód Codex adaptéru. Manager a Auditor musí být skutečně spuštěni s `read-only` a Executor nejvýše s `workspace-write`; výchozí obcházení sandboxu nesmí zůstat aktivní.

První pilot proveď v čistém jednorázovém git worktree, bez produkčních klíčů, bez GUI pluginu a nejvýše na 6 kol. Vhodná pilotní úloha je kontrola konzistence CTA nebo dokumentace s přesným seznamem stránek a měřitelnými podmínkami přijetí. Teprve podle kvality výsledku, času a spotřeby rozhodni, zda nástroj používat častěji.
