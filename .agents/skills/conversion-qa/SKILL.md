---
name: conversion-qa
description: Use when checking Mysticka Hvezda conversion flows, homepage clicks, signup, onboarding, pricing, checkout, paywalls, premium gates, or whether CTAs route to the right page. This skill focuses on practical no-cost QA with browser checks and existing tests.
version: 1.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
    - cro
    - qa
    - checkout
    - onboarding
---

# Conversion QA

Goal: catch broken CTAs, confusing routes, trust leaks, and checkout friction before production users hit them.

## Required Coverage

Check desktop and mobile where practical:

- Homepage hero CTA, header login/register, daily angel card links.
- Homepage trust sections, pricing preview, final CTA.
- `prihlaseni.html` register and login modes with source/feature context.
- `onboarding.html` step progression, save/skip behavior, next destination.
- `cenik.html` plan selection, Stripe checkout creation, logged-out redirects.
- Premium gates in tarot, numerology, runes, crystal ball, past life.

## Verification Commands

Use the smallest relevant section first:

```bash
npm run test:e2e:core
npm run test:e2e:checkout
npm run test:e2e:api
```

Before deploy:

```bash
npm run test:verify
```

## Browser Checks

Use the in-app browser or Playwright screenshots when UI changed. Look for:

- CTA text matching the destination.
- No card-in-card clutter.
- No overlapping text on mobile.
- No misleading "free" copy before a paid step.
- Registration context preserved in URL query params.

## Output

Report:

- Broken or confusing routes first.
- Conversion risks second.
- Visual polish issues third.
- Exact files changed and tests run.
