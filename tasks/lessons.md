# Lessons Learned

| Pattern | Correction | Date |
|---------|------------|------|
| `fs/promises.glob` used in build script | Only available Node 22+; CI uses Node 20. Pass glob patterns directly to PurgeCSS which resolves them internally. | 2026-03-17 |
| Health check tests hardcode `.expect(200)` | Without DB (CI env), health returns 503. Always accept `[200, 503]` in tests that don't specifically test DB availability. | 2026-03-17 |
| PurgeCSS rejects Windows absolute paths in `css:` array | Pass CSS via `{ raw: readFileSync(path) }` and normalize all paths with `.replace(/\\/g, '/')`. | 2026-03-17 |
| Worktree tests blocked by `modulePathIgnorePatterns` | Tests written in a worktree can't be run from the main repo via `npm test`. Copy to `server/tests/` before CI simulation. | 2026-03-17 |

## Golden Rules
1. **Never use `var`**: Always use `const` or `let`.
2. **Vanilla First**: No external libraries unless absolutely necessary.
3. **Responsive by Design**: All UI changes must be tested on mobile widths.
4. **Zero Placeholder Policy**: All images and text must be real/generated, never "lorem ipsum".
