---
name: astro-engine-regression
description: Use when auditing or changing Mysticka Hvezda astrology features, horoscopes, tarot, angel cards, natal chart, astro map, numerology, runes, crystal ball, past life, shamanic wheel, AI prompt quality, feature routing, or generated interpretation quality.
version: 1.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
    - astrology
    - regression
    - content-quality
    - qa
---

# Astro Engine Regression

Goal: keep mystical features coherent, routed correctly, and high quality after product or prompt changes.

## Feature Map

Core flows:

- Horoscopes: `/horoskopy.html`, `/api/horoscope`.
- Natal chart and astro map: `/natalni-karta.html`, `/astro-mapa.html`.
- Tarot and angel cards: `/tarot.html`, `/andelske-karty.html`.
- Numerology: `/numerologie.html`.
- Runes, crystal ball, past life, shamanic wheel.
- One-time PDF products: annual horoscope and personal map.

## Regression Checks

For each changed feature:

- CTA destination matches the feature, not an unrelated tarot/default page.
- Logged-out users preserve `source` and `feature` params through registration.
- Premium gates name the exact locked feature.
- Generated text answers "what does this mean for me now?".
- Prompts require Czech, tykani, concrete guidance, and valid JSON where expected.
- Fallback content is useful, not generic filler.

## Test Commands

Run targeted tests first:

```bash
npm run test:e2e:tools
npm run test:e2e:content
npm run audit:tarot-assets
```

For backend prompt or PDF changes:

```bash
npm run test:unit:server
```

## Output

Report by feature. For each issue include route, expected behavior, actual behavior, and the smallest safe fix.
