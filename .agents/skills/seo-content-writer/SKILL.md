---
name: seo-content-writer
description: 'This skill should be used when the user asks to "write SEO content",
  "create a blog post", "write an article", "content writing for SEO", "draft optimized
  content", "write a how-to guide", "create a product description", "write a landing
  page", "SEO copywriting", "draft content targeting [keyword]", or "write 2000-word
  article about [topic]". Creates keyword-optimized content using a 12-step workflow:
  CORE-EEAT pre-write checklist, keyword integration, title optimization (5 formula
  options), meta description, H1/H2/H3 hierarchy, featured snippet targeting, internal/external
  linking, and readability enhancement. Produces full drafts with embedded SEO elements,
  title variants, meta description, FAQ section with schema, and a self-scored CORE-EEAT
  checklist. For AI-citation optimization, see geo-content-optimizer. For updating
  existing content, see content-refresher.'
version: 3.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
  - seo
  - content
  - create
  triggers:
  - seo content
  - write optimized
  - seo writing
  - content creation
  estimated-duration: Medium
  geo-relevance: high
---

# SEO Content Writer

> **[SEO & GEO Skills Library](https://skills.sh/aaron-he-zhu/seo-geo-claude-skills)** · 20 skills for SEO + GEO · Install all: `npx skills add aaron-he-zhu/seo-geo-claude-skills`

<details>
<summary>Browse all 20 skills</summary>

**Research** · [keyword-research](../../research/keyword-research/) · [competitor-analysis](../../research/competitor-analysis/) · [serp-analysis](../../research/serp-analysis/) · [content-gap-analysis](../../research/content-gap-analysis/)

**Build** · **seo-content-writer** · [geo-content-optimizer](../geo-content-optimizer/) · [meta-tags-optimizer](../meta-tags-optimizer/) · [schema-markup-generator](../schema-markup-generator/)

**Optimize** · [on-page-seo-auditor](../../optimize/on-page-seo-auditor/) · [technical-seo-checker](../../optimize/technical-seo-checker/) · [internal-linking-optimizer](../../optimize/internal-linking-optimizer/) · [content-refresher](../../optimize/content-refresher/)

**Monitor** · [rank-tracker](../../monitor/rank-tracker/) · [backlink-analyzer](../../monitor/backlink-analyzer/) · [performance-reporter](../../monitor/performance-reporter/) · [alert-manager](../../monitor/alert-manager/)

**Cross-cutting** · [content-quality-auditor](../../cross-cutting/content-quality-auditor/) · [domain-authority-auditor](../../cross-cutting/domain-authority-auditor/) · [entity-optimizer](../../cross-cutting/entity-optimizer/) · [memory-management](../../cross-cutting/memory-management/)

</details>

This skill creates search-engine-optimized content that ranks well while providing genuine value to readers. It applies proven SEO copywriting techniques, proper keyword integration, and optimal content structure.

## When to Use This Skill

- Writing blog posts targeting specific keywords
- Creating landing pages optimized for search
- Developing pillar content for topic clusters
- Writing product descriptions for e-commerce
- Creating service pages for local SEO
- Producing how-to guides and tutorials
- Writing comparison and review articles

## What This Skill Does

1. **Keyword Integration**: Naturally incorporates target and related keywords
2. **Structure Optimization**: Creates scannable, well-organized content
3. **Title & Meta Creation**: Writes compelling, click-worthy titles
4. **Header Optimization**: Uses strategic H1-H6 hierarchy
5. **Internal Linking**: Suggests relevant internal link opportunities
6. **Readability Enhancement**: Ensures content is accessible and engaging
7. **Featured Snippet Optimization**: Formats for SERP feature opportunities

## How to Use

### Basic Content Creation

```
Write an SEO-optimized article about [topic] targeting the keyword [keyword]
```

```
Create a blog post for [topic] with these keywords: [keyword list]
```

### With Specific Requirements

```
Write a 2,000-word guide about [topic] targeting [keyword],
include FAQ section for featured snippets
```

### Content Briefs

```
Here's my content brief: [brief]. Write SEO-optimized content following this outline.
```

## Data Sources

> See [CONNECTORS.md](../../CONNECTORS.md) for tool category placeholders.

**With ~~SEO tool + ~~search console connected:**
Automatically pull keyword metrics (search volume, difficulty, CPC), competitor content analysis (top-ranking pages, content length, common topics), SERP features (featured snippets, PAA questions), and keyword opportunities (related keywords, question-based queries).

**With manual data only:**
Ask the user to provide:
1. Target primary keyword and 3-5 secondary keywords
2. Target audience and search intent (informational/commercial/transactional)
3. Target word count and desired tone
4. Any competitor URLs or content examples to reference

Proceed with the full workflow using provided data. Note in the output which metrics are from automated collection vs. user-provided data.

## Instructions

When a user requests SEO content:

1. **Gather Requirements**

   Confirm or ask for:
   
   ```markdown
   ### Content Requirements
   
   **Primary Keyword**: [main keyword]
   **Secondary Keywords**: [2-5 related keywords]
   **Target Word Count**: [length]
   **Content Type**: [blog/guide/landing page/etc.]
   **Target Audience**: [who is this for]
   **Search Intent**: [informational/commercial/transactional]
   **Tone**: [professional/casual/technical/friendly]
   **CTA Goal**: [what action should readers take]
   **Competitor URLs**: [top ranking content to beat]
   ```

2. **Load CORE-EEAT Quality Constraints**

   Before writing, load content quality standards from the [CORE-EEAT Benchmark](../../references/core-eeat-benchmark.md):

   ```markdown
   ### CORE-EEAT Pre-Write Checklist

   **Content Type**: [identified from requirements above]
   **Loaded Constraints** (high-weight items for this content type):

   Apply these standards while writing:

   | ID | Standard | How to Apply |
   |----|----------|-------------|
   | C01 | Intent Alignment | Title promise must match content delivery |
   | C02 | Direct Answer | Core answer in first 150 words |
   | C06 | Audience Targeting | State "this article is for..." |
   | C10 | Semantic Closure | Conclusion answers opening question + next steps |
   | O01 | Heading Hierarchy | H1→H2→H3, no level skipping |
   | O02 | Summary Box | Include TL;DR or Key Takeaways |
   | O06 | Section Chunking | Each section single topic; paragraphs 3–5 sentences |
   | O09 | Information Density | No filler; consistent terminology |
   | R01 | Data Precision | ≥5 precise numbers with units |
   | R02 | Citation Density | ≥1 external citation per 500 words |
   | R04 | Evidence-Claim Mapping | Every claim backed by evidence |
   | R07 | Entity Precision | Full names for people/orgs/products |
   | C03 | Query Coverage | Cover ≥3 query variants (synonyms, long-tail) |
   | O08 | Anchor Navigation | Table of contents with jump links |
   | O10 | Multimedia Structure | Images/videos have captions and carry information |
   | E07 | Practical Tools | Include downloadable templates, checklists, or calculators |

   _These 16 items apply across all content types. For content-type-specific dimension weights, see the Content-Type Weight Table in [core-eeat-benchmark.md](../../references/core-eeat-benchmark.md)._
   _Full 80-item benchmark: [references/core-eeat-benchmark.md](../../references/core-eeat-benchmark.md)_
   _For complete content quality audit: use [content-quality-auditor](../../cross-cutting/content-quality-auditor/)_
   ```

3. **Research and Plan**

   Before writing:
   
   ```markdown
   ### Content Research
   
   **SERP Analysis**:
   - Top results format: [what's ranking]
   - Average word count: [X] words
   - Common sections: [list]
   - SERP features: [snippets, PAA, etc.]
   
   **Keyword Map**:
   - Primary: [keyword] - use in title, H1, intro, conclusion
   - Secondary: [keywords] - use in H2s, body paragraphs
   - LSI/Related: [terms] - sprinkle naturally throughout
   - Questions: [PAA questions] - use as H2/H3s or FAQ
   
   **Content Angle**:
   [What unique perspective or value will this content provide?]
   ```

4. **Create Optimized Title**

   ```markdown
   ### Title Optimization
   
   **Requirements**:
   - Include primary keyword (preferably at start)
   - Under 60 characters for full SERP display
   - Compelling and click-worthy
   - Match search intent
   
   **Title Options**:
   
   1. [Title option 1] ([X] chars)
      - Keyword position: [front/middle]
      - Power words: [list]
   
   2. [Title option 2] ([X] chars)
      - Keyword position: [front/middle]
      - Power words: [list]
   
   **Recommended**: [Best option with reasoning]
   ```

5. **Write Meta Description**

   ```markdown
   ### Meta Description
   
   **Requirements**:
   - 150-160 characters
   - Include primary keyword naturally
   - Include call-to-action
   - Compelling and specific
   
   **Meta Description**:
   "[Description text]" ([X] characters)
   
   **Elements included**:
   - ✅ Primary keyword
   - ✅ Value proposition
   - ✅ CTA or curiosity hook
   ```

6. **Structure Content and Write**

   Structure: H1 (primary keyword, one per page) > Introduction (100-150 words, hook + promise + keyword in first 100 words) > H2 sections (secondary keywords/questions) > H3 sub-topics > FAQ section > Conclusion (summary + keyword + CTA).

7. **Apply On-Page SEO Best Practices**

   Follow the on-page SEO checklist (keyword placement, content quality, readability, technical elements) and the content writing template (H1 with keyword, hook, sections with H2/H3, FAQ, conclusion with CTA).

   > **Reference**: See [references/seo-writing-checklist.md](./references/seo-writing-checklist.md) for the full on-page SEO checklist, content writing template, and featured snippet optimization patterns.

   Key requirements while writing:
   - Primary keyword in title, H1, first 100 words, at least one H2, and conclusion
   - Paragraphs of 3-5 sentences; varied sentence length; bullet points and bold key phrases
   - Internal links (2-5) and external authoritative links (2-3)
   - FAQ section with 40-60 word answers for featured snippet opportunity
   - Optimize for definition, list, table, and how-to snippets where applicable

8. **Add Internal/External Links**

   ```markdown
   ### Link Recommendations
   
   **Internal Links** (include 2-5):
   1. "[anchor text]" → [/your-page-url] (relevant because: [reason])
   2. "[anchor text]" → [/your-page-url] (relevant because: [reason])
   
   **External Links** (include 2-3 authoritative sources):
   1. "[anchor text]" → [authoritative-source.com] (supports: [claim])
   2. "[anchor text]" → [authoritative-source.com] (supports: [claim])
   ```

9. **Final SEO Review and CORE-EEAT Self-Check**

    Score content across 10 SEO factors (title, meta description, H1, keyword placement, H2s, internal links, external links, FAQ, readability, word count) and produce an Overall SEO Score out of 10.

    Then verify the 16 CORE-EEAT pre-write constraints (C01, C02, C06, C10, O01, O02, O06, O09, R01, R02, R04, R07, C03, O08, O10, E07) with pass/warning/fail status. List items needing attention.

    _For full 80-item audit, use [content-quality-auditor](../../cross-cutting/content-quality-auditor/)_

## Validation Checkpoints

### Input Validation
- [ ] Primary keyword confirmed and matches search intent
- [ ] Target word count specified (minimum 800 words for substantive content)
- [ ] Content type and audience clearly defined
- [ ] Competitor URLs reviewed or target SERP features identified

### Output Validation
- [ ] Keyword density within 1-2% for primary keyword (Note: Keyword density is a guideline, not a hard rule. Modern search engines prioritize semantic relevance and natural language over exact density targets. Focus on covering the topic comprehensively with semantic variants rather than hitting a specific percentage.)
- [ ] All sections from outline covered completely
- [ ] Internal links included (2-5 relevant links)
- [ ] FAQ section present with at least 3 questions
- [ ] Readability score appropriate for target audience
- [ ] Source of each data point clearly stated (~~SEO tool data, user-provided, or estimated)

## Example

**User**: "Write an SEO-optimized article about 'email marketing best practices' targeting small businesses"

> **Reference**: See [references/seo-writing-checklist.md](./references/seo-writing-checklist.md) for the full example output demonstrating a complete SEO article with meta description, H1/H2/H3 hierarchy, statistics with citations, comparison tables, FAQ section, and conclusion with CTA.

The example output demonstrates: keyword in H1 and first 100 words, statistics with sources (DMA, Emarsys), comparison tables, bullet-point lists, pro tips, FAQ section with 40-60 word answers, and a clear CTA in the conclusion.

## Content Type Templates

### How-To Guide

```
Write a how-to guide for [task] targeting [keyword]
```

### Comparison Article

```
Write a comparison article: [Option A] vs [Option B] for [keyword]
```

### Listicle

```
Write a list post: "X Best [Items] for [Audience/Purpose]" targeting [keyword]
```

### Ultimate Guide

```
Write an ultimate guide about [topic] (3,000+ words) targeting [keyword]
```

## Content Writing Frameworks

### The "Answer-Evidence-Example" Pattern (High Conversion)

Use this structure for every key claim:

```
ANSWER (1-2 sentences)
Your direct answer to the question/claim.
Example: "Email marketing has a 4,200% ROI according to DMA."

EVIDENCE (1-2 sentences)
Data/citation backing the answer.
Example: "This means for every $1 spent, you get $42 back in revenue."

EXAMPLE (2-3 sentences)
Real-world example showing how it works.
Example: "An ecommerce store spent $500/month on email and generated $21,000 in revenue from email sales."
```

**Real example**:
```
ANSWER: Long-form content outranks short content in Google.

EVIDENCE: Content averaging 2,300+ words ranks in top 10 for competitive
keywords, while 400-word posts rarely break top 20 (Backlinko analysis
of 5 million pages).

EXAMPLE: When ConvertKit expanded their "Email Marketing Guide" from
800 to 2,400 words, it moved from position #15 to #4 for the target
keyword within 6 weeks.
```

---

### The "Problem-Obstacle-Solution-Result" (POSR) Content Framework

Structure how-to and educational content:

**Problem** (Paragraph 1-2)
State the challenge clearly. This is where readers see themselves.

**Obstacle** (Paragraph 3-4)
Why the obvious solution doesn't work. Address false assumptions.

**Solution** (Main content: H2s and body)
Step-by-step solution with examples, templates, screenshots.

**Result** (Conclusion)
What readers can expect after following your solution. Specific metrics.

**Real example** (Email marketing for SaaS):
```
PROBLEM: Your SaaS product needs more customers, but cold outreach fails.

OBSTACLE: Most cold email templates are generic and impersonal.
Recipients delete them. Personalization at scale seems impossible.

SOLUTION: [Detailed framework for personalized cold email]
1. Research buyer pain points (5 min per prospect)
2. Reference specific challenges in opening line
3. Keep body short (3-4 sentences)
4. End with question, not ask
[Steps 5-12...]

RESULT: Companies using this framework see 8-12% response rates
(vs 1-2% for generic cold email). One SaaS company booked 12 demos
in 6 weeks using this exact process.
```

---

### Title Formula Options (Proven High-CTR Patterns)

Use these templates for titles:

**1. Number + Adjective + Keyword**
- "7 Simple Email Marketing Tactics That Actually Work"
- "The 12 Best Project Management Tools for Remote Teams"
- Pattern: [Number] + [Adjective: Simple/Best/Fastest/Easiest] + [Topic]

**2. How-to + Benefit**
- "How to Write Cold Emails That Get Responses (Step-by-Step)"
- "How to Improve Your Website's Speed by 50%"
- Pattern: "How to [Action] + [Specific Benefit]"

**3. Question + Solution**
- "Why Your Emails Aren't Converting? (And How to Fix It)"
- "What is E-E-A-T? (And Why Google Cares)"
- Pattern: "[Question/Problem]? (And [Solution])"

**4. Comparison/Controversy**
- "[Tool A] vs [Tool B] for [Use Case]: Which is Better?"
- "Short-Form vs Long-Form Content: The Data is Clear"
- Pattern: "[A] vs [B]: [Specific angle]"

**5. Year + Definitive**
- "The Ultimate Guide to Email Marketing in 2024"
- "The Complete On-Page SEO Checklist [Updated 2024]"
- Pattern: "[Topic] [Year/Updated]" or "Ultimate [Topic]"

**Title Score Checklist**:
- [ ] Keyword at front (if possible)
- [ ] Under 60 characters
- [ ] Power word included (proven to boost CTR: Ultimate, Complete, Simple, Best, Proven, Easy)
- [ ] Specific number or benefit
- [ ] Matches search intent exactly

---

## Real-World Content Examples

### Example 1: SaaS Blog Post

**Keyword**: "How to manage remote teams"
**Search Volume**: 2,800/month
**Difficulty**: 22 (Low)
**Tone**: Actionable, practical
**Word Count**: 2,000

**Outline**:
```
H1: How to Manage a Remote Team (Best Practices + Tools)

Introduction: Hook + problem statement

H2: Why remote team management is different
- Different challenges vs. in-office teams

H2: Daily Communication Standards
- H3: Daily standups (async, sync, or hybrid?)
- H3: Slack/Zoom etiquette
- H3: Real example: Automattic's approach

H2: Visibility Without Micromanagement
- H3: Goal-based tracking vs time tracking
- H3: Tools to consider (click-up, monday, etc.)
- H3: Comparison table

H2: Trust-Building in Remote Teams
- H3: 1-on-1 video calls
- H3: Team rituals and traditions
- H3: Case study: GitLab's remote culture

H2: Common Mistakes to Avoid
- H3: Mistake #1: Over-communicating
- H3: Mistake #2: No structured meetings
- H3: Mistake #3: Tool overload

FAQ Section:
Q: "Is time tracking necessary for remote teams?"
A: [40-60 word answer]

Conclusion: Summary + CTA to download "Remote Team Management Template"
```

**Content Quality Elements**:
- 8+ statistics with sources (HubSpot, McKinsey, Owl Labs)
- 2-3 case studies (Automattic, GitLab, Buffer)
- 1 comparison table (Async vs Sync communication)
- 5+ actionable tips
- 1 downloadable resource (template)

---

### Example 2: E-commerce Product Guide

**Keyword**: "Best dog grooming clippers for thick coats"
**Search Volume**: 890/month
**Difficulty**: 28 (Low-Medium)
**Tone**: Helpful, expert
**Word Count**: 2,500

**Outline**:
```
H1: Best Dog Grooming Clippers for Thick Coats [2024 Reviews]

Introduction:
- Problem statement: "Thick-coated dogs are hard to groom"
- Solution preview: "Here are the 5 clippers that work best"

H2: What to Look For in Clippers for Thick Coats
- H3: Blade power (measured in strokes per second)
- H3: Blade length and adjustability
- H3: Cordless vs corded
- H3: Noise level (important for anxious dogs)

H2: Top 5 Clippers for Thick Coats
- H3: #1 [Brand Model] — Best overall
  * Price: $X
  * Watts: X
  * Strokes/sec: X
  * Pros: [list 3-4]
  * Cons: [list 1-2]
  * Who it's for: [specific dog types]
  * Customer rating: 4.8/5 (234 reviews)
  * Buy link (affiliate)

- H3: #2 [Brand Model] — Best budget option
- H3: #3 [Brand Model] — Best cordless
- H3: #4 [Brand Model] — Professional grade
- H3: #5 [Brand Model] — Best for sensitive skin

H2: How to Use Clippers on Thick Coats
- Step-by-step guide (6-8 steps)
- Include before/after photos

H2: Maintenance & Care
- How to clean and oil clippers
- Blade replacement schedule

FAQ:
Q: "How often should I groom a thick-coated dog?"
Q: "Can I use regular clippers on thick coats?"
Q: "How long do good clippers last?"

Conclusion: Summary + final recommendation + CTA to check prices on Amazon
```

**Content Quality Elements**:
- 5+ product comparison table
- 10+ customer testimonials quoted
- Price comparison across retailers
- Before/after photos (6-8)
- Links to all 5 products

---

## Tips for Success

1. **Match search intent** - Informational queries need guides, not sales pages
2. **Front-load value** - Put key information early for readers and snippets
3. **Use data and examples** - Specific beats generic every time
4. **Write for humans first** - SEO optimization should feel natural
5. **Include visual elements** - Break up text with images, tables, lists
6. **Update regularly** - Fresh content signals to search engines
7. **Answer questions readers have** - Use PAA questions from Google as H2/H3 headers
8. **Provide actionable advice** - Readers want steps they can follow
9. **Back claims with citations** - Every statistic needs a source
10. **Structure for scanners** - 50% of readers only scan; use formatting to help

## Reference Materials

- [Title Formulas](./references/title-formulas.md) - Proven headline formulas, power words, CTR patterns
- [Content Structure Templates](./references/content-structure-templates.md) - Templates for blog posts, comparisons, listicles, how-tos, pillar pages

## Related Skills

- [keyword-research](../../research/keyword-research/) — Find keywords to target
- [geo-content-optimizer](../geo-content-optimizer/) — Optimize for AI citations
- [meta-tags-optimizer](../meta-tags-optimizer/) — Create compelling meta tags
- [on-page-seo-auditor](../../optimize/on-page-seo-auditor/) — Audit SEO elements
- [content-quality-auditor](../../cross-cutting/content-quality-auditor/) — Full 80-item CORE-EEAT audit

