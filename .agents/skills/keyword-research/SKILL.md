---
name: keyword-research
description: This skill should be used when the user asks to "find keywords", "keyword
  research", "what should I write about", "keyword difficulty score", "search volume
  data", "identify ranking opportunities", "topic ideas", "what are people searching
  for", "which keywords to target", "content ideas for [topic]", or "long-tail keyword
  suggestions". Discovers high-value keywords with search intent classification (informational/commercial/transactional/navigational),
  keyword difficulty (KD) scoring, monthly search volume (MSV), CPC estimates, and
  AI citation potential. Produces ranked keyword lists, topic clusters with pillar
  + cluster page assignments, and priority-scored content calendars. Works with Ahrefs,
  SEMrush, Google Keyword Planner, Google Search Console, or manual data input. For
  competitor keyword gaps, see competitor-analysis. For topic coverage gaps, see content-gap-analysis.
version: 3.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
  - seo
  - research
  - analysis
  triggers:
  - keyword research
  - find keywords
  - keyword opportunities
  - search volume
  estimated-duration: Medium
  geo-relevance: high
---

# Keyword Research


> **[SEO & GEO Skills Library](https://skills.sh/aaron-he-zhu/seo-geo-claude-skills)** · 20 skills for SEO + GEO · Install all: `npx skills add aaron-he-zhu/seo-geo-claude-skills`

<details>
<summary>Browse all 20 skills</summary>

**Research** · **keyword-research** · [competitor-analysis](../competitor-analysis/) · [serp-analysis](../serp-analysis/) · [content-gap-analysis](../content-gap-analysis/)

**Build** · [seo-content-writer](../../build/seo-content-writer/) · [geo-content-optimizer](../../build/geo-content-optimizer/) · [meta-tags-optimizer](../../build/meta-tags-optimizer/) · [schema-markup-generator](../../build/schema-markup-generator/)

**Optimize** · [on-page-seo-auditor](../../optimize/on-page-seo-auditor/) · [technical-seo-checker](../../optimize/technical-seo-checker/) · [internal-linking-optimizer](../../optimize/internal-linking-optimizer/) · [content-refresher](../../optimize/content-refresher/)

**Monitor** · [rank-tracker](../../monitor/rank-tracker/) · [backlink-analyzer](../../monitor/backlink-analyzer/) · [performance-reporter](../../monitor/performance-reporter/) · [alert-manager](../../monitor/alert-manager/)

**Cross-cutting** · [content-quality-auditor](../../cross-cutting/content-quality-auditor/) · [domain-authority-auditor](../../cross-cutting/domain-authority-auditor/) · [entity-optimizer](../../cross-cutting/entity-optimizer/) · [memory-management](../../cross-cutting/memory-management/)

</details>

Discovers, analyzes, and prioritizes keywords for SEO and GEO content strategies. Identifies high-value opportunities based on search volume, competition, intent, and business relevance.

## When to Use This Skill

- Starting a new content strategy or campaign
- Expanding into new topics or markets
- Finding keywords for a specific product or service
- Identifying long-tail keyword opportunities
- Understanding search intent for your industry
- Planning content calendars
- Researching keywords for GEO optimization

## What This Skill Does

1. **Keyword Discovery**: Generates comprehensive keyword lists from seed terms
2. **Intent Classification**: Categorizes keywords by user intent (informational, navigational, commercial, transactional)
3. **Difficulty Assessment**: Evaluates competition level and ranking difficulty
4. **Opportunity Scoring**: Prioritizes keywords by potential ROI
5. **Clustering**: Groups related keywords into topic clusters
6. **GEO Relevance**: Identifies keywords likely to trigger AI responses

## How to Use

### Basic Keyword Research

```
Research keywords for [topic/product/service]
```

```
Find keyword opportunities for a [industry] business targeting [audience]
```

### With Specific Goals

```
Find low-competition keywords for [topic] with commercial intent
```

```
Identify question-based keywords for [topic] that AI systems might answer
```

### Competitive Research

```
What keywords is [competitor URL] ranking for that I should target?
```

## Data Sources

> See [CONNECTORS.md](../../CONNECTORS.md) for tool category placeholders.

**With ~~SEO tool + ~~search console connected:**
Automatically pull historical search volume data, keyword difficulty scores, SERP analysis, current rankings from ~~search console, and competitor keyword overlap. The skill will fetch seed keyword metrics, related keyword suggestions, and search trend data.

**With manual data only:**
Ask the user to provide:
1. Seed keywords or topic description
2. Target audience and geographic location
3. Business goals (traffic, leads, sales)
4. Current domain authority (if known) or site age
5. Any known keyword performance data or search volume estimates

Proceed with the full analysis using provided data. Note in the output which metrics are from automated collection vs. user-provided data.

## Instructions

When a user requests keyword research:

1. **Understand the Context**

   Ask clarifying questions if not provided:
   - What is your product/service/topic?
   - Who is your target audience?
   - What is your business goal? (traffic, leads, sales)
   - What is your current domain authority? (new site, established, etc.)
   - Any specific geographic targeting?
   - Preferred language?

2. **Generate Seed Keywords**

   Start with:
   - Core product/service terms
   - Problem-focused keywords (what issues do you solve?)
   - Solution-focused keywords (how do you help?)
   - Audience-specific terms
   - Industry terminology

3. **Expand Keyword List**

   For each seed keyword, generate variations:
   
   ```markdown
   ## Keyword Expansion Patterns
   
   ### Modifiers
   - Best [keyword]
   - Top [keyword]
   - [keyword] for [audience]
   - [keyword] near me
   - [keyword] [year]
   - How to [keyword]
   - What is [keyword]
   - [keyword] vs [alternative]
   - [keyword] examples
   - [keyword] tools
   
   ### Long-tail Variations
   - [keyword] for beginners
   - [keyword] for small business
   - Free [keyword]
   - [keyword] software/tool/service
   - [keyword] template
   - [keyword] checklist
   - [keyword] guide
   ```

4. **Classify Search Intent**

   Categorize each keyword:

   | Intent | Signals | Example | Content Type |
   |--------|---------|---------|--------------|
   | Informational | what, how, why, guide, learn | "what is SEO" | Blog posts, guides |
   | Navigational | brand names, specific sites | "google analytics login" | Homepage, product pages |
   | Commercial | best, review, vs, compare | "best SEO tools [current year]" | Comparison posts, reviews |
   | Transactional | buy, price, discount, order | "buy SEO software" | Product pages, pricing |

5. **Assess Keyword Difficulty**

   Score each keyword (1-100 scale):

   ```markdown
   ### Difficulty Factors
   
   **High Difficulty (70-100)**
   - Major brands ranking
   - High domain authority competitors
   - Established content (1000+ backlinks)
   - Paid ads dominating SERP
   
   **Medium Difficulty (40-69)**
   - Mix of authority and niche sites
   - Some opportunities for quality content
   - Moderate backlink requirements
   
   **Low Difficulty (1-39)**
   - Few authoritative competitors
   - Thin or outdated content ranking
   - Long-tail variations
   - New or emerging topics
   ```

6. **Calculate Opportunity Score**

   Formula: `Opportunity = (Volume × Intent Value) / Difficulty`

   **Intent Value** assigns a numeric weight by search intent:
   - Informational = 1
   - Navigational = 1
   - Commercial = 2
   - Transactional = 3

   ```markdown
   ### Opportunity Matrix
   
   | Scenario | Volume | Difficulty | Intent | Priority |
   |----------|--------|------------|--------|----------|
   | Quick Win | Low-Med | Low | High | ⭐⭐⭐⭐⭐ |
   | Growth | High | Medium | High | ⭐⭐⭐⭐ |
   | Long-term | High | High | High | ⭐⭐⭐ |
   | Research | Low | Low | Low | ⭐⭐ |
   ```

7. **Identify GEO Opportunities**

   Keywords likely to trigger AI responses:
   
   ```markdown
   ### GEO-Relevant Keywords
   
   **High GEO Potential**
   - Question formats: "What is...", "How does...", "Why is..."
   - Definition queries: "[term] meaning", "[term] definition"
   - Comparison queries: "[A] vs [B]", "difference between..."
   - List queries: "best [category]", "top [number] [items]"
   - How-to queries: "how to [action]", "steps to [goal]"
   
   **AI Answer Indicators**
   - Query is factual/definitional
   - Answer can be summarized concisely
   - Topic is well-documented online
   - Low commercial intent
   ```

8. **Create Topic Clusters**

   Group keywords into content clusters:

   ```markdown
   ## Topic Cluster: [Main Topic]
   
   **Pillar Content**: [Primary keyword]
   - Search volume: [X]
   - Difficulty: [X]
   - Content type: Comprehensive guide
   
   **Cluster Content**:
   
   ### Sub-topic 1: [Secondary keyword]
   - Volume: [X]
   - Difficulty: [X]
   - Links to: Pillar
   - Content type: [Blog post/Tutorial/etc.]
   
   ### Sub-topic 2: [Secondary keyword]
   - Volume: [X]
   - Difficulty: [X]
   - Links to: Pillar + Sub-topic 1
   - Content type: [Blog post/Tutorial/etc.]
   
   [Continue for all cluster keywords...]
   ```

9. **Generate Output Report**

   Produce a report containing: Executive Summary, Top Keyword Opportunities (Quick Wins, Growth, GEO), Topic Clusters, Content Calendar, and Next Steps.

   > **Reference**: See [references/example-report.md](./references/example-report.md) for the full report template and example.

## Validation Checkpoints

### Input Validation
- [ ] Seed keywords or topic description clearly provided
- [ ] Target audience and business goals specified
- [ ] Geographic and language targeting confirmed
- [ ] Domain authority or site maturity level established

### Output Validation
- [ ] Every recommendation cites specific data points (not generic advice)
- [ ] Search volume and difficulty scores included for each keyword
- [ ] Keywords grouped by intent and mapped to content types
- [ ] Topic clusters show clear pillar-to-cluster relationships
- [ ] Source of each data point clearly stated (~~SEO tool data, user-provided, or estimated)

## Example

> **Reference**: See [references/example-report.md](./references/example-report.md) for a complete example report for "project management software for small businesses".

### Advanced Usage

- **Intent Mapping**: `Map all keywords for [topic] by search intent and funnel stage`
- **Seasonal Analysis**: `Identify seasonal keyword trends for [industry]`
- **Competitor Gap**: `What keywords do [competitor 1], [competitor 2] rank for that I'm missing?`
- **Local Keywords**: `Research local keywords for [business type] in [city/region]`

## Real-World Examples

### Example 1: SaaS B2B — Project Management Software for Small Teams

**Seed Keywords**: project management, team collaboration, task management

**Keyword Expansion by Intent**:

| Informational | Commercial | Transactional | GEO |
|---|---|---|---|
| What is agile project management | Best project management tools 2024 | Project management software free trial | How does project management work |
| How to manage remote teams | Top 10 project management platforms | Buy project management software | Project management definition |
| Agile vs Waterfall | Asana vs Monday vs Trello | Pricing for team collaboration | What does a project manager do |
| How to use Gantt charts | Project management tools for SMBs | Start free project management tool | Project management frameworks |

**Opportunity Scoring**:
- "project management software" (Volume: 18K, KD: 72) → Lower priority (high difficulty)
- "project management for small teams" (Volume: 1.2K, KD: 35) → High priority (volume × 2 / 35 = 0.068)
- "how to manage a remote team" (Volume: 2.8K, KD: 22) → Very high priority (2.8K × 1 / 22 = 0.127)
- "project management software free" (Volume: 850, KD: 18) → Quick win (0.85K × 3 / 18 = 0.141)

**Recommended Content Cluster**:
- **Pillar**: "The Complete Guide to Project Management for Small Teams" (2500+ words)
  - Internal links to all cluster articles
  - Covers frameworks (Agile, Kanban, Scrum), tools, best practices

- **Cluster 1**: "How to Manage a Remote Team" (1200 words, "how to" intent)
- **Cluster 2**: "Best Project Management Tools for Remote Teams" (1500 words, commercial intent)
- **Cluster 3**: "Agile vs Waterfall: Which Framework is Right for You" (1000 words, comparison)
- **Cluster 4**: "Project Management Tools Free Trial Guide" (800 words, transactional intent)

---

### Example 2: E-commerce — Pet Grooming Products

**Seed Keywords**: pet grooming, dog grooming, cat grooming

**Keyword Clustering**:

| Category | Volume | KD | Priority | Example |
|---|---|---|---|---|
| Product-specific | 2.1K | 45 | High | Best dog grooming clippers for thick coat |
| Use-case | 890 | 28 | Very High | How to groom a dog at home |
| Problem-focused | 1.2K | 19 | Very High | Dog tangles and matting solutions |
| Local + product | 320 | 8 | Quick win | Dog grooming supplies near me |
| Tutorial | 450 | 15 | High | Step-by-step guide to grooming a German Shepherd |

**Content Plan**:
- Target quick wins first (low KD, any volume)
- Build authority with problem-focused content (tangles, shedding, odor)
- Create how-to guides with product recommendations (monetization via affiliate links)
- Develop product comparison content (grooming clippers, shampoos, tools)

---

### Example 3: Local Service — Dentist Practice in Austin, TX

**Geographic + Service Keywords**:

| Type | Keyword | Volume | Intent | Strategy |
|---|---|---|---|---|
| Local branded | Dentist near me Austin | 1.8K | Commercial | High priority — immediate intent |
| Local + service | Best cosmetic dentist Austin | 420 | Commercial | Service page + local content |
| Problem-focused | Teeth whitening options | 2.2K | Informational | Blog post, then CTA to booking |
| Question-based | How long do veneers last | 680 | Informational | FAQ targeting, featured snippet |
| Procedure-specific | Root canal pain management | 890 | Informational/Commercial | Hybrid content (education + CTA) |

**Local SEO Content Strategy**:
- Create service pages for each procedure (root canals, cleanings, whitening)
- Build neighborhood authority with "Best Dentist in [Neighborhood]" content
- FAQ blog posts targeting "How long does [procedure] take?" style queries
- Local schema markup on every page (LocalBusiness, Dental Practice)

---

## Frameworks

### Keyword Classification Framework

Use this to categorize and prioritize keywords systematically:

```
KEYWORD CLASSIFICATION MATRIX

1. INTENT SCORING (1-3 points)
   High (3) = Transactional/Commercial (buyer intent)
   Medium (2) = Commercial (comparison/research)
   Low (1) = Informational (learning only)

2. VOLUME SCORING (1-3 points based on search volume)
   High (3) = 5,000+ monthly searches
   Medium (2) = 500-5,000 monthly
   Low (1) = <500 monthly

3. DIFFICULTY SCORING (Reverse 1-3 scale, high is good)
   Easy (3) = KD 0-29
   Medium (2) = KD 30-69
   Hard (1) = KD 70+

4. RELEVANCE SCORING (1-3 points)
   High (3) = Perfect match for your product/service
   Medium (2) = Related but tangential
   Low (1) = Barely related

PRIORITY = (Intent + Volume + Difficulty + Relevance) / 4
```

**Action Thresholds**:
- Score 3.0+ = Top priority (Quick wins)
- Score 2.5-2.9 = Secondary priority (Growth opportunities)
- Score 2.0-2.4 = Long-term (Authority building)
- Score <2.0 = Skip or deprioritize

### Keyword Clustering Framework (CORE Model)

```
KEYWORD CLUSTER STRUCTURE

CORE INTENT = What does the searcher fundamentally want?
└─ Define this first before clustering

OPPORTUNITY GAPS = Which intents do you own?
└─ Map to your content inventory

RANKING POTENTIAL = Can you win these keywords?
└─ Score each keyword's ranking feasibility

EXPANSION PATHS = How do keywords interconnect?
└─ Create internal linking map
```

**Step-by-step clustering process**:
1. List all keywords for your topic
2. Group by primary intent (informational / commercial / transactional)
3. Within each intent group, identify sub-clusters by topic angle
4. Score each keyword by opportunity
5. Assign content type (blog post, product page, comparison, FAQ, etc.)
6. Design internal linking from low-volume to high-volume keywords

---

## Common Patterns

| Pattern | Signals | Volume | Difficulty | Strategy |
|---|---|---|---|---|
| "What is [X]" | Definitional, high AI potential | Varies | Usually low | Blog post targeting featured snippet |
| "[X] for [audience]" | Long-tail, specific use-case | Low-Med | Low | Best for niche targeting |
| "Best [X] for [use-case]" | High commercial intent | Med-High | High | Create comparison/roundup post |
| "[X] vs [Y]" | Comparison, consideration stage | Low-Med | Low-Med | Comparison post with pros/cons |
| "How to [action]" | Tutorial, implementational | High | Low-Med | Step-by-step guide, video potential |
| "[X] near me" | Local intent, geo-dependent | Varies | Low | Local SEO + service pages |
| "[X] alternatives" | Intent to switch, high-value | Med | Med | Competitive analysis content |
| "[X] free [qualifier]" | Free-tier seeking, price-sensitive | Low-Med | Low | Freemium product landing page |
| "[X] [year]" | Freshness bias, trends | Low | Low-Med | Annual roundup content |
| "Why is [X]" | Educational, trust-building | Low | Low | Blog post, builds authority |

---

## Tips for Success

1. **Start with seed keywords** that describe your core offering, then expand systematically
2. **Don't ignore long-tail** — they often have highest conversion rates and easiest ranking path
3. **Match content to intent** — informational queries need guides, not sales pages (conversion won't happen)
4. **Group into clusters** for topical authority (boosts hub page and all spokes)
5. **Prioritize quick wins** to build momentum and credibility (low KD + decent volume)
6. **Include GEO keywords** in your strategy for AI visibility (definitions, how-to, why questions)
7. **Review quarterly** — keyword dynamics change over time, new opportunities emerge
8. **Use the prioritization formula** — (Volume × Intent Value) / Difficulty gives you objective ranking
9. **Create a keyword bank** — track keywords you rank for, keyword gaps, and trending queries
10. **Test keyword assumptions** — what you think people search for often differs from reality; validate with tools or GSC data

---

## Success Metrics

**How to validate your keyword research worked**:

| Metric | Target | Timeline | How to Measure |
|---|---|---|---|
| Content Rankings | 50%+ of cluster keywords rank top 10 | 2-3 months | Monthly rank tracking |
| Organic Traffic | 30%+ increase from keyword-targeted content | 3-6 months | Google Analytics |
| Intent Alignment | 80%+ of visitors engage with CTA | 1 month | Behavior metrics (scroll depth, CTA clicks) |
| Long-tail Performance | Long-tail keywords drive 40%+ of volume | 3+ months | Search Console keyword analysis |
| Cluster Authority | Hub page ranks for primary keyword | 4-6 months | SERP position for pillar keyword |
| AI Citations | Cluster content cited in AI responses | 2-3 months | Manual testing of GEO queries |
| Conversion Rate | Keywords with high intent close at 2x+ rate | Ongoing | Track by keyword in analytics |
| Topic Authority | Domain authority increases 5+ points | 6-12 months | Ahrefs, SEMrush DA tracking |

---

## Industry-Specific Keyword Research Examples

### SaaS: Project Management Software Research

**Seed Keywords** (starting point):
- project management
- team collaboration tools
- task management software

**Keyword expansion by category**:

**Informational (Awareness stage)**:
- What is agile project management
- How to manage remote teams
- Project management frameworks
- Agile vs Waterfall vs Scrum
- Project management best practices 2024

**Commercial (Consideration stage)**:
- Best project management tools
- Top project management software
- Project management tools for small teams
- Project management tools for designers
- Asana vs Monday vs Jira vs ClickUp

**Transactional (Decision stage)**:
- Project management software free trial
- Project management tool pricing
- Buy project management software
- Free project management tools
- Asana pricing vs Monday pricing

**GEO (AI Answer potential)**:
- What is project management
- How does project management work
- Why do teams need project management
- Project management definition
- Benefits of project management

**Keyword Prioritization Output**:

| Keyword | Volume | KD | Intent | Priority | Strategy |
|---|---|---|---|---|---|
| project management | 18K | 78 | Commercial | ⭐⭐ | Brand awareness; target via related keywords |
| how to manage remote teams | 2.8K | 22 | Informational | ⭐⭐⭐⭐⭐ | QUICK WIN — blog post, builds authority |
| project management software free | 850 | 18 | Transactional | ⭐⭐⭐⭐⭐ | QUICK WIN — free tier landing page |
| project management for small teams | 1.2K | 35 | Commercial | ⭐⭐⭐⭐ | GROWTH — product page + case studies |
| agile project management | 4.2K | 55 | Informational | ⭐⭐⭐ | AUTHORITY — comprehensive guide |
| Asana alternative | 290 | 28 | Commercial | ⭐⭐⭐⭐ | Comparison post; capture switchers |

---

### E-commerce: Pet Grooming Products Research

**Seed Keywords**:
- dog grooming
- pet grooming tools
- pet grooming supplies

**Keyword Clustering by Search Intent**:

**Problem-focused** (highest conversion potential):
- How to groom a dog at home
- Dog grooming for thick coats
- Pet grooming for matted fur
- Dog shedding solutions
- Pet grooming for sensitive skin

**Product-specific**:
- Best dog grooming clippers
- Top rated dog grooming scissors
- Slicker brush for dogs
- Dog grooming glove pros and cons
- Best undercoat rake for double coated dogs

**Use-case specific**:
- Dog grooming for Goldendoodles
- How to groom a husky
- Grooming guide for long haired cats
- Quick dog grooming routine
- Professional dog grooming tips

**Affiliate/Review potential**:
- Best dog grooming clippers reviews
- Dog grooming kit comparison
- FURminator vs similar tools
- Most durable dog grooming shears

**Content Plan**:

1. **Target quick wins first** (low KD, decent volume)
   - "How to groom a dog at home" → 1200 words + video
   - "Dog grooming for [breed]" → Multiple breed-specific posts
   - Product buying guides (clippers, brushes, shears)

2. **Build authority content**
   - "Complete dog grooming guide" → 3000+ word pillar
   - Detailed breed grooming requirements
   - Problem-solution content (matting, shedding, etc.)

3. **Monetization content**
   - Product roundups with affiliate links
   - Comparison posts (tool A vs Tool B)
   - Brand reviews (high product volume)

---

### Local Service: Dentist Practice Research

**Geographic + Service Keywords**:

**Local commercial intent** (immediate value):
- Dentist near me
- Cosmetic dentist Austin
- Emergency dentist near me
- Best dentist in Austin
- Teeth whitening Austin

**Informational with local intent**:
- How long do dental implants last Austin
- Root canal pain management
- Teeth whitening options
- Cost of dental implants Austin
- Recovery time after oral surgery

**Procedure-specific** (buyer consideration):
- Teeth whitening procedures Austin
- Dental implants cost Austin
- Invisalign vs braces Austin
- Smile makeover dentist Austin
- Veneers cost Austin

**Keyword Priority Matrix**:

| Keyword | Volume | Intent | Local Pack Difficulty | Strategy |
|---|---|---|---|---|
| Dentist Austin | 1.8K | High | High (1-3) | Defend via Google Business Profile optimization |
| Cosmetic dentist Austin | 420 | High | Medium | Create detailed service page + blog |
| Emergency dentist near me | 890 | Very High | Low | Capture immediate need queries |
| Teeth whitening Austin | 2.2K | Informational | Medium | Blog + service page combo |
| Best cosmetic dentist reviews Austin | 180 | Commercial | Low | Testimonial-focused content |

**Content Architecture**:
- Service pages: Each procedure gets optimized service page + blog post
- FAQ pages: "How long does [procedure] last," "Is [procedure] painful," "Cost of [procedure]"
- Location pages: If expanding to multiple neighborhoods
- Blog: Educational content + local authority building

---

## Reference Materials

- [Keyword Intent Taxonomy](./references/keyword-intent-taxonomy.md) — Complete intent classification with signal words and content strategies
- [Topic Cluster Templates](./references/topic-cluster-templates.md) — Hub-and-spoke architecture templates for pillar and cluster content
- [Keyword Prioritization Framework](./references/keyword-prioritization-framework.md) — Priority scoring matrix, categories, and seasonal keyword patterns
- [Example Report](./references/example-report.md) — Complete example keyword research report for project management software

## Related Skills

- [competitor-analysis](../competitor-analysis/) — See what keywords competitors rank for
- [content-gap-analysis](../content-gap-analysis/) — Find missing keyword opportunities
- [seo-content-writer](../../build/seo-content-writer/) — Create content for target keywords
- [geo-content-optimizer](../../build/geo-content-optimizer/) — Optimize for AI citations
- [rank-tracker](../../monitor/rank-tracker/) — Monitor keyword position changes over time

