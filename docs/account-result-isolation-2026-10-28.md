# Account result isolation — local checkpoint, 28 October 2026

Working branch: `codex/account-result-isolation`. Source changes are local; no commit, push, deployment or bundle build was performed by the account-isolation helper.

## Scope

- `Auth.saveReading` captures the account and revision, sends the required `expectedUserId`, and discards stale CSRF/response/JSON completions before save events or analytics. Existing two-argument callers use the current account by default.
- `Auth.getProfile` rejects cookie/local-account mismatches and stale responses, including A → B → A transitions.
- Mentor clears previous account chat/input state, waits for history before sending, and ignores stale history/chat completions. The server rejects missing/mismatched owners before quota reservation or message storage. History uses an explicit owner query. Failed persistence retains the completed reply with a warning.
- Numerology clears previous inputs/results/share data on account change, guards delayed profile and interpretation completions, and keeps completed output when profile saving fails.
- No calculation, prompt, price or quota changes. The prior helper removed the unused greeting request and browser-local mentor usage counter; server quota remains authoritative.

## Verified

- Frontend focused Jest: `auth-session-refresh`, `numerology-account-state`, `mentor-account-state`: 3 suites, 23 tests passed (3.628 seconds). Tests cover A → B → A, CSRF waits, response/JSON waits, explicit save owner, profile mismatch and failed save output.
- Server `mentor-gate.test.js`: 8 tests passed (11.151 seconds), mock AI and mock Supabase from standard test setup. Existing quota/concurrency/history-order/generation-failure tests remain green; missing/mismatched chat and history owners return 409 without message persistence.
- Existing API mentor daily-limit fixture: 1 passed, 79 unrelated tests skipped (10.249 seconds).
- Targeted ESLint on the four changed production source files passed. `git diff --check` passed before parent bundle work.
- The initial sandbox server attempt failed with `connect EACCES 127.0.0.1:<ephemeral port>`; the same focused test succeeded outside the sandbox. This was a localhost permission failure, not a product failure.

## Remaining boundary

Parent verification: public bundles rebuilt, unrelated astro-map/relationship bridge output restored, service-worker cache and retained asset history refreshed. Seven targeted numerology browser tests passed on actual built scripts (mock server, Chromium): owner-bound save, save failure, delayed response after account switch, delayed profile, offer and image export (plus existing snippet check). Mentor built-bundle history barrier, history error, stale history, stale reply, failed persistence, account switch during CSRF, server quota and authorization checks all passed.

An initially overbroad browser selection also included unchanged Shamanic Wheel tests. It was stopped after observing existing unrelated SVG/emoji expectations and mentor hero copy mismatch; no claim that the whole nightly suite passes. Numerology's account-switch fixture now populates old cycle values before dispatching auth:changed, allowing the synchronous reset to be tested correctly. No product text was changed for these unrelated failures.

Account fixes remain local pending an explicit release; no real AI requests, payments or customer emails were used by these tests.

The parent owns generated bundles, built-bundle E2E checks and any subsequent release. E2E history route mocks were updated for the owner query and the temporary `MENTOR_TEST_SOURCE` source override was removed. The legacy `tests/mentor.test.js` is outside configured Jest suites and still has obsolete provider mocks; only its request owner fixture was updated.

Commands use `C:/Program Files/nodejs/node.exe --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand` with `--roots tests/frontend` (plus frontend testMatch) or `--roots server/tests` and exact `--runTestsByPath` values, avoiding unnecessary repository traversal.
