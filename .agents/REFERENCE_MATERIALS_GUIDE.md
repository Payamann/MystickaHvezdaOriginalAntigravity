# Reference Materials Guide

**Version:** 1.0.0
**Purpose:** Guide for creating consistent reference materials across all skills

Each skill should have 2-3 reference files in a `references/` directory with detailed, actionable content.

---

## Reference File Types by Skill Category

### SEO Skills Reference Materials

#### For Research Skills (keyword-research, competitor-analysis, serp-analysis, content-gap-analysis)

**File 1: `keyword-classification-framework.md`**
- Keyword clusters by intent (informational, navigational, commercial, transactional)
- Keywords by funnel stage (awareness, consideration, decision)
- Real-world keyword grouping examples
- Template: Keyword clustering spreadsheet format

**File 2: `research-methodology.md`**
- Step-by-step process for the research
- Data sources and tools
- Quality gates and validation
- Common pitfalls and how to avoid them

**File 3: `case-studies.md`**
- 2-3 real-world research examples
- Industry-specific insights
- Results and impact metrics
- Lessons learned

#### For Technical SEO Skills (technical-seo-checker, on-page-seo-auditor, internal-linking-optimizer)

**File 1: `audit-checklist.md`**
- Comprehensive checklist organized by category
- Severity levels (critical/high/medium/low)
- How to test each item
- Pass/fail criteria

**File 2: `scoring-methodology.md`**
- How to calculate scores
- Weights for different categories
- Grade scale (A/B/C/D/F or 0-100)
- Benchmark data by site type

**File 3: `fix-priority-matrix.md`**
- Priority matrix template
- How to rank fixes (impact × effort)
- Implementation timeline suggestions
- Before/after examples

#### For Content Creation Skills (seo-content-writer, geo-content-optimizer, content-refresher)

**File 1: `content-frameworks-by-type.md`**
- Framework for blog posts (problem-solution format, listicle, how-to, pillar)
- Framework for product pages (benefits-features, comparison, social proof)
- Framework for landing pages (AIDA, PAS, problem-agitate-solve)
- Framework for location pages (service area, local keywords, trust signals)

**File 2: `content-templates.md`**
- Markdown templates for common content types
- Heading structure templates
- Section outline templates
- Word count targets by page type

**File 3: `content-examples.md`**
- Real examples organized by:
  - Industry (SaaS, ecommerce, local, agency)
  - Page type (blog, product, landing, location)
  - Quality level (good, excellent, exceptional)

#### For Strategy Skills (seo-plan, content-strategy, programmatic-seo)

**File 1: `strategy-templates.md`**
- Template for X-month plans (3, 6, 12 month)
- Phase breakdown templates
- Milestones and timelines
- Resource planning templates

**File 2: `industry-guides.md`**
- SaaS-specific strategy
- E-commerce-specific strategy
- Local service-specific strategy
- Agency-specific strategy

**File 3: `implementation-roadmaps.md`**
- Month-by-month task breakdowns
- Dependency mapping
- Quick-win identification
- Scale-up planning

---

### Marketing Skills Reference Materials

#### For Copywriting Skills (copywriting, email-sequence, cold-email, ad-creative)

**File 1: `copy-formulas.md`**
- Headline formulas (benefit, curiosity, question, how-to, etc.)
- Opening line formulas
- CTA button copy formulas
- Section header formulas

**File 2: `copy-examples.md`**
- Examples by channel (email, landing page, homepage, product page)
- Examples by goal (awareness, consideration, conversion, retention)
- A/B tested copy variations
- Real company examples (with permission)

**File 3: `voice-tone-guide.md`**
- Brand voice personality descriptors
- Tone variations by context (support vs. sales vs. educational)
- Vocabulary guidelines
- Do's and don'ts by brand type

#### For Campaign Skills (paid-ads, social-content, marketing-ideas)

**File 1: `campaign-framework.md`**
- Campaign structure and phases
- Message hierarchy
- Channel strategy (paid, organic, owned)
- Timeline and milestones

**File 2: `creative-templates.md`**
- Social post templates (Twitter, LinkedIn, Instagram)
- Email templates (nurture, promotional, educational)
- Ad copy templates (short-form, long-form)
- Visual direction guidelines

**File 3: `campaign-examples.md`**
- Real campaign examples
- Results and metrics
- Variations and A/B tests
- Industry-specific campaigns

#### For Sales/Growth Skills (sales-enablement, pricing-strategy, referral-program)

**File 1: `playbook.md`**
- Sales playbook or growth playbook
- Process steps
- Common objections and responses
- Success patterns

**File 2: `templates.md`**
- Email templates
- Pitch templates
- Pricing models comparison
- Program structure template

**File 3: `case-studies.md`**
- Real-world examples
- Results and metrics
- Implementation process
- Lessons learned

---

### CRO Skills Reference Materials

#### For Optimization Skills (page-cro, form-cro, signup-flow-cro, onboarding-cro)

**File 1: `optimization-framework.md`**
- Analysis framework (research → hypothesis → test → learn)
- Common CRO principles
- Prioritization matrix (impact × effort × confidence)
- Testing roadmap

**File 2: `pattern-library.md`**
- Common high-converting patterns
- Interaction patterns by element (buttons, forms, navigation)
- Layout patterns by page type
- Real examples of each pattern

**File 3: `heuristics.md`**
- Design heuristics evaluation
- Usability assessment checklist
- Common conversion killers
- Fixes and improvements

---

## Reference Material Quality Standards

### Content Quality
- [ ] **Actionable** — Readers can implement immediately
- [ ] **Specific** — Includes real examples, not generic advice
- [ ] **Complete** — Stands alone without reading main SKILL.md
- [ ] **Well-organized** — Clear hierarchy and scannable
- [ ] **Up-to-date** — Current as of publication date
- [ ] **Detailed** — 500-1500 words per reference file

### Structure
- [ ] **Clear heading hierarchy** — H1 for title, H2 for sections
- [ ] **Examples throughout** — Visual examples and real-world cases
- [ ] **Tables for comparison** — Patterns, checklist, options
- [ ] **Code blocks where applicable** — Templates, code, markup
- [ ] **Lists for steps** — Numbered for processes, bulleted for options
- [ ] **Emphasized key points** — Bold or callouts for critical info

### Usability
- [ ] **Scannable** — Readers can skim and find key info
- [ ] **Linked** — Reference to related content and skills
- [ ] **Indexed** — Works referenced in main SKILL.md
- [ ] **Accessible** — Clear language, no jargon without definition
- [ ] **Downloadable** — Can be printed or exported easily

---

## Example: Complete Reference Structure for One Skill

### keyword-research Skill References

```
.agents/skills/keyword-research/
├── SKILL.md (main documentation)
├── references/
│   ├── keyword-classification-framework.md (500 words)
│   │   - Keyword intent matrix
│   │   - Funnel stage mapping
│   │   - Real clustering examples
│   │
│   ├── keyword-research-methodology.md (600 words)
│   │   - Step-by-step process
│   │   - Tool comparisons
│   │   - Data validation
│   │
│   └── case-studies.md (700 words)
│       - 3 real-world examples
│       - Results metrics
│       - Industry insights
```

**Total reference content:** 1800 words across 3 files
**Main SKILL.md:** 200-300 lines

---

## Creating New Reference Files

### 1. Plan the Content
- What information would make the skill actionable?
- What do users struggle with?
- What can be templated or systematized?

### 2. Structure the File
```markdown
# [Reference Title]

## Quick Overview
1-2 sentence summary of what this reference covers

## [Main Section 1]
[Content with examples and templates]

## [Main Section 2]
[Content with examples and templates]

## Real Examples
[2-3 actual use cases or implementations]

## Quick Reference
[Summary table or checklist]
```

### 3. Add Practical Elements
- Real examples from actual implementations
- Templates users can customize
- Checklists they can follow
- Comparison tables
- Decision matrices

### 4. Validate Content
- [ ] Can someone new to the skill understand it?
- [ ] Are examples realistic and specific?
- [ ] Can readers implement immediately?
- [ ] Is it well-organized and scannable?
- [ ] Does it reference the main skill appropriately?

---

## Integration with Main SKILL.md

Reference files should be integrated into the main skill like this:

```markdown
## [Section Title]

[Brief overview of concept]

**For detailed information, see:** `references/[reference-file].md`
- Template: [What template is included]
- Examples: [What types of examples]
- Methodology: [What framework is provided]

Quick example:
[Brief inline example]
```

---

## Priority Reference Files to Create First

### High Impact (needed by 10+ skills)

1. **copy-frameworks.md** — For all copywriting skills
2. **keyword-classification.md** — For SEO research skills
3. **content-templates.md** — For content creation skills
4. **cro-framework.md** — For optimization skills
5. **strategy-templates.md** — For planning skills

### Medium Impact (needed by 5-10 skills)

6. **audit-checklist.md** — For auditing skills
7. **campaign-framework.md** — For marketing skills
8. **case-studies.md** — For multiple skills

### Skill-Specific (needed by 1-3 skills)

9-20. Specific frameworks and templates for individual skills

---

## Checklist: Reference Materials Complete?

For each skill, you should have:

- [ ] **Minimum 2 reference files** (3+ for comprehensive skills)
- [ ] **Combined 1500+ words** of reference content
- [ ] **At least 3 real examples** across all reference files
- [ ] **1-2 templates or checklists** per file
- [ ] **Clear organization** with proper headings
- [ ] **Actionable content** not generic advice
- [ ] **Referenced in main SKILL.md** with links
- [ ] **Readable as standalone documents** (don't need main skill to understand)

---

## Next Steps

1. **Identify** which reference files each skill needs
2. **Create** template structure in references/ directory
3. **Write** detailed, actionable content (500-1500 words each)
4. **Link** reference files from main SKILL.md
5. **Validate** against quality standards above
6. **Iterate** based on user feedback and real-world usage

