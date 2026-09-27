# 🔮 Mystická Hvězda — Social Media Agent

Automatický agent pro správu sociálních sítí. Generuje posty, obrázky a odpovídá na komentáře.

## Technologie
- **GPT-6 Luna přes OpenAI Responses API** — generování textů, captions, odpovědí a AI kontroly kvality (`TEXT_MODEL*` a `TEXT_REASONING_EFFORT` v `config.py`)
- **Imagen 3 přes Gemini API** — generování obrázků
- **Meta Graph API** — publikování a správa komentářů na připojené Facebook stránce

Veškeré textové AI volání v lokálním skriptu používá API model `gpt-6-luna` s výchozím reasoning effort `medium`. Přístup produkčního API klíče k tomuto modelu se ověřuje samostatně přes `python setup.py`.

## Rychlý Start

### 1. Instalace
```bash
cd social-media-agent
python setup.py
```
Setup nakonfiguruje lokální závislosti a potřebné API klíče; textový generátor potřebuje `OPENAI_API_KEY`, obrázkový `GEMINI_API_KEY`.

### 2. Použití

```bash
# Interaktivní generování postu
python agent.py generate

# Automatické generování (bez dotazů)
python agent.py generate --auto

# Promo post pro nejnovější blog článek
python agent.py blog

# Týdenní plán obsahu
python agent.py plan

# Zobrazit všechny uložené posty
python agent.py list

# Odpovědět na komentář
python agent.py reply "Jak si zjistím číslo osudu?"
```

### Comment Bot: bezpečný review režim

```bash
# Výchozí interaktivní review: Enter odešle, s přeskočí, e upraví.
# Timeout návrh neodešle a ponechá jej čekající.
python comment_bot.py

# Pouze výslovná volba automatického odesílání z CLI
python comment_bot.py --auto

# Railway runner je ve výchozím stavu review/non-interactive:
# návrhy uloží jako čekající a nic neodešle.
python railway_runner.py
```

Pro vědomé zapnutí automatického odesílání v Railway nastav obě hodnoty:

```env
COMMENT_BOT_MODE=auto
COMMENT_BOT_AUTO_CONFIRM=SEND_REPLIES_WITHOUT_REVIEW
```

Samotné `COMMENT_BOT_MODE=auto` nestačí. V review režimu se odpověď nikdy neodešle bez explicitního potvrzení v interaktivním terminálu a komentáře se automaticky neskrývají. Návrh, který neprojde kontrolou kvality, se nenabídne k odeslání. Přímé dotazy na AI nebo automatizaci dostanou pravdivou odpověď; agent nesmí tvrdit, že návrh napsal člověk nebo lidský tým.

## Adresářová Struktura

```
social-media-agent/
├── agent.py              # Hlavní CLI agent
├── config.py             # Konfigurace a nastavení
├── blog_reader.py        # Čte blog-index.json
├── post_saver.py         # Ukládá posty + HTML náhledy
├── meta_publisher.py     # Facebook/Instagram publikace přes Meta Graph API
├── setup.py              # Instalační skript
├── generators/
│   ├── text_generator.py # GPT-6 Luna přes OpenAI Responses API - texty
│   └── image_generator.py # Imagen 3 - obrázky
├── output/
│   ├── posts/            # Uložené posty (JSON + HTML náhled)
│   └── images/           # Vygenerované obrázky
└── .env                  # API klíče (neverzovat!)
```

## Workflow

```
1. Generování → 2. Review HTML náhled → 3. Approve → 4. Publikace
```

### Weekly Revenue Content Review

Use this before creating more social/Pinterest assets. It connects content output,
Pinterest inventory, and admin funnel data so the next batch scales the best
measured loop instead of the loudest content idea.

```bash
cd social-media-agent

# 1) Recommended: pull the live Supabase funnel CSV and entitlement audit locally
python codex_social_workflow.py pull-funnel --days 90

# Optional: pull Google Search Console + GA4 data after service-account access is configured
python codex_social_workflow.py pull-google --days 90

# If the report finds premium entitlement drift, review the safe dry-run first
python codex_social_workflow.py entitlement-sync

# 2) Run the review with any manual admin export if needed
python growth_review.py --funnel-csv path/to/admin-funnel-segments.csv

# Optional: run with current local Pinterest/content data only
python growth_review.py

# Recommended Codex wrapper: writes Markdown + JSON into output/codex
python codex_social_workflow.py growth-operator --live-funnel --live-google --days 14 --write
```

Decision rule:
- scale campaigns with checkout starts or purchases first
- fix stale Pinterest schedules before generating more pins
- add `source` + `feature` params when a campaign only has UTMs
- use recorded engagement as a human-reviewed observation; a small sample never sets an automatic content mix
- if the report says the funnel export is empty or legacy, fix measurement before increasing content volume

### Social Content Workflow

Use this flow for the format Pavel actually requests. A brief or draft does not imply three daily posts, Instagram-only output, a promo, or a publishing action.

```bash
cd social-media-agent

# Read memory and create a flexible one-post draft starter
python codex_social_workflow.py daily

# Review one or more finished posts
python codex_social_workflow.py qa --file output/codex/daily_posts_YYYY-MM-DD.md

# Optional private preview
python codex_social_workflow.py preview --file output/codex/daily_posts_YYYY-MM-DD.md

# Optional: prepare a promo pack only when the post is meant to drive traffic
python codex_social_workflow.py traffic-pack --file output/codex/daily_posts_YYYY-MM-DD.md --write

# Optional: create a post-specific visual direction or generate the image
python codex_social_workflow.py codex-image-brief --file output/codex/daily_posts_YYYY-MM-DD.md --write
python codex_social_workflow.py visual-pack --file output/codex/daily_posts_YYYY-MM-DD.md --generate --write

# Facebook stays a dry-run unless publication is explicitly requested
python codex_social_workflow.py facebook-publish --file output/codex/daily_posts_YYYY-MM-DD.md --image output/images/IMAGE.png
# Add --execute only after reviewing the exact caption, image, destination, and comment

# Log only an approved final draft
python codex_social_workflow.py log-draft --file output/codex/daily_posts_YYYY-MM-DD.md
python codex_social_workflow.py weekly --days 14 --write

# After publishing, create a tracker for real posts; fill aggregate Insights values
python codex_social_workflow.py engagement-template --days 90 --output output/codex/facebook-metrics.csv
python codex_social_workflow.py engagement-import --file output/codex/facebook-metrics.csv --dry-run
python codex_social_workflow.py engagement-import --file output/codex/facebook-metrics.csv
```

Notes:
- QA checks Czech voice, slash-form mistakes, optional product links, placeholders, and time-sensitive astrology claims. It does not require a fixed number of posts, promo ratio, hashtag count, CTA, hook mix, or image prompt.
- Facebook publication keeps the written caption. It only places a real Mystická Hvězda link where the draft includes one and the requested placement needs it.
- Visual prompts start from the post itself. Brand colors are available as accents; the same starfield, crystal, centered 3D object, and frame are not added automatically.
- If image services fail, generation stops with an error. A fake template image is not returned as if it were finished creative.
- Traffic and publishing packs are opt-in. The Facebook command remains a dry-run unless --execute is supplied.
- log-draft records only the approved version and remains duplicate-aware.
- Confirmed Facebook publications are linked to Meta post IDs. The metrics CSV stores aggregate reach, impressions, views, reactions, comments, shares, saves, and link clicks with a measurement date and window; rows are deduplicated by post ID, window, and measurement date.
- Metrics are entered from Facebook Insights/export; this workflow does not fetch Insights automatically. Do not add names, profile links, or raw commenter text. Comparable measured results only enter generation prompts after at least three posts in each of two groups with the same platform, placement, and measurement window.
- `weekly` reports medians and sample sizes. Its numbers are descriptive; small or mixed samples do not establish causation or a winning format.
- Use pull-funnel, pull-google, entitlement-sync, and growth-operator only for their separate reporting or data tasks.


### Facebook publikace

Meta API cesta je v kódu připravená. Před prvním ostrým použitím ověř přístup k Facebook stránce přes `python meta_publisher.py`, pak připrav draft, zkontroluj přesný text a spusť `facebook-publish --execute` jen pro schválený obsah. Stav Railway ani platnost přihlašovacích údajů tento lokální workflow nepotvrzuje.

## Draft Metadata

Markdown drafts accept a simple heading such as `### Facebook` or optional metadata such as `### Facebook — educational | pure_value`. Hook and CTA labels, summary tables, and estimated QA scores are not required to review or log one post.

## Témata

tarot • numerologie • astrologie • duchovní rozvoj • meditace • energie a čakry • sny • feng shui • lunární cykly • andělé

## .env Konfigurace

```env
# Texty — GPT-6 Luna s reasoningem medium
OPENAI_API_KEY=your_key_here
TEXT_REASONING_EFFORT=medium
TEXT_MAX_OUTPUT_TOKENS=8192

# Obrázky
GEMINI_API_KEY=your_key_here

# Meta / Facebook / Instagram
META_ACCESS_TOKEN=
META_PAGE_ID=
INSTAGRAM_ACCOUNT_ID=
```
