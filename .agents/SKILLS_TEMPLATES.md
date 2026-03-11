# Skills Documentation Template

**Version:** 1.0.0
**Purpose:** Standard structure for all skills to ensure consistency and completeness

This is a template showing the ideal structure for a comprehensive skill. Use this as a reference when expanding skills.

---

## Full Skill Structure (Recommended for Top Tier Skills)

```yaml
---
name: skill-name
description: >
  Clear 1-3 sentence description of what the skill does.
version: "1.0.0"
license: Apache-2.0
metadata:
  author: author-name
  tags:
    - primary-tag
    - secondary-tag
  triggers:
    - "user phrase 1"
    - "user phrase 2"
  estimated-duration: Medium
  geo-relevance: high
---

# [Skill Title]

## Quick Summary
2-3 sentence overview of what the skill does and when to use it.

## When to Use This Skill

- Scenario 1: Clear use case
- Scenario 2: Another common use case
- Scenario 3: Related use case
- **Do NOT use when:** Exclusions or related skills to use instead

## What This Skill Does

1. **First major function** — Brief description (1-2 sentences)
2. **Second major function** — Brief description
3. **Third major function** — Brief description

## How to Use

### Basic Usage
```
Simple example of how to invoke or use the skill
```

### Advanced Usage
```
More complex usage with options
```

## Core Concepts

### Concept 1: Name and Overview
Definition and importance of this concept

**Key Points:**
- Point 1
- Point 2
- Point 3

**Example:**
```
Real-world example of applying this concept
```

### Concept 2: Another Key Concept
More detailed explanation

**Best Practices:**
- Recommendation 1
- Recommendation 2

## Frameworks & Methodologies

### Framework 1: [Name]
Description of framework

**Steps:**
1. Step 1 — Description
2. Step 2 — Description
3. Step 3 — Description

**Example Application:**
```
Real example showing framework in action
```

## Common Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Pattern 1 | Use case | Example |
| Pattern 2 | Use case | Example |

## Anti-Patterns (What NOT to Do)

- ❌ **Bad Pattern 1** — Why it's wrong and what to do instead
- ❌ **Bad Pattern 2** — Why it's wrong and what to do instead

## Output Format

### [Output Type 1]
- What it includes
- Structure/format
- Example

### [Output Type 2]
- What it includes
- Structure/format
- Example

## Examples

### Example 1: [Real Scenario]
**Goal:** Clear goal for this example

**Input/Setup:**
```
[Input data or setup information]
```

**Process:**
1. First step
2. Second step
3. Third step

**Output:**
```
[Result or output]
```

**Key Takeaways:**
- What was important about this example
- Key insight

### Example 2: [Different Scenario]
**Goal:** Another realistic use case

**Process:**
```
[Detailed walkthrough]
```

**Result & Impact:**
- Expected outcome
- Metrics or success indicators

## Data Sources

**With [tool/API] connected:**
- What data becomes available
- How to use it

**With manual data only:**
- Alternative approaches
- Data you'll need to provide

## Tips for Success

1. **Tip 1** — Practical advice with rationale
2. **Tip 2** — Common pitfall and how to avoid it
3. **Tip 3** — Pro tip for advanced usage
4. **Tip 4** — Quality improvement suggestion
5. **Tip 5** — Common mistake to avoid

## Success Metrics / How to Know It Worked

**Key Indicators:**
- Metric 1 — What to measure and target
- Metric 2 — Success criteria
- Metric 3 — Expected impact

**Validation Checkpoints:**
- [ ] Checkpoint 1 — What to verify
- [ ] Checkpoint 2 — Quality gate
- [ ] Checkpoint 3 — Final validation

## Reference Materials

See the following files for detailed information:
- `references/[file1].md` — Detailed guide on topic 1
- `references/[file2].md` — Templates and examples
- `references/[file3].md` — Framework deep-dive

## Troubleshooting

### Issue 1: [Common Problem]
**Symptoms:** How to recognize this problem

**Solutions:**
1. First approach to try
2. Alternative approach
3. Advanced troubleshooting

### Issue 2: [Another Common Problem]
**Symptoms:** How to recognize it

**Solution:**
[Detailed fix]

## Related Skills

- [skill-name](../skill-name/) — When to use alongside this skill
- [skill-name](../skill-name/) — Complementary skill
- [skill-name](../skill-name/) — Related skill
- [skill-name](../skill-name/) — Another related skill

## Advanced Topics (Optional)

### Topic 1: [Advanced Concept]
For users wanting deeper knowledge:

[Content about advanced topic]

### Topic 2: [Another Advanced Topic]
[Content about advanced usage]

## DataForSEO Integration (If Applicable)

If DataForSEO MCP tools are available:
- Tool 1 for getting data
- Tool 2 for validation
- Tool 3 for optimization

## Changelog & Updates

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-11 | Initial version |
| [Future] | [Date] | [Future updates] |

---

## Minimal Skill Structure (For Quick/Simple Skills)

For skills that don't need all of the above:

```yaml
---
name: skill-name
description: What the skill does (1-2 sentences)
version: "1.0.0"
metadata:
  tags: [tag1, tag2]
  triggers: ["user phrase 1", "user phrase 2"]
  estimated-duration: Quick
---

# Skill Title

## When to Use
When you need to... [clear trigger]

## What It Does
1. Function 1
2. Function 2

## How to Use
[1-2 examples showing usage]

## Tips
- Key tip 1
- Key tip 2

## Related Skills
- [skill-name](../skill-name/) — Related skill
- [skill-name](../skill-name/) — Related skill
```

---

## Checklist: Is Your Skill Documentation Complete?

### Content Completeness
- [ ] **Quick Summary** — 2-3 sentence overview
- [ ] **When to Use** — Clear scenarios and exclusions
- [ ] **What It Does** — 3+ main functions described
- [ ] **How to Use** — At least 2 examples (basic + advanced)
- [ ] **Core Concepts** — 2-3 key concepts with examples
- [ ] **Examples** — 2-3 real-world examples
- [ ] **Tips for Success** — 5+ practical tips
- [ ] **Related Skills** — 3-5 linked related skills
- [ ] **Success Metrics** — How to validate it worked

### Metadata Completeness
- [ ] **name** — Kebab-case, matches directory
- [ ] **description** — 1-3 sentences, action-oriented
- [ ] **version** — Semantic versioning (X.Y.Z)
- [ ] **author** — Name or handle
- [ ] **license** — Clear licensing
- [ ] **tags** — 3-5 standard tags
- [ ] **triggers** — 5-10 user intent phrases
- [ ] **estimated-duration** — Quick/Medium/Comprehensive
- [ ] **geo-relevance** — Set if location-relevant

### Quality Standards
- [ ] **Clarity** — Language is clear and accessible
- [ ] **Examples** — Multiple real-world examples
- [ ] **Structure** — Proper heading hierarchy (H1 → H2 → H3)
- [ ] **Formatting** — Code blocks, tables, lists as appropriate
- [ ] **Accuracy** — Information is current and correct
- [ ] **Validation** — Includes success criteria
- [ ] **Related Skills** — Appropriate cross-references
- [ ] **Line Count** — 200+ lines for comprehensive skills

### Reference Materials
- [ ] **templates/** — Example outputs or templates
- [ ] **references/** — 2-3 detailed reference files
- [ ] **examples/** — Real implementation examples
- [ ] **checklists/** — Actionable task lists

---

## Examples of Well-Documented Skills

Reference these skills as examples of comprehensive documentation:

1. **alert-manager** (300+ lines)
   - Clear alert framework
   - Multiple reference materials
   - Validation checkpoints
   - Real examples

2. **copywriting** (250+ lines)
   - Clear principles and frameworks
   - Multiple page-type examples
   - CTA guidelines
   - Quality checks

3. **programmatic-seo** (240+ lines)
   - Implementation framework
   - Multiple playbooks
   - Data quality checks
   - Real examples

4. **seo** (180+ lines)
   - Orchestration logic
   - Industry detection
   - Quality gates
   - Scoring methodology

---

## How to Expand a Thin Skill

**Thin skills** (50-100 lines) should be expanded to **200+ lines**. Process:

1. **Audit current content**
   - What's covered well?
   - What's missing?

2. **Add core concepts** (50-80 lines)
   - 2-3 key concepts
   - Examples for each
   - Best practices

3. **Add examples** (50-80 lines)
   - 2-3 real-world scenarios
   - Step-by-step walkthrough
   - Expected outcomes

4. **Add frameworks** (30-50 lines)
   - Methodology or process
   - Structured approach
   - Template or checklist

5. **Add tips & troubleshooting** (20-30 lines)
   - 5+ success tips
   - Common issues
   - How to fix them

6. **Create reference files** (optional)
   - Detailed templates
   - Checklists
   - Real examples

---

## Template Usage Guidelines

- **Use the Full Structure** for tier-1, most-used skills
- **Use the Minimal Structure** for quick, specialized skills
- **Customize** sections based on skill needs
- **Always include** Examples and Related Skills
- **Maintain** consistent heading hierarchy
- **Validate** against the checklist before publishing
