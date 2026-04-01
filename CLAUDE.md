# Mystická Hvězda — Claude Social Media Agent

## KROK 1 — Přečti paměť (povinné před generováním)

```bash
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent" && python -c "
import json
m = json.load(open('output/content_memory.json', encoding='utf-8'))
for p in m.get('approved_posts', [])[-15:]: print(f\"[{p.get('date','?')}] {p.get('type','?')} | {p.get('hook_formula','?')} | {p.get('topic','?')}\")
for h,s in sorted(m.get('hook_performance',{}).items(), key=lambda x: -x[1].get('avg_score',0))[:5]: print(f\"{h}: {s.get('avg_score',0):.1f}\")
"
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
| Šamanské kolo | /shamanske-kolo.html |
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

```bash
cd "C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/social-media-agent" && set PYTHONIOENCODING=utf-8 && python log_post.py --topic "TÉMA" --type TYP --hook HOOK --intent INTENT --score SKORE --caption "PRVNÍ VĚTA"
```

`--type`: educational / question / tip / story / quote / blog_promo / myth_bust / carousel_plan
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
