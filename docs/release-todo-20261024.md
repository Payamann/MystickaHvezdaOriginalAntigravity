# TODO design release — 24. 10. 2026

User authorized deployment of the TODO design variant. The release branch is
`codex/todo-production-20261024`, based on `origin/main` at
`dd81fbe7e6e797e1a88b38f8d4fe4b2a3840af95`. Original TODO workspace is preserved.

The release applies the actual TODO changes to current main, retaining untouched
main sources and newer safety behavior. The five profile tabs, illustrated atlas
design and shared icon system remain. No force push or database migration is used.

## Integration decisions

- Keep authenticated, consented journal context as untrusted data; preserve
  localized horoscope share previews, sourced lunar phases and mentor quotas.
- Keep durable personal-map fulfillment and provider idempotency. Paid generation
  failures remain failures rather than being fulfilled with generic fallback text.
- Keep the current approved sample PDF and its previews. PDF layout is unchanged;
  newer truthful copy and generation instructions are retained.
- Keep account-bound profile/journal/rune state, tarot result concurrency guards,
  safe share downloads and numerology date validation, alongside TODO visuals.
- Generated content uses the canonical generators and retained data; all generator
  check modes are read-only and compare actual rendered output.
- Retain both main and TODO content-addressed asset histories for open clients.
- Scheduled/manual CI now includes all seven E2E sections, including regression.
- Jest matches real tests in Windows worktrees and ignores only child scratch
  copies, not the worktree's own `.tmp` ancestor.

## Verification evidence

Local logs in the original workspace record the exact candidate checks:
`release-candidate-final-verify-20261024.log`,
`release-candidate-critical-e2e-20261024.log` and targeted repair logs.
Final outcomes and the deployed SHA are recorded in the original workspace's
release-readiness checkpoint after completion, not presumed by this document.

The final integrated candidate passed 89 server suites / 895 tests, 20 frontend
suites / 157 tests, and 22 targeted E2E cases across desktop and mobile. Static
checks, all content generators, site audit and 78 tarot assets passed. The last
`test:verify` step found stale sitemap metadata; regenerating it and repeating
`sitemap:check` confirmed 907 canonical URLs. No unchanged unit suite was rerun
solely to replace that final-step repair with a single wrapper exit code.

The initial automatic E2E server startup timed out without executing cases.
The candidate was then started with the same mock/test environment on explicit
loopback port 3391; both projects passed. This does not exercise production data.

V15 seller identification remains explicitly deferred by the operator. This
technical release is not a legal compliance assessment. No actual customer
payment or repeated production email is part of the automated verification.
