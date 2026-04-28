---
name: railway-deploy-guard
description: Use when deploying Mysticka Hvezda, pushing to Railway, checking whether production deployed, debugging skipped Railway deployments, verifying GitHub checks, or confirming that origin/main reached www.mystickahvezda.cz. This skill enforces the full no-cost deploy verification workflow.
version: 1.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
    - deploy
    - railway
    - github-actions
    - production
---

# Railway Deploy Guard

Goal: never report a deploy as done until the deploy branch, GitHub checks, Railway status, and production smoke checks are all verified.

## Workflow

1. Confirm the deploy branch:
   - Railway watches `Payamann/MystickaHvezdaOriginalAntigravity` on `origin/main`.
   - Do not treat `production/main` or `origin/codex/*` as sufficient for Railway.
2. Commit and push:
   - Push deploy commits with `git push origin HEAD:main`.
   - Keep the working branch synced with `git push origin HEAD:<current-branch>`.
   - Mirror to `production/main` only as a secondary backup.
3. Run the guard:
   - `npm run deploy:guard`
4. Only call the deploy successful when the guard reports `DEPLOY OK`.

## What The Guard Checks

- Local `HEAD` equals `origin/main`.
- Working tree is clean, so local uncommitted changes are not mistaken for deployed code.
- GitHub check runs for the commit are completed and not failing. Intentionally skipped scheduled-only jobs (`E2E (...)`, `Production Smoke Test`) are allowed on normal pushes; any unexpected skipped check is still a failure.
- Railway commit status reaches success.
- `https://www.mystickahvezda.cz/api/health` returns `status: ok`.
- Homepage returns expected HTML.

If GitHub API access needs authentication, set `GITHUB_TOKEN` before running the guard.

## If It Fails

- If GitHub checks fail, fix the check first and push a new commit to `origin/main`.
- If an unexpected check is skipped, treat the deploy as not completed and inspect the skipped check/run conditions.
- If Railway is pending, keep polling until final status.
- If Railway fails, inspect the Railway target URL from the commit status.
- If smoke fails, run `npm run verify:production` for deeper endpoint diagnostics.

## Local Preview

Use this before a push when checking the local server:

```bash
npm run deploy:guard:local
```

The local smoke allows a dirty working tree intentionally; the production guard does not.
