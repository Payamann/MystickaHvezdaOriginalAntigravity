# Mystická Hvězda — práce na projektu

Produktový směr, doložená data, značka a aktuální omezení jsou v [.agents/product-marketing-context.md](.agents/product-marketing-context.md). Při práci na produktu nebo marketingu si kontext načti jednou; znovu jej nevyžaduj od Pavla. Cílem je užitečná placená služba a fungující cesta k jejímu doručení.

## Volba postupu

- Načti skill podle skutečné úlohy, další jen pokud řeší konkrétní závislost. Katalog a návody celé knihovny nejsou povinná četba.
- Nabídka a cesta z návštěvy k nákupu: `page-cro`. Vzhled a přístupnost: `web-design-guidelines`. Ověření změněné cesty: `conversion-qa`.
- Výpočty, losování a generované výklady: `astro-engine-regression`. Tvrzení, reference a očekávání zákazníka: `trust-audit`. Měření: `analytics-tracking`.
- Produkční stav nebo nasazení: `railway-deploy-guard`; rozlišuj kontrolu a požadavek na změnu produkce. Kontext zachovává aktuální rozhodnutí o nasazování.
- U drobné úpravy ověř jen zasažené chování. Celé sady testů, opakované audity ani nové testy pro samotné barvy/texty nejsou výchozí postup. Povinné CI kontroly a ověření změn plateb či přístupových práv zůstávají zachované.
- Pro předání stručně uveď výsledek, rozsah ověření a zda jde o lokální nebo produkční stav. Samotná úspěšná technická zkouška nedokazuje obchodní úspěch.

## Smyčka pro delší úkoly

Pavel schválil adaptivní volbu modelů a delegování na pomocné agenty pro úsporu při zachování kvality. Při vhodné samostatné části práce použij levnějšího pomocného agenta podle pravidel v `docs/codex-harness.md`, pokud současně pokračuje užitečná práce hlavního agenta. Krátké odpovědi nedeleguj jen kvůli změně modelu. Při skutečném selhání uvažování eskaluj; nepředstírej přepnutí modelu hlavní konverzace.

U práce přes více kol postupuj podle [projektové smyčky](docs/codex-harness.md): nejprve obnov cíl a poslední ověřený stav, vyber jeden ohraničený krok, proveď jej, potom výsledek ověř nezávisle v souborech, prohlížeči nebo testu a ulož checkpoint. Do ověřeného stavu patří jen fakta potvrzená prostředím. Selhání zapisuj jako důkaz s přesným místem a další krok; neoznačuj úkol za hotový podle vlastního předpokladu.

# Mystická Hvězda — Codex Social Media Agent

Následující postup platí pouze při tvorbě příspěvků pro sociální sítě. Při úpravách webu, opravách, analýze produktu nebo údržbě skills nespouštěj sociální brief ani logování příspěvků.

## KROK 1 — Přečti paměť (povinné před generováním)

```powershell
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent"; $env:PYTHONIOENCODING='utf-8'; python codex_social_workflow.py brief
```

Z výsledku: vyhni se tématům posledních 7 dní, preferuj top hooky, netlač promo 2× za sebou.

---

## Web funkce (jen toto propaguj v soft_promo)

| Funkce | URL |
|--------|-----|
| Natální karta | /natalni-karta.html |
| Horoskopy | /horoskopy.html |
| Tarot | /tarot.html |
| Partnerská shoda | /partnerska-shoda.html |
| Numerologie | /numerologie.html |
| Lunární kalendář | /lunace.html |
| Runy | /runy.html |
| Andělské karty | /andelske-karty.html |
| Šamanské kolo | /shamansko-kolo.html |
| Hvězdný průvodce | /mentor.html |
| Křišťálová koule | /kristalova-koule.html |
| Minulý život | /minuly-zivot.html |

Odkaz musí logicky navazovat na téma postu. Nikdy nepropaguj to, co na webu nemáme.

---

## KROK 2 — Slot struktura

| Slot | Typy | Intent | Tón |
|------|------|--------|-----|
| 🌅 08:00 | quote / tip / daily_energy | pure_value | krátký, motivační |
| ☀️ 12:00 | educational / story / blog_promo | soft_promo | hloubkový |
| 🌙 19:00 | question / challenge / myth_bust | pure_value | engagement |

Pravidla: 3 různá témata, min. 1 soft_promo, relevantní k aktuálnímu datu/astro sezóně.

---

## KROK 3 — Brand voice

- Tykáme, 2. os. j.č.
- Žádné lomené tvary (šel/šla)
- Mikropříběhy: přítomný čas, 2. os. — "Jdeš ulicí. Vidíš 11:11." (min. 1 ze 3)
- Dokonavá slovesa ve 2. os. přítomného znějí divně — přeformulovat
- Astro kontext = funkční: vždy odpověz "Co to pro mě dnes konkrétně znamená?"
- `#mystickaHvezda` jako první hashtag, celkem 4–6

**CTA — střídej, nikdy 2× stejný v sérii:**
otázka do komentáře / save trigger / share / A-B volba / screenshot / ticho / web odkaz

**Hooky — v sérii 3 musí být:**
1 poetický/tichý + 1 ostrý/překvapivý + 1 provokativní/přímý

---

## KROK 4 — Image prompt šablona

```
[3D objekt], [materiál a světlo], [rytiny/symboly], [nebula/stardust],
deep navy cosmic starfield background (#050510), premium 3D CGI render,
icon-art style, NO text NO people NO cards NO frames NO borders, portrait 4:5.
Aspect ratio 4:5, 1080x1350px. Plain solid #050510 border ~20% margin all sides,
no decorations in border. Object floats centered inside.
```

---

## KROK 5 — Zaloguj po generování

Preferuj batch logování z markdown draftu:

```powershell
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent"; $env:PYTHONIOENCODING='utf-8'; python codex_social_workflow.py qa --file "output/codex/daily_posts_YYYY-MM-DD.md"
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent"; $env:PYTHONIOENCODING='utf-8'; python codex_social_workflow.py traffic-pack --file "output/codex/daily_posts_YYYY-MM-DD.md" --write
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent"; $env:PYTHONIOENCODING='utf-8'; python codex_social_workflow.py visual-pack --file "output/codex/daily_posts_YYYY-MM-DD.md" --write
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent"; $env:PYTHONIOENCODING='utf-8'; python codex_social_workflow.py codex-image-brief --file "output/codex/daily_posts_YYYY-MM-DD.md" --write
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent"; $env:PYTHONIOENCODING='utf-8'; python codex_social_workflow.py log-draft --file "output/codex/daily_posts_YYYY-MM-DD.md" --score 8.0
```

Traffic pack je povinný u každé série se soft_promo: vytvoří UTM URL, Story CTA a Facebook link post. Reel pořád primárně buduje dosah; web CTA formuluj jako „vlastní odpověď / vlastní výklad“, ne jako tvrdou reklamu.

Visual pack standardně připraví jen 1 grafiku pro traffic cíl. Pokud má obrázek generovat přímo Codex, použij `codex-image-brief` a jeden vybraný traffic prompt. Lokální generování PNG spouštěj jen když je draft schválený:

```powershell
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent"; $env:PYTHONIOENCODING='utf-8'; python codex_social_workflow.py visual-pack --file "output/codex/daily_posts_YYYY-MM-DD.md" --generate --write
```

Fallback pro ruční log jednoho postu:

```powershell
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent"; $env:PYTHONIOENCODING='utf-8'; python log_post.py --topic "TÉMA" --type TYP --hook HOOK --intent INTENT --score SKORE --caption "PRVNÍ VĚTA"
```

`--type`: educational / question / tip / story / quote / blog_promo / myth_bust / carousel_plan / daily_energy / challenge
`--hook`: curiosity_gap / contrarian / question / myth_bust / vulnerability / pattern_interrupt / micro_story / milestone / fear_reversal / celebration
`--intent`: pure_value / soft_promo / direct_promo

---

## Výstupní formát

```
### 🌅 RÁNO 08:00 — typ | hook | intent | CTA: typ
[caption]
`#mystickaHvezda #tag2 #tag3`
**🖼️ Image prompt:** ```[prompt]```
```

Souhrnná tabulka na konci: Slot | Téma | Typ | Hook | CTA | Intent
