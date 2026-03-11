---
name: competitor-analysis
description: This skill should be used when the user asks to "analyze competitors",
  "competitor SEO", "who ranks for", "competitive analysis", "what are my competitors
  doing", "what are they doing differently", "why do they rank higher", or "spy on
  competitor SEO". Analyzes competitor SEO and GEO strategies including their ranking
  keywords, content approaches, backlink profiles, and AI citation patterns. Reveals
  opportunities to outperform competition. For content-focused gap analysis, see content-gap-analysis.
  For link profile specifics, see backlink-analyzer.
version: 3.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
  - research
  - analysis
  - strategy
  triggers:
  - analyze competitors
  - competitor research
  - competitive landscape
  estimated-duration: Comprehensive
  geo-relevance: medium
---

# Competitor Analysis


> **[SEO & GEO Skills Library](https://skills.sh/aaron-he-zhu/seo-geo-claude-skills)** · 20 skills for SEO + GEO · Install all: `npx skills add aaron-he-zhu/seo-geo-claude-skills`

<details>
<summary>Browse all 20 skills</summary>

**Research** · [keyword-research](../keyword-research/) · **competitor-analysis** · [serp-analysis](../serp-analysis/) · [content-gap-analysis](../content-gap-analysis/)

**Build** · [seo-content-writer](../../build/seo-content-writer/) · [geo-content-optimizer](../../build/geo-content-optimizer/) · [meta-tags-optimizer](../../build/meta-tags-optimizer/) · [schema-markup-generator](../../build/schema-markup-generator/)

**Optimize** · [on-page-seo-auditor](../../optimize/on-page-seo-auditor/) · [technical-seo-checker](../../optimize/technical-seo-checker/) · [internal-linking-optimizer](../../optimize/internal-linking-optimizer/) · [content-refresher](../../optimize/content-refresher/)

**Monitor** · [rank-tracker](../../monitor/rank-tracker/) · [backlink-analyzer](../../monitor/backlink-analyzer/) · [performance-reporter](../../monitor/performance-reporter/) · [alert-manager](../../monitor/alert-manager/)

**Cross-cutting** · [content-quality-auditor](../../cross-cutting/content-quality-auditor/) · [domain-authority-auditor](../../cross-cutting/domain-authority-auditor/) · [entity-optimizer](../../cross-cutting/entity-optimizer/) · [memory-management](../../cross-cutting/memory-management/)

</details>

This skill provides comprehensive analysis of competitor SEO and GEO strategies, revealing what's working in your market and identifying opportunities to outperform the competition.

## When to Use This Skill

- Entering a new market or niche
- Planning content strategy based on competitor success
- Understanding why competitors rank higher
- Finding backlink and partnership opportunities
- Identifying content gaps competitors are missing
- Analyzing competitor AI citation strategies
- Benchmarking your SEO performance

## What This Skill Does

1. **Keyword Analysis**: Identifies keywords competitors rank for
2. **Content Audit**: Analyzes competitor content strategies and formats
3. **Backlink Profiling**: Reviews competitor link-building approaches
4. **Technical Assessment**: Evaluates competitor site health
5. **GEO Analysis**: Identifies how competitors appear in AI responses
6. **Gap Identification**: Finds opportunities competitors miss
7. **Strategy Extraction**: Reveals actionable insights from competitor success

## How to Use

### Basic Competitor Analysis

```
Analyze SEO strategy for [competitor URL]
```

```
Compare my site [URL] against [competitor 1], [competitor 2], [competitor 3]
```

### Specific Analysis

```
What content is driving the most traffic for [competitor]?
```

```
Analyze why [competitor] ranks #1 for [keyword]
```

### GEO-Focused Analysis

```
How is [competitor] getting cited in AI responses? What can I learn?
```

## Data Sources

> See [CONNECTORS.md](../../CONNECTORS.md) for tool category placeholders.

**With ~~SEO tool + ~~analytics + ~~AI monitor connected:**
Automatically pull competitor keyword rankings, backlink profiles, top performing content, domain authority metrics from ~~SEO tool. Compare against your site's metrics from ~~analytics and ~~search console. Check AI citation patterns for both your site and competitors using ~~AI monitor.

**With manual data only:**
Ask the user to provide:
1. Competitor URLs to analyze (2-5 recommended)
2. Your own site URL and current metrics (traffic, rankings if known)
3. Industry or niche context
4. Specific aspects to focus on (keywords, content, backlinks, etc.)
5. Any known competitor strengths or weaknesses

Proceed with the full analysis using provided data. Note in the output which metrics are from automated collection vs. user-provided data.

## Instructions

When a user requests competitor analysis:

1. **Identify Competitors**

   If not specified, help identify competitors:
   
   ```markdown
   ### Competitor Identification Framework
   
   **Direct Competitors** (same product/service)
   - Search "[your main keyword]" and note top 5 organic results
   - Check who's advertising for your keywords
   - Ask: Who do customers compare you to?
   
   **Indirect Competitors** (different solution, same problem)
   - Search problem-focused keywords
   - Look at alternative solutions
   
   **Content Competitors** (compete for same keywords)
   - May not sell same product
   - Rank for your target keywords
   - Include media sites, blogs, aggregators
   ```

2. **Gather Competitor Data**

   Collect for each competitor: URL, domain age, estimated traffic, domain authority, business model, target audience, and key offerings.

3. **Analyze Keyword Rankings**

   Document total keywords ranking, top 10/top 3 counts, top performing keywords (with position, volume, traffic, page URL), keyword distribution by intent, and keyword gaps.

4. **Audit Content Strategy**

   Analyze content volume by type, top performing content, content patterns (word count, frequency, formats), content themes, and success factors.

5. **Analyze Backlink Profile**

   Review total backlinks, referring domains, link quality distribution, top linking domains, link acquisition patterns, and linkable assets.

6. **Technical SEO Assessment**

   Evaluate Core Web Vitals, mobile-friendliness, site architecture, internal linking quality, URL structure, and technical strengths/weaknesses.

7. **GEO/AI Citation Analysis**

   Test competitor content in AI systems: document which queries cite them, GEO strategies observed (definitions, statistics, Q&A, authority signals), and GEO opportunities they are missing.

8. **Synthesize Competitive Intelligence**

   Produce a final report with: Executive Summary, Competitive Landscape comparison table, CITE domain authority comparison, Strengths to Learn From, Weaknesses to Exploit, Keyword Opportunities, Content Strategy Recommendations, and Action Plan (Immediate / Short-term / Long-term).

   > **Reference**: See [references/analysis-templates.md](./references/analysis-templates.md) for detailed templates for each step.

## Validation Checkpoints

### Input Validation
- [ ] Competitor URLs verified as relevant to your niche
- [ ] Analysis scope defined (comprehensive or specific focus area)
- [ ] Your own site metrics available for comparison
- [ ] Minimum 2-3 competitors identified for meaningful patterns

### Output Validation
- [ ] Every recommendation cites specific data points (not generic advice)
- [ ] Competitor strengths backed by measurable evidence (metrics, rankings)
- [ ] Opportunities based on identifiable gaps, not assumptions
- [ ] Action plan items are specific and actionable (not vague strategies)
- [ ] Source of each data point clearly stated (~~SEO tool data, ~~analytics data, ~~AI monitor data, user-provided, or estimated)

## Example

> **Reference**: See [references/example-report.md](./references/example-report.md) for a complete example analyzing HubSpot's marketing keyword dominance.

## Advanced Analysis Types

### Content Gap Analysis

```
Show me content [competitor] has that I don't, sorted by traffic potential
```

### Link Intersection

```
Find sites linking to [competitor 1] AND [competitor 2] but not me
```

### SERP Feature Analysis

```
What SERP features do competitors win? (Featured snippets, PAA, etc.)
```

### Historical Tracking

```
How has [competitor]'s SEO strategy evolved over the past year?
```

## Real-World Examples

### Example 1: SaaS Project Management (Asana vs Competitors)

**Competitors Identified**:
- Direct: Monday.com, Trello, Jira
- Indirect: Notion, Basecamp, ClickUp
- Content: HubSpot, Forbes (roundup articles)

**Competitive Keyword Analysis**:

| Keyword | Asana Rank | Monday Rank | Your Rank | Opportunity |
|---|---|---|---|---|
| Project management software | #7 | #5 | Not ranking | Build authority content |
| Agile project management | #4 | #2 | #12 | Target long-tail alternatives |
| Project management for designers | #2 | #8 | #6 | Defensive — maintain position |
| Asana alternative | #3 | N/A | N/A | Comparison post opportunity |
| Best project tools 2024 | #6 | #3 | #11 | Update roundup content |

**Content Gap Analysis**:
- Asana publishes 15+ posts/month on product updates, customer success stories, and industry trends
- Monday.com focuses heavily on template libraries (80+ templates, highly searchable)
- You've published 4 posts in same period — content velocity gap

**Link Acquisition Patterns**:
- Asana backlinks: Many from productivity blogs, business publications, YouTube tutorials
- Linking sources you're missing: Industry association sites, community forums, SaaS directories
- Opportunity: Reach out to 20 top linking sites about your unique angle

**Backlink Profile Comparison**:

| Site | Asana | Monday | You | Gap |
|---|---|---|---|---|
| Referring domains | 8,423 | 7,156 | 312 | -8,100+ domains |
| Domain authority (avg) | 62 | 58 | 42 | Asana ahead but gap is closable |
| Top linking sources | ProductHunt, G2, LinkedIn | Tech blogs, YouTube | Local blogs only | Expand reach to publications |

**Strategy to Compete**:
1. Create 1 authoritative pillar per quarter (vs. monthly churn)
2. Build relationships with 30 SaaS review sites (G2, Capterra, etc.)
3. Target 20+ long-tail keywords Asana/Monday aren't covering
4. Create unique template library (not a copy, different angle)
5. Build case studies from your customer wins

---

### Example 2: E-commerce Beauty (Sephora's SEO Strategy)

**Competitive Landscape**:
- Direct e-comm: Ulta Beauty, Nykaa, Space NK
- Affiliate/review: Byrdie, StyleCaster, Refinery29
- Social/influencer: TikTok, Instagram, YouTube reviews

**Keyword Ownership Analysis**:

| Query Type | Sephora | Ulta | Review Sites | You |
|---|---|---|---|---|
| "Best foundation for [skin type]" | Ranks with blog | Ranks with product | Rank #1 (#2-3) | Opportunity: Create 5 foundation guides |
| "[Brand] vs [Brand]" | Low | Low | Rank #1 | Create comparison content (best ROI) |
| "How to apply [makeup]" | Ranks in shopping | Ranks video | YouTube dominates | Shoot YouTube tutorials, embed |
| "[Product] review" | Product page ranks | Product page ranks | Blog reviews rank higher | Influencer content strategy |

**Content Strategy Comparison**:
- Sephora: Product-centric (optimizes product pages, limited blog)
- Ulta: More editorial (guides, trend reports, expert advice)
- Byrdie: Authority guides with affiliate links

**Your Competitive Advantage**: You can publish faster, more nimble than Sephora, more specialized than Byrdie.

**Tactical Opportunities**:
1. Create 15 "Best [Product Type] for [Skin Type]" guides (Sephora doesn't optimize these well)
2. Video content for tutorial searches (YouTube, embedded on site)
3. Influencer partnerships for review content and backlinks
4. Niche community content (specific skin conditions: eczema, rosacea, acne)

---

### Example 3: Local Service (Dentist Practice)

**Competitive Analysis in Austin, TX**:

| Competitor | Reviews | DA | Website Quality | Content | Backlinks | Gap |
|---|---|---|---|---|---|---|
| Smile Dental (Direct) | 4.8/5 (324) | 32 | Good UX | 20 blog posts | 45 local | No social proof |
| Austin Dental Arts | 4.6/5 (156) | 28 | Basic | No blog | 12 local | Weak SEO |
| Pearl District Dental | 4.9/5 (98) | 24 | Excellent | 8 blog posts | 8 local | High review quality |

**Ranking Comparison**:

| Local Keyword | Your Rank | Smile Dental | ADC | Opportunity |
|---|---|---|---|---|
| Dentist Austin | #4 (pack) | #1 | #2 | Smile has better reviews, content, links |
| Cosmetic dentist Austin | Not ranking | #2 | Not ranking | Create service page + guide |
| Teeth whitening Austin | #7 | #3 | Not ranking | High-value service page |
| Orthodontist near me | Not ranking | #1 | #5 | Niche opportunity (if you offer it) |
| Emergency dentist Austin | #12 | Not ranking | #6 | Capitalize on their gap |

**Strategy to Beat Smile Dental**:
1. Generate 50+ new reviews (they have 324, you have 45) — ask every patient
2. Publish 20 blog posts (match their content volume)
3. Build local citations (10+ directories they're not on)
4. Develop more comprehensive service pages with before/after photos
5. Video testimonials from happy patients (beat their text reviews)

---

## Analysis Frameworks

### Competitive Positioning Framework (3×3 Matrix)

Plot competitors on two key dimensions relevant to your niche:

**For SaaS**:
```
           Ease of Use
              (Low → High)
Cost
(Low)    B          A
         |      Ideal zone
         |    (Easy + Cheap)
(High)   C          D
```

**For E-commerce**:
```
           Selection
              (Low → High)
Price
(Low)    B          A
         |      Customer sweet spot
         |
(High)   C          D
```

**For Local Services**:
```
           Availability
              (Low → High)
Quality
(Low)    C          B
         |      Your target
         |    (Quality + Available)
(High)   D          A
```

Use this to identify your white space — where are competitors NOT positioned?

---

### Competitive Keyword Intersection Analysis

```
VENN DIAGRAM APPROACH:

Keywords YOU rank for
  → Keywords BOTH you and competitors rank for
    → Keywords COMPETITORS rank for (you don't)
      → Keywords NO ONE ranks for (opportunity gaps)

CALCULATION:
- If 3 competitors rank for keyword X and you don't → HIGH PRIORITY
- If you rank for X and they don't → DEFENSIBLE ADVANTAGE
- If all rank for X → CROWDED (only target if high volume/intent)
- If none rank for X → VALIDATE before investing (might be low demand)
```

### Content Quality Comparison Checklist

When analyzing competitor content, score on:

| Dimension | Score (1-5) | Your Gap | Notes |
|---|---|---|---|
| **Comprehensiveness** | How thorough is the article? | —— | Word count, section depth, examples |
| **Data Density** | How many stats/citations? | —— | Count exact data points |
| **User Experience** | Formatting, scanability, visuals | —— | Images, videos, tables, lists |
| **Topical Authority** | Does it reference related topics? | —— | Internal links, related reading |
| **Freshness** | Publication date, recent updates | —— | Does it feel current? |
| **Unique Angle** | Original insight vs. standard advice | —— | Is it just a rehash? |
| **CTA Clarity** | Clear conversion action | —— | What should reader do next? |

**How to use**: If competitor scores 5 on all dimensions and you score 3, you need to improve 2+ areas to outrank them.

---

## Common Patterns in Competitor Strategies

| Strategy | When to Use | Red Flags | Opportunities |
|---|---|---|---|
| Heavy content marketing (20+ posts/month) | Established competitors with resource teams | Inconsistent quality, thin posts | Out-quality not out-quantity — 5 pillar posts |
| Heavy PPC investment | High-intent keywords | Traffic fleeting, relies on budget | Target underserved niches they haven't bid on |
| SEO + social integration | Established brands with social following | Hard to replicate follower base | Start with niche communities where you can win |
| Link acquisition (PR, partnerships) | Authority plays | Expensive, takes time | Build grassroots links from micro-influencers |
| Product-page SEO only | E-commerce heavy | Missing organic traffic opportunities | Blog strategy can capture 30%+ additional traffic |
| Local-first (citations, reviews) | Service-based businesses | Hard to scale beyond local | If national, you can own multiple regions |
| YouTube / video-first | High consideration time, tutorials | Requires production resources, talent | Start with blog + embedded video hybrid |

---

## Tips for Success

1. **Analyze 3-5 competitors** for comprehensive view (1 dominant, 2 growing, 1-2 niche)
2. **Include indirect competitors** — they often have innovative approaches or underserved audiences
3. **Look beyond rankings** — analyze content quality, user experience, backlink profile, brand reputation
4. **Study their failures** — what content underperforms? What pages have high bounce rates?
5. **Monitor regularly** — competitor strategies evolve (quarterly reviews minimum)
6. **Focus on actionable insights** — "they have more backlinks" is not actionable; "they link from 10 review sites we're not on" is
7. **Find the white space** — where are they NOT positioned? That's your opportunity
8. **Create comparative content** — "[Competitor] vs Me" positions you as the better choice
9. **Track their new launches** — when competitors launch new content/features, that signals demand
10. **Build your own moat** — find something competitors can't easily copy (unique data, process, community)

---

## Success Metrics

**How to know if your competitive strategy is working**:

| Metric | Target | Timeline | How to Measure |
|---|---|---|---|
| Keyword share | Win 30% more keywords than month 1 | Monthly | Rank tracker or Search Console |
| Traffic share | Grow organic traffic 2x faster than top competitor | 3 months | Google Analytics vs. SEMrush estimates |
| Content comparison | Create content better than 80% of top 5 in SERP | Per piece | Run competitor content audit after publish |
| Ranking positions | Move top 3 keywords into top 5 | 2-3 months | Weekly rank tracking |
| Backlink growth | Gain backlinks from sources competitors use | Monthly | Ahrefs or SEMrush backlink audit |
| Review/social proof | Win 2x more reviews than nearest competitor | Quarterly | Google Reviews, Trustpilot counts |
| Brand mentions | Increase brand mentions 50% year-over-year | 6-12 months | Brand monitoring tools |
| Market share signals | Estimate revenue/traffic share increasing | Quarterly | Public data, estimated metrics |

---

## Competitive Positioning Template

When analyzing competitors, position them on a 2x2 matrix relevant to your market:

**SaaS Example** (Ease vs Cost):
```
          Easy to Use
           (Low→High)
Cost   B(Hard+Exp)  A(Easy+Cheap)  ← Your target
(Low)       |         Ideal zone
           |
(High)  C(Hard+Exp)  D(Easy+Exp)
```

**E-commerce Example** (Selection vs Price):
```
         Wide Selection
           (Low→High)
Price  B(Narrow+High) A(Wide+Cheap)  ← Customer preference
(Low)        |         Your advantage
            |
(High) C(Narrow+High) D(Wide+High)
```

**Local Service Example** (Quality vs Availability):
```
         Available Hours
           (Limited→24/7)
Quality C(Poor+Limited)  B(Poor+Available)
(Low)        |
            |
(High)  D(Great+Limited) A(Great+Available)  ← Target zone
```

**How to use**: Plot competitors and yourself. Your white space (where no competitor is) = your opportunity.

---

## Content Quality Comparison Framework

When analyzing competitor content, score across these dimensions:

| Dimension | Scoring (1-5) | What to Check | Example Fix |
|---|---|---|---|
| **Comprehensiveness** | How thorough? | Word count, section depth, examples | If they have 10 sections, you need 12+ |
| **Data Density** | How many stats/citations? | Count exact data points and sources | If avg article has 4 stats, include 6+ |
| **User Experience** | Formatting, scannability | Images, videos, tables, bullet lists | Add visual elements every 200 words |
| **Topical Authority** | Internal link depth | References to related topics | Add 5-10 contextual internal links |
| **Freshness** | Publication date, updates | Is content current or outdated? | If they're 2+ years old, you have advantage |
| **Unique Angle** | Original insight vs rehash | Is this just rewritten content? | Add proprietary data/framework |
| **CTA Clarity** | Conversion action | Is next step obvious? | Add 3 strategic CTAs, not vague links |

**Example analysis**: If top competitor ranks with:
- 3000 words, 5 sections, 3 images, 4 stats
- Published 18 months ago
- No internal links
- Generic CTA ("Learn more")

Your winning content should be:
- 3500+ words, 8+ sections, 8+ images/videos, 8+ stats with sources
- Current date + quarterly updates planned
- 12+ internal links to related content
- Specific CTAs: "Get [template]," "Try [free tool]," "See [case study]"

---

## Competitive Keyword Gap Analysis

### The Venn Diagram Approach

```
Your Rankings (100 keywords)
    ↓
    ├─ Keywords BOTH you and competitors rank for (35 keywords)
    │   → DEFEND THESE — don't lose ranking position
    │   → Improve to Top 3 if currently Top 10
    │
    ├─ Keywords YOU rank for but competitors don't (65 keywords)
    │   → MOAT — your advantages, protect and expand
    │   → Double down with related content
    │
    └─ Keywords competitors rank for but YOU don't (250 keywords)
        → OPPORTUNITIES — priority by volume + intent
        → If 3+ competitors rank for it → HIGH PRIORITY
        → If only 1-2 competitors rank for it → VALIDATE DEMAND
        → If 0 competitors rank for it → Might be low demand
```

**Actionable prioritization**:

| Scenario | Action | Example |
|---|---|---|
| 3+ competitors rank; you don't | IMMEDIATE PRIORITY | All rank for "best [product type]" → Create roundup |
| 1-2 competitors rank; you don't | RESEARCH | Only 1 competitor ranks for niche keyword → Is demand there? |
| You rank; no competitors | MOAT | You rank for "[Product] for [niche]" → Others don't see this market |
| Only you rank for it | EXPAND | Build related content cluster around this advantage |

---

## Link Acquisition Pattern Analysis

When analyzing competitor backlinks, look for patterns in WHERE they get links from:

**Typical competitor link sources**:
- Industry publications (TechCrunch, Forbes, Mashable)
- SaaS directories (G2, Capterra, ProductHunt)
- Educational institutions (university course recommendations)
- High-authority blogs (influencer blogs, thought leader sites)
- Community sites (Reddit, StackOverflow, Quora answers)
- Local/regional sites (chamber of commerce, local directories)
- Partnership networks (integrations, white labels, resellers)

**How to find YOUR link opportunities**:
1. List all domains linking to top 3 competitors
2. Identify 20 domains that link to them but NOT to you
3. Sort by domain authority
4. Identify link anchor patterns (what content got linked)
5. Reach out with better version of same content type

**Example**: If competitor got link from "50 Best SaaS Tools" blog post, you create "75 Best SaaS Tools" + reach out to same site.

---

## Reference Materials

- [Analysis Templates](./references/analysis-templates.md) — Detailed templates for each analysis step (profile, keywords, content, backlinks, technical, GEO, synthesis)
- [Battlecard Template](./references/battlecard-template.md) — Quick-reference competitive battlecard for sales and marketing teams
- [Positioning Frameworks](./references/positioning-frameworks.md) — Positioning maps, messaging matrices, narrative analysis, and differentiation frameworks
- [Example Report](./references/example-report.md) — Complete example analyzing HubSpot's marketing keyword dominance

## Related Skills

- [domain-authority-auditor](../../cross-cutting/domain-authority-auditor/) — Compare CITE domain authority scores across competitors for domain-level benchmarking
- [keyword-research](../keyword-research/) — Research keywords competitors rank for
- [content-gap-analysis](../content-gap-analysis/) — Find content opportunities
- [backlink-analyzer](../../monitor/backlink-analyzer/) — Deep-dive into backlinks
- [serp-analysis](../serp-analysis/) — Understand search result composition
- [memory-management](../../cross-cutting/memory-management/) — Store competitor data in project memory
- [entity-optimizer](../../cross-cutting/entity-optimizer/) — Compare entity presence against competitors

