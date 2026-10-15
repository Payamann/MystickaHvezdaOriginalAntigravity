# Zjednodušení nástrojů a sjednocení účtu — implementace

Checkpoint 15. 10. 2026. **Lokální release kandidát, bez nasazení.** Navazuje na [úplný průzkum](../page-simplification-2026-10-14/README.md), který zůstává historickým záznamem původního stavu. Vizuální [přehled snímků](overview.html).

## Dokončený rozsah této dávky

| Oblast | Změna a ověření |
|---|---|
| Profil P01–P10 | Historie jako výchozí záložka, nastavení a oblíbené nahoře, deník a další přehled ve vlastní záložce. Navy dialogy, sjednocený název členství, popisky nad poli, oddělená změna hesla. |
| Historie a oblíbené | Skutečné serverové stránkování a filtrování; souhrny pro celý účet. Ověřen modelový účet s 63 záznamy: historie přes 20, filtr všech 23 horoskopů a všech 32 počátečních oblíbených. |
| Osobní údaje | Nepovinné datum narození lze uložit i odstranit; čas se validuje. Ověřeno pouze v místní mock databázi. |
| Přístup a platby | Ruční přístup bez Stripe ID neslibuje automatickou obnovu a neukazuje nefunkční platební portál. Neznámá odpověď staršího API se nevydává za potvrzený ruční přístup; chyba nabízí opakování. Žádné změny cen, entitlementů nebo produkčního předplatného. |
| Paměť profilu | Samotný typ automatického výkladu není důkaz osobního vzorce. Podklady vycházejí z vlastních poznámek a zpětné vazby. |
| V01/V07: datované horoskopy | Stará `.stars` vrstva vypnutá pro tuto šablonu, 12 znamení v kompaktním rozbalení. Klávesnice a odkazy ověřené při 390 i 1280 px; místní stav bez uloženého obsahu je výslovně nedostupný. Produkční obsah nebyl znovu generovaný. |
| V02: devět nástrojů | Odstraněné opakované katalogy dalších služeb u tarotu, andělských karet, numerologie, natální karty, partnerské shody, astro-mapy, run, koule a mentora. Formuláře a výsledky zachované. Další nástroje se musí projít v další dávce. |
| V03: patička | Čtyři nativní rozbalovací skupiny, zachované odkazy, kontakt, jazyky a právní informace. Na kontrolovaných mobilech přibližně 674–771 px místo původních 1882–2052 px. |
| V04: blog a atlas | První dávka 12 položek, načítání dalších, filtry nad všemi daty. Blog 74 článků; atlas 78 karet. Fokus po načtení přejde na první novou položku; živý počet odpovídá i změně filtru. Odkaz na Hvězdu mimo první dávku funguje. |
| V05: všech 78 detailů | Méně duplicitních CTA, dobrovolný newsletter v rozbalení, zachované výklady a související karty. 78/78 canonical beze změny, žádné chybějící obrázky/cíle, unikátní ID a zachované newsletter hooky. |
| Generátory | Regenerace blogu/atlasu nevrátí celý dlouhý seznam. Klient atlasu čte generovaný `data/tarot-card-hub.json`, nespravuje druhou kopii 78 textů. Opakované generování detailů bylo beze změn. |
| V06/V14: reference | Nativní rozbalení doplňujícího textu u andělských karet, numerologie, run, bioritmů a čínského horoskopu. U partnerské shody také tři dlouhé rozcestníky a index dvojic. Mobilní shoda nyní 3619 px proti původním 14531 px; všechny odkazy zůstaly. |
| V08–V10 | Osm společných SVG fází Měsíce v lunárním kalendáři a rituálech; navy onboarding, rituální sezení a offline stav. Výpočty fází nebyly změněné. |
| A01–A06/A09 | Čisté přepnutí auth formulářů, odhalený nadpis pod záhlavím, tykání, kratší registrace, obnova bez tokenu nabízí nový odkaz. Členství odlišuje přihlášení/registraci a uvádí z manifestu 199 Kč/měsíc. České síťové/JSON fallback chyby. |
| V12: exporty | Navy/malovaná plocha sdíleného canvasu a tarotu ano/ne. Skutečné PNG 1080×1350 z obou rendererů zkontrolované; dlouhá otázka má výpustku, spodní text je uvnitř rámu. U čínského exportu opravené přetékání roků. |

## Co kontrola skutečně zahrnovala

- Syntetický lokální účet nad skutečnou aplikací s `MOCK_SUPABASE`, `MOCK_AI` a vypnutými úlohami. Screenshoty nesou smyšlený účet. Soukromé podklady z dřívějšího čtení vlastníkových dat nejsou v tomto adresáři.
- Uložení a vymazání data narození, validace času, stránkování, filtry, oblíbené, přepínání záložek, modal a Escape. Cizí záznam vrací 404, nepřihlášený přístup 401. Nebyla měněná skutečná hesla, členství ani objednávky.
- Existující cílené testy: auth 28, billing-state 14, user-readings 7, service-worker 5 — celkem 54 různých úspěšných kontrol. Opakované běhy se nepočítají navíc. ESLint upravených JS/server souborů, hooky, 45 auth kontextů, statické huby, validace cache a `git diff --check` prošly.
- [Mobilní měření devíti nástrojů před posledním sbalením referencí](browser-checks.json), [následná kontrola rozbalení pěti referenčních bloků](reference-checks.json). Nejde o nové ruční projetí všech 917 URL ani všech chráněných výsledků.
- Exporty byly zachycené z reálného canvas rendereru v soukromém lokálním náhledu, který místo nativního sdílení zobrazil PNG ve stránce. Ověřuje rozměry, písmo a rozvržení; nepotvrzuje systémový share dialog nebo stažení na každém zařízení. Běžné čekání na download v IAB skončilo timeoutem. Čínský export stále názorně ukazuje zbývající barevné emoji.

## Další pořadí práce

**Doplnění z navazující kontroly profilu:** [PF01–PF12 a potřebná ověření PV01–PV04](../page-simplification-2026-10-14/profile-followup-todo.md). Jde o zbývající návaznosti po implementaci P01–P10, ne o opakování původních opravených bodů.

1. **Výsledkové texty a důvěra:** projít celý slovník tarotu ano/ne a čínského horoskopu. Zachycené příklady: Desítka mečů automaticky tvrdí definitivní konec situace; čínský Drak doporučuje „velké investice“. V této dávce byl opraven konkrétní přehnaný text Královny pohárů, nikoliv celý slovník. Totéž platí pro nepodložená tvrzení v bioritmech a starších blogových perexech.
2. **V11 a zbývající V02/V14:** runtime emoji a přebytečné rozcestníky na dalších nástrojích; referenční bloky a FAQ aury/denního tarotu. Krátká užitečná vysvětlení nesbalovat automaticky.
3. **A07/A08:** aktivní starší auth modal a trvalé potvrzení skutečně úspěšného resetu. Reálný recovery e-mail, přihlášení a Stripe sandbox cesta vyžadují vlastní cílené ověření.
4. **V13:** všech 13 SK/PL souborů sjednotit se zachováním překladů a hreflang.
5. **Lunární logika:** dvě existující stránky mají rozdílné referenční okamžiky pro výpočet fáze. Vizuální sjednocení to neopravuje a není potvrzením astronomické přesnosti.

## Stav vydání

Implementace je v izolovaném kandidátu `.codex-tmp/release-20261012`, větev `codex/organic-growth-20261013`. Hlavní pracovní checkout s dalšími rozpracovanými změnami nebyl hromadně přepsaný. **Bez push, deploye, migrace a produkčních zápisů.** Tato dávka není potvrzení, že je hotové celé funkční review webu.
