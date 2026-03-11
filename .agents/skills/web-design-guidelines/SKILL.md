---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked
  to "review my UI", "check accessibility", "audit design", "review UX", or "check
  my site against best practices".
version: 1.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
  - design
  - ux
  - best-practices
  triggers:
  - web design
  - design guidelines
  - ux principles
  estimated-duration: Medium
  geo-relevance: low
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

## Related Skills

- [page-cro](../page-cro/) — Optimize conversion rates through design and UX testing
- [onboarding-cro](../onboarding-cro/) — Improve onboarding experience and conversion rates
