# Skills Metadata Schema

**Version:** 1.0.0
**Last Updated:** March 11, 2026

All skills in `.agents/skills/` should follow this metadata schema in their `SKILL.md` frontmatter.

---

## Required Fields

Every skill MUST have these fields in the YAML frontmatter:

```yaml
---
name: skill-name-in-kebab-case
description: >
  Clear 1-3 sentence description of what the skill does.
  Should explain the primary use case and main benefits.
version: "X.Y.Z"
---
```

### Field Requirements

| Field | Type | Format | Example |
|-------|------|--------|---------|
| `name` | string | kebab-case | `keyword-research` |
| `description` | string | 1-3 sentences | "Research and find high-potential keywords for SEO..." |
| `version` | string | semver | `"1.0.0"` |

---

## Recommended Fields

Strongly recommended for searchability and context:

```yaml
metadata:
  author: author-name
  license: Apache-2.0 OR MIT OR other
  tags:
    - primary-tag
    - secondary-tag
    - tertiary-tag
  triggers:
    - "user phrase that triggers this skill"
    - "another common user request"
  geo-relevance: high  # high, medium, or low
  estimated-duration: "Medium"  # Quick, Medium, Comprehensive
```

### Recommended Field Details

| Field | Type | Options | Purpose | Example |
|-------|------|---------|---------|---------|
| `metadata.author` | string | Name or handle | Track skill ownership | `aaron-he-zhu`, `vercel` |
| `metadata.license` | string | Apache-2.0, MIT, other | Licensing clarity | `Apache-2.0` |
| `metadata.tags` | array | 3-5 tags | Search/categorization | `[seo, keyword-research, research]` |
| `metadata.triggers` | array | 5-10 phrases | User intent matching | `[research keywords, find opportunities]` |
| `metadata.geo-relevance` | enum | high/medium/low | For SEO/marketing skills | `high` (for SEO) |
| `metadata.estimated-duration` | enum | Quick/Medium/Comprehensive | Time expectation | `Medium` |

---

## Optional Fields

For advanced use cases:

```yaml
metadata:
  compatibility: "Claude Code ≥1.0, skills.sh marketplace"
  dependencies:
    - keyword-research
    - competitor-analysis
  related-domains:
    - seo
    - content-strategy
  experimental: false
```

---

## Examples by Skill Type

### Example 1: SEO Research Skill

```yaml
---
name: keyword-research
description: >
  Research and find high-potential keywords for SEO, content strategy,
  and paid advertising. Analyzes search volume, difficulty, intent,
  and trends to identify actionable opportunities.
version: "1.0.0"
license: Apache-2.0
metadata:
  author: aaron-he-zhu
  tags:
    - seo
    - keyword-research
    - research
    - tool-setup
  triggers:
    - "research keywords"
    - "find search opportunities"
    - "keyword analysis"
    - "keyword strategy"
    - "search volume"
  geo-relevance: high
  estimated-duration: Medium
  compatibility: "Claude Code ≥1.0"
---
```

### Example 2: Copywriting Skill

```yaml
---
name: copywriting
description: >
  Write persuasive marketing copy for any page type. Includes frameworks
  for headlines, CTAs, page structure, and voice/tone guidelines.
version: "1.1.0"
metadata:
  author: internal-team
  tags:
    - marketing
    - copywriting
    - conversion
    - content
  triggers:
    - "write marketing copy"
    - "improve this copy"
    - "write landing page"
    - "headline help"
    - "CTA copy"
  geo-relevance: low
  estimated-duration: Medium
---
```

### Example 3: Technical Skill

```yaml
---
name: deploy-to-vercel
description: >
  Deploy applications and websites to Vercel. Supports preview and
  production deployments with automatic git integration.
version: "3.0.0"
license: MIT
metadata:
  author: vercel
  tags:
    - technical
    - deployment
    - vercel
    - next-js
  triggers:
    - "deploy to vercel"
    - "deploy my app"
    - "push live"
  geo-relevance: low
  estimated-duration: Quick
  dependencies:
    - vercel-react-best-practices
---
```

---

## Tag Standardization

Use these standard tags (when applicable). Skills can have 3-5 tags:

### Domain Tags
- `seo` - Search Engine Optimization
- `marketing` - Marketing and growth
- `cro` - Conversion Rate Optimization
- `email` - Email marketing
- `analytics` - Analytics and measurement
- `content` - Content creation and management
- `technical` - Technical/development
- `design` - Design and UX

### Function Tags
- `research` - Research and analysis
- `create` - Content creation
- `optimize` - Optimization
- `strategy` - Strategic planning
- `monitor` - Monitoring and alerts
- `setup` - Initial setup/configuration
- `audit` - Auditing and review

### Skill Tags
- `framework` - Framework or methodology
- `template` - Templates or examples
- `tool-setup` - Setting up tools/integrations
- `analysis` - Deep analysis
- `automation` - Automation
- `best-practices` - Best practices guide

---

## Validation Checklist

Before publishing a skill, verify:

- [ ] **name** — kebab-case, matches directory name
- [ ] **description** — 1-3 sentences, action-oriented
- [ ] **version** — semver format (X.Y.Z)
- [ ] **author** — name or handle provided
- [ ] **license** — specified if proprietary or specific license
- [ ] **tags** — 3-5 relevant tags
- [ ] **triggers** — 5-10 common user phrases
- [ ] **geo-relevance** — set for location-specific skills
- [ ] **estimated-duration** — Quick/Medium/Comprehensive
- [ ] **Related Skills** — section at end of SKILL.md
- [ ] **Examples** — at least 1-2 usage examples in SKILL.md
- [ ] **Structure** — heading hierarchy H1 → H2 → H3

---

## Usage Examples

### Finding skills by tag
```
All skills tagged "seo": [keyword-research, competitor-analysis, serp-analysis, ...]
All "research" skills: [keyword-research, competitor-analysis, content-gap-analysis, ...]
```

### Finding skills by estimated duration
```
Quick skills (< 30 minutes): [rank-tracker, meta-tags-optimizer, ...]
Medium skills (30 min - 2 hours): [seo-audit, copywriting, ...]
Comprehensive (2+ hours): [seo-plan, page-cro, technical-seo-checker, ...]
```

### Finding geo-relevant skills
```
High geo-relevance: [geo-content-optimizer, seo-hreflang, seo-geo, ...]
Medium geo-relevance: [seo-content-writer, ...]
Low geo-relevance: [copywriting, vercel-react-best-practices, ...]
```

---

## Migration Plan

To standardize all existing skills:

1. Audit current metadata across all 70+ skills
2. Update each SKILL.md frontmatter to required fields
3. Add recommended fields (author, tags, triggers)
4. Validate against this schema
5. Update SKILLS_INDEX.md with standardized metadata

---

## Future Enhancements

Planned future additions:

- `metrics` — Key success metrics for skill
- `integrations` — Tools/APIs the skill connects with
- `prerequisites` — Skills that should be done first
- `complexity-level` — Beginner/Intermediate/Advanced
- `update-frequency` — How often skill should be reviewed
- `deprecation-notice` — If skill is deprecated/sunset

