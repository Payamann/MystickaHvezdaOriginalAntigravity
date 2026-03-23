# Mystická Hvězda — Projektové instrukce pro Claude

## ⚠️ POVINNÉ: Automatické logování postů generovaných v chatu

Kdykoli v tomto chatu vygeneruješ Instagram příspěvky pro Mystickou Hvězdu,
**IHNED po jejich napsání** (ještě v téže odpovědi nebo hned po ní) spusť `log_post.py` pro každý post.

### Příkaz pro logování:
```bash
cd "C:\Users\pavel\OneDrive\Desktop\MystickaHvezda\social-media-agent" && set PYTHONIOENCODING=utf-8 && python log_post.py --topic "TÉMA" --type TYP --hook HOOK --intent INTENT --score SKORE --caption "PRVNÍ VĚTA..."
```

### Parametry:
| Parametr | Hodnota |
|---|---|
| `--topic` | Hlavní téma postu (česky, popisně) |
| `--type` | Typ: `educational`, `question`, `tip`, `story`, `quote`, `blog_promo`, `myth_bust`, `carousel_plan` |
| `--hook` | Hook formula: `curiosity_gap`, `contrarian`, `question`, `myth_bust`, `vulnerability`, `pattern_interrupt`, `micro_story`, `milestone`, `fear_reversal`, `celebration` |
| `--intent` | `pure_value`, `soft_promo`, nebo `direct_promo` |
| `--score` | Odhadované QG skóre 1–10 (hook síla + brand voice + hodnota + jazyk + CTA) |
| `--caption` | První věta captionnu (pro tracking) |

### Kdy logovat:
- ✅ Vždy když generuješ 1+ Instagram postů v chatu
- ✅ I při přepisu / úpravách existujících postů
- ✅ I při generování testovacích / ukázkových postů
- ❌ Ne při vysvětlování konceptů nebo přípravě bez finálního textu

### Proč je to důležité:
Bez logování se agent neučí, content memory je prázdná, témata se opakují
a hook efektivita se nesleduje. Paměť je mozek agenta.

---

## 📐 FORMÁT VÝSTUPU — povinný při generování postů v chatu

Kdykoli generuješ 3 denní posty, VŽDY dodržuj tuto strukturu:

### Slot struktura (POVINNÁ)
```
🌅 RÁNO 08:00   → typ: quote / daily_energy / tip      | intent: pure_value  | krátký, lehký
☀️ POLEDNE 12:00 → typ: educational / story / blog_promo | intent: soft_promo  | hloubkový
🌙 VEČER 19:00   → typ: question / challenge             | intent: pure_value  | engagement
```

### Pravidla rozmanitosti témat (POVINNÁ)
- ❌ NIKDY 3 posty o stejném tématu (např. 3× Beran)
- ✅ Každý post musí pokrývat JINÝ tematický okruh:
  - Např.: lunární cyklus + aktuální astro sezóna + synchronicita/numerologie/tarot/krystaly…
- ✅ Min. 1 ze 3 postů = `soft_promo` s přirozeným odkazem na mystickahvezda.cz

### Formát každého postu (POVINNÝ)
```markdown
### 🌅 RÁNO 08:00 — typ | hook_formula | intent | CTA: typ CTA

[caption text — inline, ne code block]

`#mystickaHvezda #dalšíHashtagy`

**🖼️ Image prompt:**
\```
[English image prompt včetně IMPORTANT FORMAT + IMPORTANT FRAMING na konci]
\```
```

### Image prompt — POVINNÉ součásti každého promptu
Každý image prompt MUSÍ končit:
```
IMPORTANT FORMAT: Tall portrait orientation, aspect ratio 4:5 (height significantly greater than width), optimized for Instagram feed post at 1080x1350px.

IMPORTANT FRAMING: The entire illustration must be surrounded by a completely plain, empty, solid dark navy (#050510) border — approximately 20% margin on all four sides. The border is totally empty: no ornaments, no filigree, no stars, no decorations whatsoever. Just flat solid dark color. The illustration floats centered inside this plain empty border. The border bottom-right corner must remain completely blank.
```

### Souhrnná tabulka (POVINNÁ na konci)
```
| Slot | Téma | Typ | Hook | CTA | Intent |
|------|------|-----|------|-----|--------|
| 🌅 08:00 | ... | ... | ... | ... | pure_value |
| ☀️ 12:00 | ... | ... | ... | ... | soft_promo |
| 🌙 19:00 | ... | ... | ... | ... | pure_value |
```

---

## Social Media Agent — rychlý přehled

- **Umístění:** `social-media-agent/`
- **Spuštění:** `python agent.py generate --topic "téma" --type educational`
- **Paměť:** `social-media-agent/output/content_memory.json`
- **Logování chat postů:** `python log_post.py --help`
- **Deploy:** `git push origin main` → Railway automaticky nasadí web

## Jazykové pravidlo
Veškerá komunikace s uživatelem v češtině.
