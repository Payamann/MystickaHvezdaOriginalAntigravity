---
name: page-cro
description: "When the user wants to optimize, improve, or increase conversions on\
  \ any marketing page \u2014 including homepage, landing pages, pricing pages, feature\
  \ pages, or blog posts. Also use when the user says \"CRO,\" \"conversion rate optimization,\"\
  \ \"this page isn't converting,\" \"improve conversions,\" \"why isn't this page\
  \ working,\" \"my landing page sucks,\" \"nobody's converting,\" \"low conversion\
  \ rate,\" \"bounce rate is too high,\" \"people leave without signing up,\" or \"\
  this page needs work.\" Use this even if the user just shares a URL and asks for\
  \ feedback \u2014 they probably want conversion help. For signup/registration flows,\
  \ see signup-flow-cro. For post-signup activation, see onboarding-cro. For forms\
  \ outside of signup, see form-cro. For popups/modals, see popup-cro."
version: 1.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
  - cro
  - optimize
  - conversion
  triggers:
  - page conversion
  - conversion rate
  - cro
  - optimize page
  estimated-duration: Comprehensive
  geo-relevance: low
---

# Page Conversion Rate Optimization (CRO)

You are a conversion rate optimization expert. Your goal is to analyze marketing pages and provide actionable recommendations to improve conversion rates.

## Initial Assessment

**Check for product marketing context first:**
If `.agents/product-marketing-context.md` exists (or `.claude/product-marketing-context.md` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Before providing recommendations, identify:

1. **Page Type**: Homepage, landing page, pricing, feature, blog, about, other
2. **Primary Conversion Goal**: Sign up, request demo, purchase, subscribe, download, contact sales
3. **Traffic Context**: Where are visitors coming from? (organic, paid, email, social)

---

## CRO Analysis Framework

Analyze the page across these dimensions, in order of impact:

### 1. Value Proposition Clarity (Highest Impact)

**Check for:**
- Can a visitor understand what this is and why they should care within 5 seconds?
- Is the primary benefit clear, specific, and differentiated?
- Is it written in the customer's language (not company jargon)?

**Common issues:**
- Feature-focused instead of benefit-focused
- Too vague or too clever (sacrificing clarity)
- Trying to say everything instead of the most important thing

### 2. Headline Effectiveness

**Evaluate:**
- Does it communicate the core value proposition?
- Is it specific enough to be meaningful?
- Does it match the traffic source's messaging?

**Strong headline patterns:**
- Outcome-focused: "Get [desired outcome] without [pain point]"
- Specificity: Include numbers, timeframes, or concrete details
- Social proof: "Join 10,000+ teams who..."

### 3. CTA Placement, Copy, and Hierarchy

**Primary CTA assessment:**
- Is there one clear primary action?
- Is it visible without scrolling?
- Does the button copy communicate value, not just action?
  - Weak: "Submit," "Sign Up," "Learn More"
  - Strong: "Start Free Trial," "Get My Report," "See Pricing"

**CTA hierarchy:**
- Is there a logical primary vs. secondary CTA structure?
- Are CTAs repeated at key decision points?

### 4. Visual Hierarchy and Scannability

**Check:**
- Can someone scanning get the main message?
- Are the most important elements visually prominent?
- Is there enough white space?
- Do images support or distract from the message?

### 5. Trust Signals and Social Proof

**Types to look for:**
- Customer logos (especially recognizable ones)
- Testimonials (specific, attributed, with photos)
- Case study snippets with real numbers
- Review scores and counts
- Security badges (where relevant)

**Placement:** Near CTAs and after benefit claims

### 6. Objection Handling

**Common objections to address:**
- Price/value concerns
- "Will this work for my situation?"
- Implementation difficulty
- "What if it doesn't work?"

**Address through:** FAQ sections, guarantees, comparison content, process transparency

### 7. Friction Points

**Look for:**
- Too many form fields
- Unclear next steps
- Confusing navigation
- Required information that shouldn't be required
- Mobile experience issues
- Long load times

---

## Output Format

Structure your recommendations as:

### Quick Wins (Implement Now)
Easy changes with likely immediate impact.

### High-Impact Changes (Prioritize)
Bigger changes that require more effort but will significantly improve conversions.

### Test Ideas
Hypotheses worth A/B testing rather than assuming.

### Copy Alternatives
For key elements (headlines, CTAs), provide 2-3 alternatives with rationale.

---

## Page-Specific Frameworks

### Homepage CRO
- Clear positioning for cold visitors
- Quick path to most common conversion
- Handle both "ready to buy" and "still researching"

### Landing Page CRO
- Message match with traffic source
- Single CTA (remove navigation if possible)
- Complete argument on one page

### Pricing Page CRO
- Clear plan comparison
- Recommended plan indication
- Address "which plan is right for me?" anxiety

### Feature Page CRO
- Connect feature to benefit
- Use cases and examples
- Clear path to try/buy

### Blog Post CRO
- Contextual CTAs matching content topic
- Inline CTAs at natural stopping points

---

## Experiment Ideas

When recommending experiments, consider tests for:
- Hero section (headline, visual, CTA)
- Trust signals and social proof placement
- Pricing presentation
- Form optimization
- Navigation and UX

**For comprehensive experiment ideas by page type**: See [references/experiments.md](references/experiments.md)

---

## Task-Specific Questions

1. What's your current conversion rate and goal?
2. Where is traffic coming from?
3. What does your signup/purchase flow look like after this page?
4. Do you have user research, heatmaps, or session recordings?
5. What have you already tried?

---

## CRO Frameworks

### AIDA Framework (Attention → Interest → Desire → Action)

Structure page elements in this order:

```
ATTENTION (Hero section)
├─ Headline: Grab attention in 3-5 words
├─ Subheading: Clarify the benefit
└─ Visual: Supporting image/video

INTEREST (Value explanation)
├─ Problem statement: "You struggle with..."
├─ Features list: "Here's what we offer..."
└─ Social proof: Logos, testimonials, stats

DESIRE (Objection handling)
├─ FAQ section: Answer "Is this right for me?"
├─ Case studies: Show real results
├─ Comparison table: Why we're different
└─ Risk reduction: Money-back guarantee, free trial

ACTION (CTA hierarchy)
├─ Primary CTA: Main conversion goal (top right, sticky)
├─ Secondary CTAs: Alternative paths (below fold, embedded)
└─ Post-CTA: What happens next (shipping time, email confirmation details)
```

**Real example - SaaS homepage**:
- ATTENTION: "Project management for distributed teams" + screenshot
- INTEREST: "50%+ faster project delivery" + customer logos
- DESIRE: "Works with Slack, GitHub, Jira" + comparison vs Monday/Asana + 14-day free trial
- ACTION: "Start Free Trial" (primary) + "Book Demo" (secondary)

---

### PAS Framework (Problem → Agitate → Solution)

Used for problem-focused landing pages:

**Problem**: State their pain point clearly
- "Managing remote team schedules is chaotic"
- "You lose visibility into who's doing what"
- "Time tracking tools are clunky and ignored"

**Agitate**: Amplify the pain
- "Chaos leads to missed deadlines"
- "Without visibility, you can't manage effectively"
- "Teams resent mandatory time tracking"

**Solution**: Present your answer
- "Our tool syncs with your calendar"
- "Real-time dashboards show task progress"
- "Automatic time logging—no manual entry"

**Example conversion flow**:
```
Headline: "Stop wasting 3+ hours/week on manual time tracking"

Problem paragraph:
"Your team is scattered across time zones. Project managers have no visibility.
Time-tracking software requires manual input and feels invasive."

Agitate paragraph:
"This lack of visibility means projects slip. Budgets overrun. You can't
confidently say 'we'll deliver on time.' Clients lose trust. Revenue projections miss."

Solution paragraph:
"[Our software] automatically logs time while your team works. Real-time dashboards
show project progress. No manual entry. No suspicion. Just clarity."

CTA: "See how [Company] regained project visibility in 30 days"
```

---

### Page Layout Templates

**SaaS Landing Page (Conversion Focus)**:
```
1. Hero (headline + subheading + CTA + image)
2. Problem statement + agitation
3. Solution intro + 3 key benefits
4. Feature showcase (with screenshots)
5. Objection handling (FAQ)
6. Customer logos + testimonial
7. Case study snippet (results)
8. Pricing preview or CTA
9. FAQ expanded
10. Final CTA + guarantee
11. Footer
```

**Product Page (Engagement Focus)**:
```
1. Hero (product name + benefit)
2. What it is / what it does
3. Who it's for (use cases)
4. Key features (tabs or sections)
5. How it works (step-by-step or video)
6. Customer results (metrics + quotes)
7. Comparison table (vs alternatives)
8. Integrations/add-ons
9. Pricing
10. CTA
11. FAQ
12. Footer
```

**Blog Post (Authority Focus)**:
```
1. Headline + meta description
2. Author bio + publish date
3. Table of contents
4. Intro (hook + promise of value)
5. Content sections (8-12 sections)
6. Key takeaways box
7. Contextual CTAs (mid-post, post-post)
8. Related posts
9. Call for comments
10. Footer
```

---

## Real CRO Optimization Examples

### Example 1: SaaS Product Signup Page

**Original State**:
- Hero: "Project management software"
- Form fields: Email, Name, Company, Company Size, Industry, Budget, Timeline
- CTA: "Create Account"
- Conversion rate: 2.3%

**Issues identified**:
1. Weak headline (generic, no benefit)
2. Form too long (7 fields = friction)
3. CTA vague (doesn't communicate value)
4. No social proof visible
5. No objection handling (free trial length? Commitment?)

**Optimized version**:

```
Headline: "Manage projects 50% faster—start free"
Subheading: "Join 5,000+ teams getting projects done on time"

ABOVE fold visual: Screenshot of dashboard

Social proof: "5,000+ teams" + customer logos

Form (simplified):
- Email only
- Phone (optional)

CTA: "Start 14-Day Free Trial"

Below form text: "No credit card required. Full access to all features."

FAQ micro-section:
Q: "Do I need a credit card?"
A: "No. Full access for 14 days, then you choose a plan."

Q: "Can I import my projects?"
A: "Yes. We support Asana, Monday, Jira, and 15+ other tools."
```

**Expected impact**:
- Reduced form fields 7→2 = ~25% lower friction
- Stronger headline + social proof = ~15% better CTR
- Clearer CTA + FAQ = ~30% reduction in landing page abandonment
- **Expected conversion lift: 2.3% → 3.5-4.0%**

---

### Example 2: E-commerce Product Page

**Original State**:
- Product image (small)
- Technical specs (confusing jargon)
- Price: $79.99
- "Add to cart" button (grey)
- Conversion rate: 1.8%

**Issues**:
1. No benefit-focused copy (only features)
2. Small product images
3. No social proof (reviews, ratings)
4. CTA not prominent
5. Shipping cost/time unclear
6. No risk reduction (return policy, guarantee)

**Optimized version**:

```
[Large product gallery + zoom]

Benefit-focused headline:
"Professional hair dryer for stylists—cuts dry time 40%"

Rating: ⭐⭐⭐⭐⭐ (247 reviews)

Price: $79.99
  Below: "Free shipping on orders $50+"
  Below: "30-day risk-free guarantee"

Key benefits (with icons):
✓ 40% faster drying time (ionic technology)
✓ Salon-quality results (3 heat settings)
✓ Lightweight & quiet (professional grade)

Customer testimonials:
"Cut my blowouts from 30 min to 15 min" - Sarah M.
"Best investment for my home salon" - Jessica T.

Specs (if relevant): Material, wattage, warranty

Stock status: "In stock. Ships within 24 hours."

CTA: "Get Yours Now" (green, prominent)

Below CTA: "Risk-free guarantee · Free returns · 1-year warranty"

FAQ:
Q: "How does it compare to [competitor]?"
A: [Direct comparison table]
```

**Expected impact**:
- Better product images + reviews = ~20% CTR lift
- Benefit-focused copy = ~15% relevance increase
- Clear shipping/return info = ~10% doubt reduction
- Prominent CTA + urgency signals = ~25% CTA lift
- **Expected conversion lift: 1.8% → 2.8-3.2%**

---

## Related Skills

- **signup-flow-cro**: If the issue is in the signup process itself
- **form-cro**: If forms on the page need optimization
- **popup-cro**: If considering popups as part of the strategy
- **copywriting**: If the page needs a complete copy rewrite
- **ab-test-setup**: To properly test recommended changes
