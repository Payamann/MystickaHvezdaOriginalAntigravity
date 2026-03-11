---
name: on-page-seo-auditor
description: This skill should be used when the user asks to "audit page SEO", "on-page
  SEO check", "SEO score", "page optimization", "what SEO issues does this page have",
  "what is wrong with this page SEO", "score my page", or "why is this page not ranking".
  Performs comprehensive on-page SEO audits to identify optimization opportunities
  including title tags, meta descriptions, headers, content quality, internal linking,
  and image optimization. For server, speed, and crawl issues, see technical-seo-checker.
  For full EEAT content quality scoring, see content-quality-auditor.
version: 3.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
  - seo
  - audit
  - technical
  triggers:
  - on-page seo
  - on page audit
  - page seo
  - seo audit
  estimated-duration: Medium
  geo-relevance: high
---

# On-Page SEO Auditor


> **[SEO & GEO Skills Library](https://skills.sh/aaron-he-zhu/seo-geo-claude-skills)** · 20 skills for SEO + GEO · Install all: `npx skills add aaron-he-zhu/seo-geo-claude-skills`

<details>
<summary>Browse all 20 skills</summary>

**Research** · [keyword-research](../../research/keyword-research/) · [competitor-analysis](../../research/competitor-analysis/) · [serp-analysis](../../research/serp-analysis/) · [content-gap-analysis](../../research/content-gap-analysis/)

**Build** · [seo-content-writer](../../build/seo-content-writer/) · [geo-content-optimizer](../../build/geo-content-optimizer/) · [meta-tags-optimizer](../../build/meta-tags-optimizer/) · [schema-markup-generator](../../build/schema-markup-generator/)

**Optimize** · **on-page-seo-auditor** · [technical-seo-checker](../technical-seo-checker/) · [internal-linking-optimizer](../internal-linking-optimizer/) · [content-refresher](../content-refresher/)

**Monitor** · [rank-tracker](../../monitor/rank-tracker/) · [backlink-analyzer](../../monitor/backlink-analyzer/) · [performance-reporter](../../monitor/performance-reporter/) · [alert-manager](../../monitor/alert-manager/)

**Cross-cutting** · [content-quality-auditor](../../cross-cutting/content-quality-auditor/) · [domain-authority-auditor](../../cross-cutting/domain-authority-auditor/) · [entity-optimizer](../../cross-cutting/entity-optimizer/) · [memory-management](../../cross-cutting/memory-management/)

</details>

This skill performs detailed on-page SEO audits to identify issues and optimization opportunities. It analyzes all on-page elements that affect search rankings and provides actionable recommendations.

## When to Use This Skill

- Auditing pages before or after publishing
- Identifying why a page isn't ranking well
- Optimizing existing content for better performance
- Creating pre-publish SEO checklists
- Comparing your on-page SEO to competitors
- Systematic site-wide SEO improvements
- Training team members on SEO best practices

## What This Skill Does

1. **Title Tag Analysis**: Evaluates title optimization and CTR potential
2. **Meta Description Review**: Checks description quality and length
3. **Header Structure Audit**: Analyzes H1-H6 hierarchy
4. **Content Quality Assessment**: Reviews content depth and optimization
5. **Keyword Usage Analysis**: Checks keyword placement and density
6. **Internal Link Review**: Evaluates internal linking structure
7. **Image Optimization Check**: Audits alt text and file optimization
8. **Technical On-Page Review**: Checks URL, canonical, and mobile factors

## How to Use

### Audit a Single Page

```
Audit the on-page SEO of [URL]
```

```
Check SEO issues on this page targeting [keyword]: [URL/content]
```

### Compare Against Competitors

```
Compare on-page SEO of [your URL] vs [competitor URL] for [keyword]
```

### Audit Content Before Publishing

```
Pre-publish SEO audit for this content targeting [keyword]: [content]
```

## Data Sources

> See [CONNECTORS.md](../../CONNECTORS.md) for tool category placeholders.

**With ~~SEO tool + ~~web crawler connected:**
Claude can automatically pull page HTML via ~~web crawler, fetch keyword search volume and difficulty from ~~SEO tool, retrieve click-through rate data from ~~search console, and download competitor pages for comparison. This enables fully automated audits with live data.

**With manual data only:**
Ask the user to provide:
1. Page URL or complete HTML content
2. Target primary and secondary keywords
3. Competitor page URLs for comparison (optional)

Proceed with the full audit using provided data. Note in the output which findings are from automated crawl vs. manual review.

## Instructions

When a user requests an on-page SEO audit:

1. **Gather Page Information**

   ```markdown
   ### Audit Setup
   
   **Page URL**: [URL]
   **Target Keyword**: [primary keyword]
   **Secondary Keywords**: [additional keywords]
   **Page Type**: [blog/product/landing/service]
   **Business Goal**: [traffic/conversions/authority]
   ```

2. **Audit Title Tag**

   ```markdown
   ## Title Tag Analysis
   
   **Current Title**: [title]
   **Character Count**: [X] characters
   
   | Criterion | Status | Notes |
   |-----------|--------|-------|
   | Length (50-60 chars) | ✅/⚠️/❌ | [notes] |
   | Keyword included | ✅/⚠️/❌ | Position: [front/middle/end] |
   | Keyword at front | ✅/⚠️/❌ | [notes] |
   | Unique across site | ✅/⚠️/❌ | [notes] |
   | Compelling/clickable | ✅/⚠️/❌ | [notes] |
   | Matches intent | ✅/⚠️/❌ | [notes] |
   
   **Title Score**: [X]/10
   
   **Issues Found**:
   - [Issue 1]
   - [Issue 2]
   
   **Recommended Title**:
   "[Optimized title suggestion]"
   
   **Why**: [Explanation of improvements]
   ```

3. **Audit Meta Description**

   ```markdown
   ## Meta Description Analysis
   
   **Current Description**: [description]
   **Character Count**: [X] characters
   
   | Criterion | Status | Notes |
   |-----------|--------|-------|
   | Length (150-160 chars) | ✅/⚠️/❌ | [notes] |
   | Keyword included | ✅/⚠️/❌ | [notes] |
   | Call-to-action present | ✅/⚠️/❌ | [notes] |
   | Unique across site | ✅/⚠️/❌ | [notes] |
   | Accurately describes page | ✅/⚠️/❌ | [notes] |
   | Compelling copy | ✅/⚠️/❌ | [notes] |
   
   **Description Score**: [X]/10
   
   **Issues Found**:
   - [Issue 1]
   
   **Recommended Description**:
   "[Optimized description suggestion]" ([X] chars)
   ```

4. **Audit Header Structure**

   ```markdown
   ## Header Structure Analysis
   
   ### Current Header Hierarchy
   
   ```
   H1: [H1 text]
     H2: [H2 text]
       H3: [H3 text]
       H3: [H3 text]
     H2: [H2 text]
       H3: [H3 text]
     H2: [H2 text]
   ```
   
   | Criterion | Status | Notes |
   |-----------|--------|-------|
   | Single H1 | ✅/⚠️/❌ | Found: [X] H1s |
   | H1 includes keyword | ✅/⚠️/❌ | [notes] |
   | Logical hierarchy | ✅/⚠️/❌ | [notes] |
   | H2s include keywords | ✅/⚠️/❌ | [X]/[Y] contain keywords |
   | No skipped levels | ✅/⚠️/❌ | [notes] |
   | Descriptive headers | ✅/⚠️/❌ | [notes] |
   
   **Header Score**: [X]/10
   
   **Issues Found**:
   - [Issue 1]
   - [Issue 2]
   
   **Recommended Changes**:
   - H1: [suggestion]
   - H2s: [suggestions]
   ```

5. **Audit Content Quality** — Word count, reading level, comprehensiveness, formatting, E-E-A-T signals, content elements checklist, gap identification

   > **Reference**: See [references/audit-templates.md](./references/audit-templates.md) for the content quality template (Step 5).

6. **Audit Keyword Usage** — Primary/secondary keyword placement across all page elements, LSI/related terms, density analysis

   > **Reference**: See [references/audit-templates.md](./references/audit-templates.md) for the keyword optimization template (Step 6).

7. **Audit Internal Links** — Link count, anchor text relevance, broken links, recommended additions

   > **Reference**: See [references/audit-templates.md](./references/audit-templates.md) for the internal linking template (Step 7).

8. **Audit Images** — Alt text, file names, sizes, formats, lazy loading

   > **Reference**: See [references/audit-templates.md](./references/audit-templates.md) for the image optimization template (Step 8).

9. **Audit Technical On-Page Elements** — URL, canonical, mobile, speed, HTTPS, schema

   > **Reference**: See [references/audit-templates.md](./references/audit-templates.md) for the technical on-page template (Step 9).

10. **CORE-EEAT Content Quality Quick Scan** — 17 on-page-relevant items from the 80-item CORE-EEAT benchmark

    > **Reference**: See [references/audit-templates.md](./references/audit-templates.md) for the CORE-EEAT quick scan template (Step 10). Full benchmark: [CORE-EEAT Benchmark](../../references/core-eeat-benchmark.md).

11. **Generate Audit Summary** — Overall score with visual breakdown, priority issues (critical/important/minor), quick wins, detailed recommendations, competitor comparison, action checklist, expected results

    > **Reference**: See [references/audit-templates.md](./references/audit-templates.md) for the full audit summary template (Step 11).

## Validation Checkpoints

### Input Validation
- [ ] Target keyword(s) clearly specified by user
- [ ] Page content accessible (either via URL or provided HTML)
- [ ] If competitor comparison requested, competitor URL provided

### Output Validation
- [ ] Every recommendation cites specific data points (not generic advice)
- [ ] Scores based on measurable criteria, not subjective opinion
- [ ] All suggested changes include specific locations (title tag, H2 #3, paragraph 5, etc.)
- [ ] Source of each data point clearly stated (~~SEO tool data, user-provided, ~~web crawler, or manual review)

## Example

> **Reference**: See [references/audit-example.md](./references/audit-example.md) for a full worked example (noise-cancelling headphones audit) and page-type checklists (blog post, product page, landing page).

## On-Page SEO Scoring Methodology

### Element-by-Element Scoring

**Title Tag (Weight: 15%)**
- Length 50-60 characters: 0-5 points
- Primary keyword at front: 0-3 points
- Unique across site: 0-2 points
- Compelling/clickable: 0-5 points
- **Total: 15 points**

**Meta Description (Weight: 10%)**
- Length 150-160 characters: 0-3 points
- Keyword included naturally: 0-3 points
- Call-to-action present: 0-2 points
- Unique across site: 0-2 points
- **Total: 10 points**

**Header Structure (Weight: 15%)**
- Single H1 present: 0-5 points
- H1 includes primary keyword: 0-3 points
- Logical H2-H3 hierarchy: 0-4 points
- No skipped heading levels: 0-3 points
- **Total: 15 points**

**Content Quality (Weight: 25%)**
- Word count appropriate for intent: 0-5 points
- Covers main keyword thoroughly: 0-5 points
- Answers related questions (LSI): 0-5 points
- Data/citations present: 0-5 points
- Readability and formatting: 0-5 points
- **Total: 25 points**

**Keyword Optimization (Weight: 10%)**
- Primary keyword density (0.5-1.5%): 0-3 points
- Keyword in first 100 words: 0-3 points
- Secondary keywords used: 0-2 points
- Natural keyword placement: 0-2 points
- **Total: 10 points**

**Internal Links (Weight: 10%)**
- 5+ internal links present: 0-3 points
- Descriptive anchor text: 0-3 points
- Link to important pages: 0-2 points
- No broken links: 0-2 points
- **Total: 10 points**

**Technical On-Page (Weight: 15%)**
- URL structure clean: 0-3 points
- Mobile-friendly: 0-3 points
- Page speed acceptable: 0-3 points
- HTTPS enabled: 0-2 points
- Canonical tag correct: 0-2 points
- Schema markup present: 0-2 points
- **Total: 15 points**

### Overall Scoring Scale

- **90-100**: Excellent — Ready to publish or competitive
- **75-89**: Good — Minor fixes needed
- **60-74**: Fair — Significant optimization needed
- **40-59**: Poor — Major revisions required
- **0-39**: Critical — Rewrite recommended

---

## On-Page SEO Audit Checklist

### Pre-Publishing Checklist

**Content Foundation**:
- [ ] Target keyword defined and aligned with search intent
- [ ] Secondary keywords (3-5) identified for natural integration
- [ ] Content angle unique (not just rewritten competitor content)
- [ ] Word count appropriate for content type (1500+ for competitive keywords)
- [ ] Outline created before writing

**Title Tag**:
- [ ] 50-60 characters (including spaces)
- [ ] Primary keyword at front of title
- [ ] Brand name included (if space allows)
- [ ] Compelling and clickable (not just keyword stuffing)
- [ ] Matches search intent (user will expect this content)

**Meta Description**:
- [ ] 150-160 characters written
- [ ] Keyword included once naturally
- [ ] Clear call-to-action ("Learn how," "Get guide," "Try free")
- [ ] Accurately summarizes content above the fold
- [ ] Unique across entire site

**Headers**:
- [ ] Single H1 on page (represents main topic)
- [ ] H1 includes primary keyword
- [ ] H2s support main argument (3-8 H2s typical)
- [ ] H2s include related keywords where natural
- [ ] H3s under relevant H2s (no orphaned subheadings)
- [ ] Hierarchy is logical (no jumping from H1 → H3)

**Content Body**:
- [ ] First 150 words answer the main question
- [ ] Each paragraph 3-5 sentences (scannable)
- [ ] Section headers make page skimmable
- [ ] At least 5 data points with attribution
- [ ] At least 1 external link per 500 words
- [ ] Bolded key terms and concepts
- [ ] Numbered lists where sequential
- [ ] Bullet points for feature/benefit lists

**Keyword Integration**:
- [ ] Primary keyword in: Title, H1, first paragraph, body (2-3x), conclusion
- [ ] Secondary keywords distributed across H2s and body
- [ ] LSI/synonym terms used naturally (no keyword stuffing)
- [ ] Keyword density 0.5-1.5% (use tools to check)
- [ ] No unnatural keyword placement (reads naturally)

**Images**:
- [ ] Every image has descriptive alt text
- [ ] Alt text includes keyword where appropriate
- [ ] Image filenames are descriptive (not image-123.jpg)
- [ ] Images are compressed (not slowing page)
- [ ] At least 1 image per 300 words
- [ ] Images add value (not decorative filler)

**Internal Linking**:
- [ ] 5-10 internal links present (based on content length)
- [ ] Anchor text is descriptive (not "click here")
- [ ] Links point to high-value pages
- [ ] Links are contextual (within paragraph, not just sidebar)
- [ ] Related articles linked at end
- [ ] No broken links to 404 pages

**Technical Elements**:
- [ ] URL is short, descriptive, keyword-relevant
- [ ] URL uses hyphens (not underscores or spaces)
- [ ] Lowercase only
- [ ] Canonical tag is self-referencing
- [ ] Mobile-friendly (responsive design)
- [ ] Page speed acceptable (under 3 seconds)
- [ ] HTTPS enabled (not HTTP)

**Featured Snippet Optimization** (if applicable):
- [ ] Definition/summary at top (40-60 words)
- [ ] Question-based H2 matching common searches
- [ ] Table with 3-4 columns (for comparison queries)
- [ ] Numbered list (for how-to queries)
- [ ] Bulleted list (for lists/categories)

**Structured Data**:
- [ ] Article schema (if blog post)
- [ ] FAQ schema (if FAQ section)
- [ ] BreadcrumbList schema (for hierarchy)
- [ ] Organization schema (on homepage)
- [ ] LocalBusiness schema (if local service)
- [ ] Schema tested in Google Rich Results validator

---

## Example On-Page Audit Report Format

```markdown
## On-Page SEO Audit Report

**Page**: Best Dog Grooming Clippers for Thick Coats
**URL**: example.com/blog/dog-grooming-clippers-thick-coat
**Target Keyword**: dog grooming clippers for thick coat
**Current Ranking**: Not ranking (target position: Top 5)
**Date Audited**: March 11, 2024

### Executive Summary

**Overall Score**: 68/100 (Fair - revisions recommended)

| Element | Score | Status | Priority |
|---------|-------|--------|----------|
| Title Tag | 12/15 | Good | Low |
| Meta Description | 7/10 | Poor | High |
| Headers | 11/15 | Good | Low |
| Content Quality | 18/25 | Fair | High |
| Keyword Optimization | 7/10 | Fair | Medium |
| Internal Links | 6/10 | Fair | Medium |
| Technical | 12/15 | Good | Low |

### Critical Issues (Fix First)

1. **Meta Description Missing Primary Keyword**
   - Current: "Guide to choosing the best dog clippers. Tips for grooming thick coat dogs."
   - Issue: Keyword "dog grooming clippers for thick coat" not included
   - Fix: "Best dog grooming clippers for thick coats—our top 5 picks reviewed and compared."
   - Expected impact: +10-15% CTR from SERPs

2. **Insufficient Data Points**
   - Current: 2 statistics cited
   - Issue: Competitors average 8+ data points with sources
   - Fix: Add comparative data (clipper specs, price points, durability metrics)
   - Expected impact: +5% authority score

### Important Issues (Prioritize)

3. **Keyword Density Below Optimal**
   - Primary keyword appears 4x in 2000 words (0.2%)
   - Recommendation: 8-10 mentions for competitive keyword
   - Locations to add: H2 #3, conclusion paragraph, related articles section

4. **Weak Internal Linking**
   - Current: 3 internal links
   - Recommendation: 8-10 for 2000-word article
   - Suggested links: Related breed guides, other grooming tools, maintenance tips

### Minor Issues (Address If Time)

5. **Title Character Count**
   - Current: 48 characters (slightly short)
   - Could add modifier: "Best Dog Grooming Clippers for Thick Coats [2024 Reviews]"

### Summary of Recommendations

1. [ ] Rewrite meta description to include target keyword (5 min)
2. [ ] Add 6+ data points with citations (20 min)
3. [ ] Increase target keyword to 8-10 mentions naturally (15 min)
4. [ ] Add 5 more internal links with proper anchor text (10 min)
5. [ ] Extend title by 2 words for better CTR (2 min)

**Estimated post-fix ranking improvement**: Current Not Ranking → Target Top 5 within 2-3 months
```

---

## Tips for Success

1. **Prioritize issues by impact** - Fix critical issues first
2. **Compare to competitors** - See what's working for top rankings
3. **Balance optimization and readability** - Don't over-optimize
4. **Audit regularly** - Content degrades over time
5. **Test changes** - Track ranking changes after updates

> **Scoring details**: For the complete weight distribution, scoring scale, issue resolution playbook, and industry benchmarks, see [references/scoring-rubric.md](./references/scoring-rubric.md).

## Reference Materials

- [Scoring Rubric](./references/scoring-rubric.md) — Detailed scoring criteria, weight distribution, and grade boundaries for on-page audits
- [Audit Templates](./references/audit-templates.md) — Detailed output templates for steps 5-11 (content quality, keywords, links, images, technical, CORE-EEAT scan, audit summary)
- [Audit Example & Checklists](./references/audit-example.md) — Full worked example and page-type checklists (blog, product, landing page)

## Related Skills

- [seo-content-writer](../../build/seo-content-writer/) — Create optimized content
- [technical-seo-checker](../technical-seo-checker/) — Technical SEO audit
- [meta-tags-optimizer](../../build/meta-tags-optimizer/) — Optimize meta tags
- [serp-analysis](../../research/serp-analysis/) — SERP context for audit findings
- [content-refresher](../content-refresher/) — Update existing content
- [content-quality-auditor](../../cross-cutting/content-quality-auditor/) — Full 80-item CORE-EEAT audit
- [internal-linking-optimizer](../internal-linking-optimizer/) — Optimize internal link structure
- [schema-markup-generator](../../build/schema-markup-generator/) — Validate and generate schema markup

