---
name: technical-seo-checker
description: "This skill should be used when the user asks to \"technical SEO audit\"\
  , \"check page speed\", \"Core Web Vitals\", \"LCP is slow\", \"CLS problem\", \"\
  INP issues\", \"crawl errors\", \"indexing problems\", \"robots.txt check\", \"\
  XML sitemap errors\", \"hreflang issues\", \"canonical tag problems\", \"HTTPS not\
  \ working\", \"mobile SEO\", \"JavaScript rendering\", or \"site health check\"\
  . Performs comprehensive technical SEO audits: Core Web Vitals (LCP/CLS/INP/TTFB),\
  \ crawlability, indexability, mobile-friendliness, HTTPS/HSTS security, URL structure,\
  \ redirect chains, robots.txt, XML sitemaps, hreflang, canonical tags, and structured\
  \ data validation. Produces a scored technical health report (0\u2013100) with critical/high/medium\
  \ issue triage and a prioritized implementation roadmap. Works with Google PageSpeed\
  \ Insights, Google Search Console, crawl tools, or manual audit. For content element\
  \ issues, see on-page-seo-auditor. For link architecture, see internal-linking-optimizer."
version: 3.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
  - seo
  - technical
  - audit
  triggers:
  - technical seo
  - crawl errors
  - indexing issues
  estimated-duration: Medium
  geo-relevance: high
---

# Technical SEO Checker


> **[SEO & GEO Skills Library](https://skills.sh/aaron-he-zhu/seo-geo-claude-skills)** · 20 skills for SEO + GEO · Install all: `npx skills add aaron-he-zhu/seo-geo-claude-skills`

<details>
<summary>Browse all 20 skills</summary>

**Research** · [keyword-research](../../research/keyword-research/) · [competitor-analysis](../../research/competitor-analysis/) · [serp-analysis](../../research/serp-analysis/) · [content-gap-analysis](../../research/content-gap-analysis/)

**Build** · [seo-content-writer](../../build/seo-content-writer/) · [geo-content-optimizer](../../build/geo-content-optimizer/) · [meta-tags-optimizer](../../build/meta-tags-optimizer/) · [schema-markup-generator](../../build/schema-markup-generator/)

**Optimize** · [on-page-seo-auditor](../on-page-seo-auditor/) · **technical-seo-checker** · [internal-linking-optimizer](../internal-linking-optimizer/) · [content-refresher](../content-refresher/)

**Monitor** · [rank-tracker](../../monitor/rank-tracker/) · [backlink-analyzer](../../monitor/backlink-analyzer/) · [performance-reporter](../../monitor/performance-reporter/) · [alert-manager](../../monitor/alert-manager/)

**Cross-cutting** · [content-quality-auditor](../../cross-cutting/content-quality-auditor/) · [domain-authority-auditor](../../cross-cutting/domain-authority-auditor/) · [entity-optimizer](../../cross-cutting/entity-optimizer/) · [memory-management](../../cross-cutting/memory-management/)

</details>

This skill performs comprehensive technical SEO audits to identify issues that may prevent search engines from properly crawling, indexing, and ranking your site.

## When to Use This Skill

- Launching a new website
- Diagnosing ranking drops
- Pre-migration SEO audits
- Regular technical health checks
- Identifying crawl and index issues
- Improving site performance
- Fixing Core Web Vitals issues

## What This Skill Does

1. **Crawlability Audit**: Checks robots.txt, sitemaps, crawl issues
2. **Indexability Review**: Analyzes index status and blockers
3. **Site Speed Analysis**: Evaluates Core Web Vitals and performance
4. **Mobile-Friendliness**: Checks mobile optimization
5. **Security Check**: Reviews HTTPS and security headers
6. **Structured Data Audit**: Validates schema markup
7. **URL Structure Analysis**: Reviews URL patterns and redirects
8. **International SEO**: Checks hreflang and localization

## How to Use

### Full Technical Audit

```
Perform a technical SEO audit for [URL/domain]
```

### Specific Issue Check

```
Check Core Web Vitals for [URL]
```

```
Audit crawlability and indexability for [domain]
```

### Pre-Migration Audit

```
Technical SEO checklist for migrating [old domain] to [new domain]
```

## Data Sources

> See [CONNECTORS.md](../../CONNECTORS.md) for tool category placeholders.

**With ~~web crawler + ~~page speed tool + ~~CDN connected:**
Claude can automatically crawl the entire site structure via ~~web crawler, pull Core Web Vitals and performance metrics from ~~page speed tool, analyze caching headers from ~~CDN, and fetch mobile-friendliness data. This enables comprehensive automated technical audits.

**With manual data only:**
Ask the user to provide:
1. Site URL(s) to audit
2. PageSpeed Insights screenshots or reports
3. robots.txt file content
4. sitemap.xml URL or file

Proceed with the full audit using provided data. Note in the output which findings are from automated crawl vs. manual review.

## Instructions

When a user requests a technical SEO audit:

1. **Audit Crawlability**

   ```markdown
   ## Crawlability Analysis
   
   ### Robots.txt Review
   
   **URL**: [domain]/robots.txt
   **Status**: [Found/Not Found/Error]
   
   **Current Content**:
   ```
   [robots.txt content]
   ```
   
   | Check | Status | Notes |
   |-------|--------|-------|
   | File exists | ✅/❌ | [notes] |
   | Valid syntax | ✅/⚠️/❌ | [errors found] |
   | Sitemap declared | ✅/❌ | [sitemap URL] |
   | Important pages blocked | ✅/⚠️/❌ | [blocked paths] |
   | Assets blocked | ✅/⚠️/❌ | [CSS/JS blocked?] |
   | Correct user-agents | ✅/⚠️/❌ | [notes] |
   
   **Issues Found**:
   - [Issue 1]
   - [Issue 2]
   
   **Recommended robots.txt**:
   ```
   User-agent: *
   Allow: /
   Disallow: /admin/
   Disallow: /private/
   
   Sitemap: https://example.com/sitemap.xml
   ```
   
   ---
   
   ### XML Sitemap Review
   
   **Sitemap URL**: [URL]
   **Status**: [Found/Not Found/Error]
   
   | Check | Status | Notes |
   |-------|--------|-------|
   | Sitemap exists | ✅/❌ | [notes] |
   | Valid XML format | ✅/⚠️/❌ | [errors] |
   | In robots.txt | ✅/❌ | [notes] |
   | Submitted to ~~search console | ✅/⚠️/❌ | [notes] |
   | URLs count | [X] | [appropriate?] |
   | Only indexable URLs | ✅/⚠️/❌ | [notes] |
   | Includes priority | ✅/⚠️ | [notes] |
   | Includes lastmod | ✅/⚠️ | [accurate?] |
   
   **Issues Found**:
   - [Issue 1]
   
   ---
   
   ### Crawl Budget Analysis
   
   | Factor | Status | Impact |
   |--------|--------|--------|
   | Crawl errors | [X] errors | [Low/Med/High] |
   | Duplicate content | [X] pages | [Low/Med/High] |
   | Thin content | [X] pages | [Low/Med/High] |
   | Redirect chains | [X] found | [Low/Med/High] |
   | Orphan pages | [X] found | [Low/Med/High] |
   
   **Crawlability Score**: [X]/10
   ```

2. **Audit Indexability**

   ```markdown
   ## Indexability Analysis
   
   ### Index Status Overview
   
   | Metric | Count | Notes |
   |--------|-------|-------|
   | Pages in sitemap | [X] | |
   | Pages indexed | [X] | [source: site: search] |
   | Index coverage ratio | [X]% | [good if >90%] |
   
   ### Index Blockers Check
   
   | Blocker Type | Found | Pages Affected |
   |--------------|-------|----------------|
   | noindex meta tag | [X] | [list or "none"] |
   | noindex X-Robots | [X] | [list or "none"] |
   | Robots.txt blocked | [X] | [list or "none"] |
   | Canonical to other | [X] | [list or "none"] |
   | 4xx/5xx errors | [X] | [list or "none"] |
   | Redirect loops | [X] | [list or "none"] |
   
   ### Canonical Tags Audit
   
   | Check | Status | Notes |
   |-------|--------|-------|
   | Canonicals present | ✅/⚠️/❌ | [X]% of pages |
   | Self-referencing | ✅/⚠️/❌ | [notes] |
   | Consistent (HTTP/HTTPS) | ✅/⚠️/❌ | [notes] |
   | Consistent (www/non-www) | ✅/⚠️/❌ | [notes] |
   | No conflicting signals | ✅/⚠️/❌ | [notes] |
   
   ### Duplicate Content Issues
   
   | Issue Type | Count | Examples |
   |------------|-------|----------|
   | Exact duplicates | [X] | [URLs] |
   | Near duplicates | [X] | [URLs] |
   | Parameter duplicates | [X] | [URLs] |
   | WWW/non-WWW | [X] | [notes] |
   | HTTP/HTTPS | [X] | [notes] |
   
   **Indexability Score**: [X]/10
   ```

3. **Audit Site Speed & Core Web Vitals** — CWV metrics (LCP/FID/CLS/INP), additional performance metrics (TTFB/FCP/Speed Index/TBT), resource loading breakdown, optimization recommendations

   > **Reference**: See [references/technical-audit-templates.md](./references/technical-audit-templates.md) for the performance analysis template (Step 3).

4. **Audit Mobile-Friendliness** — Mobile-friendly test, responsive design check, mobile-first indexing verification

   > **Reference**: See [references/technical-audit-templates.md](./references/technical-audit-templates.md) for the mobile optimization template (Step 4).

5. **Audit Security & HTTPS** — SSL certificate, HTTPS enforcement, mixed content, HSTS, security headers (CSP, X-Frame-Options, etc.)

   > **Reference**: See [references/technical-audit-templates.md](./references/technical-audit-templates.md) for the security analysis template (Step 5).

6. **Audit URL Structure** — URL patterns, issues (dynamic params, session IDs, uppercase), redirect analysis (chains, loops, 302s)

   > **Reference**: See [references/technical-audit-templates.md](./references/technical-audit-templates.md) for the URL structure template (Step 6).

7. **Audit Structured Data** — Schema markup validation, missing schema opportunities. CORE-EEAT alignment: maps to O05.

   > **Reference**: See [references/technical-audit-templates.md](./references/technical-audit-templates.md) for the structured data template (Step 7).

8. **Audit International SEO (if applicable)** — Hreflang implementation, language/region targeting

   > **Reference**: See [references/technical-audit-templates.md](./references/technical-audit-templates.md) for the international SEO template (Step 8).

9. **Generate Technical Audit Summary** — Overall health score with visual breakdown, critical/high/medium issues, quick wins, implementation roadmap (weeks 1-4+), monitoring recommendations

   > **Reference**: See [references/technical-audit-templates.md](./references/technical-audit-templates.md) for the audit summary template (Step 9).

## Validation Checkpoints

### Input Validation
- [ ] Site URL or domain clearly specified
- [ ] Access to technical data (robots.txt, sitemap, or crawl results)
- [ ] Performance metrics available (via ~~page speed tool or screenshots)

### Output Validation
- [ ] Every recommendation cites specific data points (not generic advice)
- [ ] All issues include affected URLs or page counts
- [ ] Performance metrics include actual numbers with units (seconds, KB, etc.)
- [ ] Source of each data point clearly stated (~~web crawler data, ~~page speed tool, user-provided, or estimated)

## Example

> **Reference**: See [references/technical-audit-example.md](./references/technical-audit-example.md) for a full worked example (cloudhosting.com technical audit) and the comprehensive technical SEO checklist.

## Technical SEO Scoring Methodology

### Health Score Breakdown (0-100 scale)

**Crawlability (20%)**
- robots.txt valid and not blocking content: 0-5 points
- XML sitemap exists and is valid: 0-5 points
- No crawl errors in ~~search console: 0-5 points
- Crawl budget optimized: 0-5 points
- **Subtotal: 20 points**

**Indexability (20%)**
- 90%+ pages indexed vs submitted: 0-5 points
- No unintended noindex tags: 0-5 points
- No duplicate content issues: 0-5 points
- Canonical tags properly implemented: 0-5 points
- **Subtotal: 20 points**

**Core Web Vitals (20%)**
- LCP < 2.5s (Largest Contentful Paint): 0-5 points
- FID/INP < 100ms (Interaction response): 0-5 points
- CLS < 0.1 (Cumulative Layout Shift): 0-5 points
- TTFB < 600ms (Time to First Byte): 0-5 points
- **Subtotal: 20 points**

**Mobile-Friendliness (10%)**
- Responsive design on all screen sizes: 0-5 points
- Touch-friendly buttons/links (48px minimum): 0-5 points
- **Subtotal: 10 points**

**Security & HTTPS (10%)**
- HTTPS enabled site-wide: 0-3 points
- No mixed content warnings: 0-3 points
- SSL certificate valid: 0-4 points
- **Subtotal: 10 points**

**URL Structure & Redirects (10%)**
- URLs are clean and descriptive: 0-3 points
- No redirect chains (>2 hops): 0-3 points
- Redirect loop free: 0-2 points
- No 404 errors on popular pages: 0-2 points
- **Subtotal: 10 points**

**Structured Data (5%)**
- Schema markup validated: 0-3 points
- No critical schema errors: 0-2 points
- **Subtotal: 5 points**

**International SEO (5%)**
- Hreflang properly implemented (if multi-lang): 0-3 points
- Language targeting configured in ~~search console: 0-2 points
- **Subtotal: 5 points**

### Overall Technical Health Scale

- **90-100**: Excellent — Strong technical foundation
- **75-89**: Good — Minor optimizations needed
- **60-74**: Fair — Moderate issues requiring attention
- **40-59**: Poor — Multiple critical issues
- **0-39**: Critical — Requires urgent overhaul

---

## Technical SEO Audit Checklist

### Crawlability Audit

- [ ] robots.txt file exists at `/robots.txt`
- [ ] robots.txt syntax is valid (no disallow errors)
- [ ] Important pages are NOT blocked by robots.txt
- [ ] CSS and JS files are NOT blocked (needed for rendering)
- [ ] Sitemap URL is declared in robots.txt
- [ ] XML sitemap exists and valid (`/sitemap.xml` or sitemap index)
- [ ] Sitemap includes all important pages
- [ ] Sitemap does NOT include noindex pages
- [ ] No `<meta name="robots" content="nofollow">` on important pages
- [ ] ~~Search console shows no "Blocked by robots.txt" errors
- [ ] Crawl errors in ~~search console are <100 (aim for <10)
- [ ] Redirect chains are 0 (or maximum 1-2)
- [ ] No infinite loops or circular redirects

### Indexability Audit

- [ ] Index coverage ratio >90% (indexed/submitted pages)
- [ ] No unintended noindex directives on important pages
- [ ] Canonical tags are self-referencing (page → itself)
- [ ] Canonicals point to HTTPS version (not HTTP)
- [ ] Canonicals are consistent (www vs non-www)
- [ ] No canonical pointing to 404 pages
- [ ] Duplicate content identified and resolved
- [ ] Parameter handling configured in ~~search console
- [ ] Mobile-specific pages have correct rel="alternate" tags
- [ ] International pages have hreflang if applicable

### Core Web Vitals Audit

**Largest Contentful Paint (LCP) < 2.5s**:
- [ ] Server response time < 600ms (TTFB)
- [ ] Images are optimized (compressed, modern formats)
- [ ] Lazy loading used for below-fold images
- [ ] Critical CSS loaded inline or prioritized
- [ ] Large third-party scripts loaded asynchronously
- [ ] CDN used for asset delivery

**Interaction to Next Paint (INP) < 100ms**:
- [ ] JavaScript execution time is minimal
- [ ] Long tasks are broken into <50ms chunks
- [ ] Third-party scripts don't block main thread
- [ ] Input processing happens quickly

**Cumulative Layout Shift (CLS) < 0.1**:
- [ ] Images and videos have explicit dimensions
- [ ] Ads/embeds have reserved space
- [ ] Fonts don't cause layout shift (font-display: swap)
- [ ] No unexpected layout shifts on interaction

### Mobile Optimization Audit

- [ ] Site is mobile-friendly (responsive design)
- [ ] Text is readable without zooming
- [ ] Buttons/links are 48px+ (touch-friendly)
- [ ] No horizontal scrolling required
- [ ] Viewport meta tag is set correctly
- [ ] Mobile page speed is optimized
- [ ] Mobile-first indexing enabled in ~~search console

### Security Audit

- [ ] HTTPS enabled on all pages
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate is valid and not expired
- [ ] No mixed content (HTTP resources on HTTPS page)
- [ ] Security headers implemented (CSP, X-Frame-Options, etc.)
- [ ] No malware warnings in ~~search console

### URL Structure Audit

- [ ] URLs use hyphens (not underscores, spaces, or special chars)
- [ ] URLs use lowercase only
- [ ] URLs are descriptive (not /p/12345)
- [ ] Date-based URLs avoided (if not necessary)
- [ ] URL length is reasonable (<80 characters)
- [ ] Query parameters are minimal
- [ ] Session IDs not in URLs
- [ ] No unnecessary subdirectories

### Redirect Audit

- [ ] Old URLs have 301 redirects to new URLs
- [ ] Redirects are one-hop (not chains)
- [ ] No redirect loops (A→B→A)
- [ ] Redirects are permanent (301, not 302 temporary)
- [ ] Redirected pages lose no authority

### Structured Data Audit

- [ ] Schema markup is valid JSON-LD
- [ ] No critical errors in Google Rich Results validator
- [ ] Article schema on blog posts
- [ ] BreadcrumbList schema on hierarchical pages
- [ ] Organization/LocalBusiness schema on homepage
- [ ] Product schema on product pages
- [ ] FAQ schema if FAQ section exists
- [ ] Review schema if customer reviews present

### International SEO Audit (if applicable)

- [ ] Hreflang tags implemented on all language versions
- [ ] Hreflang syntax is correct
- [ ] Reciprocal hreflang (A points to B, B points to A)
- [ ] x-default hreflang for default language
- [ ] Language targeting set in ~~search console
- [ ] No conflicting hreflang and rel="alternate" tags

---

## Technical Audit Report Template

```markdown
## Technical SEO Audit Report

**Domain**: example.com
**Audit Date**: March 11, 2024
**Auditor**: [Name]
**Site Type**: SaaS (marketing site)

### Executive Summary

**Technical Health Score**: 72/100 (Fair)

| Category | Score | Status | Priority |
|----------|-------|--------|----------|
| Crawlability | 18/20 | Good | Low |
| Indexability | 14/20 | Fair | Medium |
| Core Web Vitals | 12/20 | Poor | High |
| Mobile | 10/10 | Excellent | Low |
| Security | 10/10 | Excellent | Low |
| URL Structure | 8/10 | Good | Low |
| Structured Data | 3/5 | Poor | Medium |
| International | N/A | N/A | N/A |

### Critical Issues (Fix Immediately)

**1. Core Web Vitals Failing**
- LCP: 3.2s (target <2.5s) ❌
- INP: 150ms (target <100ms) ❌
- CLS: 0.12 (target <0.1) ⚠️

**Impact**: Pages will rank lower in Google results
**Root Causes**:
- Large images not optimized (2.4MB hero image)
- Third-party analytics script blocking main thread
- Font loading causes layout shift

**Fix Timeline**:
- Week 1: Compress images (save 70% size)
- Week 2: Async load analytics + font preload
- Week 3: Test and validate improvements

**Expected Outcome**: LCP: 2.0s, INP: 80ms, CLS: 0.08

---

**2. Structured Data Missing on Key Pages**
- Blog posts: No Article schema (0/45 posts)
- Homepage: No Organization schema
- Products: No Product schema

**Impact**: Missing rich snippets in search results
**Fix**: Add JSON-LD schema to all content types (2 hours)

---

### High Priority Issues (Next 2 weeks)

**3. Indexability Coverage 85% (Target >90%)**
- Submitted: 450 pages
- Indexed: 382 pages
- Missing: 68 pages

**Cause**: Likely noindex on archived blog category pages

**Fix**:
- Audit noindex pages (why noindex?)
- Remove noindex from indexable pages
- Keep noindex only on true duplicate/low-value pages

---

**4. Crawl Errors: 34 404s**
- 12 old blog post URLs
- 15 broken internal links
- 7 image URLs

**Fix**:
- Set 301 redirects for old URLs (1 hour)
- Fix broken internal links (1 hour)
- Update image URLs in HTML (30 min)

---

### Implementation Roadmap

**Week 1**:
- [ ] Image optimization (reduce LCP)
- [ ] Async third-party scripts
- [ ] Add Article schema to 20 top blog posts

**Week 2**:
- [ ] Font optimization (fix CLS)
- [ ] Add Organization schema to homepage
- [ ] Fix remaining blog posts (25 more)

**Week 3**:
- [ ] Test Core Web Vitals improvements
- [ ] Add Product schema (if applicable)
- [ ] Internal link audit and fixes

**Week 4**:
- [ ] Test all schema in Google Rich Results validator
- [ ] Final CWV validation
- [ ] Monitor ~~search console for improvements

### Monitoring Plan

**Track these metrics monthly**:
- Core Web Vitals (via PageSpeed Insights)
- Index coverage (via ~~search console)
- Crawl errors (via ~~search console)
- Ranking improvements for target keywords

**Expected ranking improvement**: 2-4 position improvement within 6 weeks of fixes
```

---

## Tips for Success

1. **Prioritize by impact** - Fix critical issues first
2. **Monitor continuously** - Use ~~search console alerts
3. **Test changes** - Verify fixes work before deploying widely
4. **Document everything** - Track changes for troubleshooting
5. **Regular audits** - Schedule quarterly technical reviews

> **Technical reference**: For issue severity framework, prioritization matrix, and Core Web Vitals optimization quick reference, see [references/http-status-codes.md](./references/http-status-codes.md).

## Reference Materials

- [robots.txt Reference](./references/robots-txt-reference.md) — Syntax guide, templates, common configurations
- [HTTP Status Codes](./references/http-status-codes.md) — SEO impact of each status code, redirect best practices
- [Technical Audit Templates](./references/technical-audit-templates.md) — Detailed output templates for steps 3-9 (CWV, mobile, security, URL structure, structured data, international, audit summary)
- [Technical Audit Example & Checklist](./references/technical-audit-example.md) — Full worked example and comprehensive technical SEO checklist

## Related Skills

- [on-page-seo-auditor](../on-page-seo-auditor/) — On-page SEO audit
- [schema-markup-generator](../../build/schema-markup-generator/) — Fix schema issues
- [performance-reporter](../../monitor/performance-reporter/) — Monitor improvements
- [internal-linking-optimizer](../internal-linking-optimizer/) — Fix link issues
- [alert-manager](../../monitor/alert-manager/) — Set up alerts for technical issues found
- [content-quality-auditor](../../cross-cutting/content-quality-auditor/) — Full 80-item CORE-EEAT audit

