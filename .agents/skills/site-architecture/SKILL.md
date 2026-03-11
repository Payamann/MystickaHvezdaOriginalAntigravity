---
name: site-architecture
description: "When the user wants to plan, map, or restructure their website's page\
  \ hierarchy, navigation, URL structure, or internal linking. Also use when the user\
  \ mentions \"sitemap,\" \"site map,\" \"visual sitemap,\" \"site structure,\" \"\
  page hierarchy,\" \"information architecture,\" \"IA,\" \"navigation design,\" \"\
  URL structure,\" \"breadcrumbs,\" \"internal linking strategy,\" \"website planning,\"\
  \ \"what pages do I need,\" \"how should I organize my site,\" or \"site navigation.\"\
  \ Use this whenever someone is planning what pages a website should have and how\
  \ they connect. NOT for XML sitemaps (that's technical SEO \u2014 see seo-audit).\
  \ For SEO audits, see seo-audit. For structured data, see schema-markup."
version: 1.0.0
metadata:
  author: internal-team
  license: Internal
  tags:
  - seo
  - technical
  - strategy
  triggers:
  - site structure
  - information architecture
  - site organization
  estimated-duration: Medium
---

# Site Architecture

You are an information architecture expert. Your goal is to help plan website structure — page hierarchy, navigation, URL patterns, and internal linking — so the site is intuitive for users and optimized for search engines.

## Before Planning

**Check for product marketing context first:**
If `.agents/product-marketing-context.md` exists (or `.claude/product-marketing-context.md` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Gather this context (ask if not provided):

### 1. Business Context
- What does the company do?
- Who are the primary audiences?
- What are the top 3 goals for the site? (conversions, SEO traffic, education, support)

### 2. Current State
- New site or restructuring an existing one?
- If restructuring: what's broken? (high bounce, poor SEO, users can't find things)
- Existing URLs that must be preserved (for redirects)?

### 3. Site Type
- SaaS marketing site
- Content/blog site
- E-commerce
- Documentation
- Hybrid (SaaS + content)
- Small business / local

### 4. Content Inventory
- How many pages exist or are planned?
- What are the most important pages? (by traffic, conversions, or business value)
- Any planned sections or expansions?

---

## Site Types and Starting Points

| Site Type | Typical Depth | Key Sections | URL Pattern |
|-----------|--------------|--------------|-------------|
| SaaS marketing | 2-3 levels | Home, Features, Pricing, Blog, Docs | `/features/name`, `/blog/slug` |
| Content/blog | 2-3 levels | Home, Blog, Categories, About | `/blog/slug`, `/category/slug` |
| E-commerce | 3-4 levels | Home, Categories, Products, Cart | `/category/subcategory/product` |
| Documentation | 3-4 levels | Home, Guides, API Reference | `/docs/section/page` |
| Hybrid SaaS+content | 3-4 levels | Home, Product, Blog, Resources, Docs | `/product/feature`, `/blog/slug` |
| Small business | 1-2 levels | Home, Services, About, Contact | `/services/name` |

**For full page hierarchy templates**: See [references/site-type-templates.md](references/site-type-templates.md)

---

## Page Hierarchy Design

### The 3-Click Rule

Users should reach any important page within 3 clicks from the homepage. This isn't absolute, but if critical pages are buried 4+ levels deep, something is wrong.

### Flat vs Deep

| Approach | Best For | Tradeoff |
|----------|----------|----------|
| Flat (2 levels) | Small sites, portfolios | Simple but doesn't scale |
| Moderate (3 levels) | Most SaaS, content sites | Good balance of depth and findability |
| Deep (4+ levels) | E-commerce, large docs | Scales but risks burying content |

**Rule of thumb**: Go as flat as possible while keeping navigation clean. If a nav dropdown has 20+ items, add a level of hierarchy.

### Hierarchy Levels

| Level | What It Is | Example |
|-------|-----------|---------|
| L0 | Homepage | `/` |
| L1 | Primary sections | `/features`, `/blog`, `/pricing` |
| L2 | Section pages | `/features/analytics`, `/blog/seo-guide` |
| L3+ | Detail pages | `/docs/api/authentication` |

### ASCII Tree Format

Use this format for page hierarchies:

```
Homepage (/)
├── Features (/features)
│   ├── Analytics (/features/analytics)
│   ├── Automation (/features/automation)
│   └── Integrations (/features/integrations)
├── Pricing (/pricing)
├── Blog (/blog)
│   ├── [Category: SEO] (/blog/category/seo)
│   └── [Category: CRO] (/blog/category/cro)
├── Resources (/resources)
│   ├── Case Studies (/resources/case-studies)
│   └── Templates (/resources/templates)
├── Docs (/docs)
│   ├── Getting Started (/docs/getting-started)
│   └── API Reference (/docs/api)
├── About (/about)
│   └── Careers (/about/careers)
└── Contact (/contact)
```

**When to use ASCII vs Mermaid**:
- ASCII: quick hierarchy drafts, text-only contexts, simple structures
- Mermaid: visual presentations, complex relationships, showing nav zones or linking patterns

---

## Navigation Design

### Navigation Types

| Nav Type | Purpose | Placement |
|----------|---------|-----------|
| Header nav | Primary navigation, always visible | Top of every page |
| Dropdown menus | Organize sub-pages under parent | Expands from header items |
| Footer nav | Secondary links, legal, sitemap | Bottom of every page |
| Sidebar nav | Section navigation (docs, blog) | Left side within a section |
| Breadcrumbs | Show current location in hierarchy | Below header, above content |
| Contextual links | Related content, next steps | Within page content |

### Header Navigation Rules

- **4-7 items max** in the primary nav (more causes decision paralysis)
- **CTA button** goes rightmost (e.g., "Start Free Trial," "Get Started")
- **Logo** links to homepage (left side)
- **Order by priority**: most important/visited pages first
- If you have a mega menu, limit to 3-4 columns

### Footer Organization

Group footer links into columns:
- **Product**: Features, Pricing, Integrations, Changelog
- **Resources**: Blog, Case Studies, Templates, Docs
- **Company**: About, Careers, Contact, Press
- **Legal**: Privacy, Terms, Security

### Breadcrumb Format

```
Home > Features > Analytics
Home > Blog > SEO Category > Post Title
```

Breadcrumbs should mirror the URL hierarchy. Every breadcrumb segment should be a clickable link except the current page.

**For detailed navigation patterns**: See [references/navigation-patterns.md](references/navigation-patterns.md)

---

## URL Structure

### Design Principles

1. **Readable by humans** — `/features/analytics` not `/f/a123`
2. **Hyphens, not underscores** — `/blog/seo-guide` not `/blog/seo_guide`
3. **Reflect the hierarchy** — URL path should match site structure
4. **Consistent trailing slash policy** — pick one (with or without) and enforce it
5. **Lowercase always** — `/About` should redirect to `/about`
6. **Short but descriptive** — `/blog/how-to-improve-landing-page-conversion-rates` is too long; `/blog/landing-page-conversions` is better

### URL Patterns by Page Type

| Page Type | Pattern | Example |
|-----------|---------|---------|
| Homepage | `/` | `example.com` |
| Feature page | `/features/{name}` | `/features/analytics` |
| Pricing | `/pricing` | `/pricing` |
| Blog post | `/blog/{slug}` | `/blog/seo-guide` |
| Blog category | `/blog/category/{slug}` | `/blog/category/seo` |
| Case study | `/customers/{slug}` | `/customers/acme-corp` |
| Documentation | `/docs/{section}/{page}` | `/docs/api/authentication` |
| Legal | `/{page}` | `/privacy`, `/terms` |
| Landing page | `/{slug}` or `/lp/{slug}` | `/free-trial`, `/lp/webinar` |
| Comparison | `/compare/{competitor}` or `/vs/{competitor}` | `/compare/competitor-name` |
| Integration | `/integrations/{name}` | `/integrations/slack` |
| Template | `/templates/{slug}` | `/templates/marketing-plan` |

### Common Mistakes

- **Dates in blog URLs** — `/blog/2024/01/15/post-title` adds no value and makes URLs long. Use `/blog/post-title`.
- **Over-nesting** — `/products/category/subcategory/item/detail` is too deep. Flatten where possible.
- **Changing URLs without redirects** — Every old URL needs a 301 redirect to its new URL. Without them, you lose backlink equity and create broken pages for anyone with the old URL bookmarked or linked.
- **IDs in URLs** — `/product/12345` is not human-readable. Use slugs.
- **Query parameters for content** — `/blog?id=123` should be `/blog/post-title`.
- **Inconsistent patterns** — Don't mix `/features/analytics` and `/product/automation`. Pick one parent.

### Breadcrumb-URL Alignment

The breadcrumb trail should mirror the URL path:

| URL | Breadcrumb |
|-----|-----------|
| `/features/analytics` | Home > Features > Analytics |
| `/blog/seo-guide` | Home > Blog > SEO Guide |
| `/docs/api/auth` | Home > Docs > API > Authentication |

---

## Visual Sitemap Output (Mermaid)

Use Mermaid `graph TD` for visual sitemaps. This makes hierarchy relationships clear and can annotate navigation zones.

### Basic Hierarchy

```mermaid
graph TD
    HOME[Homepage] --> FEAT[Features]
    HOME --> PRICE[Pricing]
    HOME --> BLOG[Blog]
    HOME --> ABOUT[About]

    FEAT --> F1[Analytics]
    FEAT --> F2[Automation]
    FEAT --> F3[Integrations]

    BLOG --> B1[Post 1]
    BLOG --> B2[Post 2]
```

### With Navigation Zones

```mermaid
graph TD
    subgraph Header Nav
        HOME[Homepage]
        FEAT[Features]
        PRICE[Pricing]
        BLOG[Blog]
        CTA[Get Started]
    end

    subgraph Footer Nav
        ABOUT[About]
        CAREERS[Careers]
        CONTACT[Contact]
        PRIVACY[Privacy]
    end

    HOME --> FEAT
    HOME --> PRICE
    HOME --> BLOG
    HOME --> ABOUT

    FEAT --> F1[Analytics]
    FEAT --> F2[Automation]
```

**For more Mermaid templates**: See [references/mermaid-templates.md](references/mermaid-templates.md)

---

## Internal Linking Strategy

### Link Types

| Type | Purpose | Example |
|------|---------|---------|
| Navigational | Move between sections | Header, footer, sidebar links |
| Contextual | Related content within text | "Learn more about [analytics](/features/analytics)" |
| Hub-and-spoke | Connect cluster content to hub | Blog posts linking to pillar page |
| Cross-section | Connect related pages across sections | Feature page linking to related case study |

### Internal Linking Rules

1. **No orphan pages** — every page must have at least one internal link pointing to it
2. **Descriptive anchor text** — "our analytics features" not "click here"
3. **5-10 internal links per 1000 words** of content (approximate guideline)
4. **Link to important pages more often** — homepage, key feature pages, pricing
5. **Use breadcrumbs** — free internal links on every page
6. **Related content sections** — "Related Posts" or "You might also like" at page bottom

### Hub-and-Spoke Model

For content-heavy sites, organize around hub pages:

```
Hub: /blog/seo-guide (comprehensive overview)
├── Spoke: /blog/keyword-research (links back to hub)
├── Spoke: /blog/on-page-seo (links back to hub)
├── Spoke: /blog/technical-seo (links back to hub)
└── Spoke: /blog/link-building (links back to hub)
```

Each spoke links back to the hub. The hub links to all spokes. Spokes link to each other where relevant.

### Link Audit Checklist

- [ ] Every page has at least one inbound internal link
- [ ] No broken internal links (404s)
- [ ] Anchor text is descriptive (not "click here" or "read more")
- [ ] Important pages have the most inbound internal links
- [ ] Breadcrumbs are implemented on all pages
- [ ] Related content links exist on blog posts
- [ ] Cross-section links connect features to case studies, blog to product pages

---

## Output Format

When creating a site architecture plan, provide these deliverables:

### 1. Page Hierarchy (ASCII Tree)
Full site structure with URLs at each node. Use the ASCII tree format from the Page Hierarchy Design section.

### 2. Visual Sitemap (Mermaid)
Mermaid diagram showing page relationships and navigation zones. Use `graph TD` with subgraphs for nav zones where helpful.

### 3. URL Map Table

| Page | URL | Parent | Nav Location | Priority |
|------|-----|--------|-------------|----------|
| Homepage | `/` | — | Header | High |
| Features | `/features` | Homepage | Header | High |
| Analytics | `/features/analytics` | Features | Header dropdown | Medium |
| Pricing | `/pricing` | Homepage | Header | High |
| Blog | `/blog` | Homepage | Header | Medium |

### 4. Navigation Spec
- Header nav items (ordered, with CTA)
- Footer sections and links
- Sidebar nav (if applicable)
- Breadcrumb implementation notes

### 5. Internal Linking Plan
- Hub pages and their spokes
- Cross-section link opportunities
- Orphan page audit (if restructuring)
- Recommended links per key page

---

## Real-World Site Architecture Examples

### Example 1: SaaS Marketing Site (Slack-like)

**Site Type**: SaaS Product
**Primary Goals**: Product adoption, sales pipeline, documentation
**Depth**: 3 levels

```
Homepage (/)
├── Product (/product)
│   ├── /product/features
│   ├── /product/channels
│   ├── /product/integrations
│   ├── /product/security
│   └── /product/for-[role] (multiple: managers, engineers, etc.)
├── Customers (/customers)
│   ├── /customers/case-studies
│   ├── /customers/testimonials
│   └── /customers/[customer-name]
├── Pricing (/pricing)
├── Enterprise (/enterprise)
│   ├── /enterprise/contact
│   └── /enterprise/security
├── Resources (/resources)
│   ├── /resources/templates
│   ├── /resources/webinars
│   ├── /resources/guides
│   └── /resources/research
├── Blog (/blog)
│   ├── /blog/[slug]
│   └── /blog/category/[category] (Engineering, Product, Culture)
├── Docs (/docs)
│   ├── /docs/getting-started
│   ├── /docs/api
│   ├── /docs/help
│   └── /docs/integrations
├── Company (/company)
│   ├── /company/about
│   ├── /company/careers
│   ├── /company/press
│   └── /company/contact
└── Legal (/legal)
    ├── /privacy
    ├── /terms
    └── /security
```

**Navigation Structure**:
- **Header**: Product | Customers | Resources | Docs | Enterprise | Pricing | Contact (CTA)
- **Footer**: Product, Company, Resources, Legal columns
- **Mobile**: Hamburger menu with same structure

**Key Internal Linking Patterns**:
- Homepage → All main sections
- Product feature pages → Related case studies
- Blog posts → Relevant product pages
- Docs → API reference, guides
- Footer has full sitemap

---

### Example 2: E-commerce Store (Apparel)

**Site Type**: E-commerce
**Primary Goals**: Product discovery, conversions, categories
**Depth**: 4 levels

```
Homepage (/)
├── Shop (/shop)
│   ├── /shop/mens
│   │   ├── /shop/mens/t-shirts
│   │   │   └── /shop/product/[sku]
│   │   ├── /shop/mens/pants
│   │   └── /shop/mens/jackets
│   ├── /shop/womens
│   │   ├── /shop/womens/tops
│   │   ├── /shop/womens/dresses
│   │   └── /shop/womens/accessories
│   ├── /shop/kids
│   └── /shop/sale
├── Collections (/collections)
│   ├── /collections/bestsellers
│   ├── /collections/new-arrivals
│   ├── /collections/sustainable
│   └── /collections/gift-guide
├── About (/about)
├── Blog (/blog) — Style tips, outfit ideas, brand stories
│   ├── /blog/[slug]
│   └── /blog/category/[category]
├── Customer Care (/help)
│   ├── /help/shipping
│   ├── /help/returns
│   ├── /help/sizing
│   └── /help/contact
├── Account (/account)
│   ├── /account/orders
│   ├── /account/wishlists
│   └── /account/settings
└── Checkout (/checkout)
    ├── /checkout/cart
    ├── /checkout/shipping
    └── /checkout/payment
```

**URL Patterns**:
- Category pages FLAT: `/shop/mens` not `/shop/mens/clothing/tops`
- Products use SKU: `/shop/product/sku-12345` or slug `/shop/product/nike-air-force-mens-white`
- Avoid date-based or numeric URLs

**Navigation**:
- **Header**: Men | Women | Kids | Collections | Sale | Account
- **Breadcrumbs**: Home > Category > Subcategory > Product
- **Footer**: Help, About, Returns, Shipping, Size Guide

**Category Page Linking**:
Each category page should have:
- 10-15 product links (grid view)
- "Shop all [category]" breadcrumb
- Related category links ("You might also like...")
- Link to sizing guide
- Link to relevant blog content

---

### Example 3: Content/Blog Site (Marketing blog)

**Site Type**: Content/Blog
**Primary Goals**: SEO traffic, thought leadership, newsletter signups
**Depth**: 2-3 levels

```
Homepage (/)
├── Blog (/blog)
│   ├── /blog/[slug]
│   ├── /blog/category/seo
│   ├── /blog/category/content-strategy
│   ├── /blog/category/cro
│   ├── /blog/category/analytics
│   └── /blog/tag/[tag] (Optional: less important than categories)
├── Guides (/guides)
│   ├── /guides/seo-guide (pillar)
│   │   └─ (internally links to blog cluster)
│   ├── /guides/content-strategy-guide
│   └── /guides/cro-guide
├── Tools & Resources (/resources)
│   ├── /resources/templates
│   ├── /resources/calculators
│   ├── /resources/checklist
│   └── /resources/webinars
├── About (/about)
├── Contact (/contact)
└── Newsletter (/newsletter)
```

**URL Structure for Blog**:
- `/blog/post-title` (flat, simple)
- NOT: `/blog/2024/01/15/post-title` (dates make URLs long and fragile)
- NOT: `/blog/category/seo/post-title` (category in path means category pages rank, not posts)

**Content Linking Strategy**:
```
Pillar Page (/guides/seo-guide)
   ↓ (links to all 8 cluster articles)
├─ Cluster post: /blog/keyword-research
├─ Cluster post: /blog/on-page-seo
├─ Cluster post: /blog/technical-seo
├─ Cluster post: /blog/link-building
└─ [Each cluster post links back to pillar + to related clusters]
```

**Navigation**:
- **Header**: Blog | Guides | Resources | About | Newsletter signup
- **Footer**: All blog categories + popular posts

---

### Example 4: Local Service Site (Dentist)

**Site Type**: Local Service
**Primary Goals**: Local pack visibility, appointment bookings
**Depth**: 2 levels

```
Homepage (/)
├── Services (/services)
│   ├── /services/general-dentistry
│   ├── /services/cosmetic-dentistry
│   ├── /services/invisalign
│   ├── /services/implants
│   └── /services/emergency
├── About (/about)
│   ├── /about/meet-the-team
│   └── /about/credentials
├── Blog (/blog)
│   ├── /blog/[slug]
│   └── /blog/category/[category]
├── Patient Resources (/resources)
│   ├── /resources/faq
│   ├── /resources/new-patient-form
│   ├── /resources/insurance
│   └── /resources/payment-plans
├── Contact (/contact)
│   └── /contact/book-appointment
└── Neighborhoods (If multi-location)
    ├── /locations/downtown
    ├── /locations/uptown
    └── /locations/suburbs
```

**Key Elements**:
- Service pages have: Description + Procedure steps + FAQ + CTA to book
- Blog targets local + service keywords: "teeth whitening Austin," "emergency dentist near me"
- Contact/appointment CTA on every page (sticky header button)
- Google Business Profile optimization (address, hours, reviews)
- LocalBusiness schema markup on homepage

**Content Strategy**:
- Service pages: Each procedure gets detailed page + blog post
- Local authority: "Best dentist in [neighborhood]" content
- FAQ targeting: "How long does [procedure] take?" "Is [procedure] painful?"

---

## Task-Specific Questions

1. Is this a new site or are you restructuring an existing one?
2. What type of site is it? (SaaS, content, e-commerce, docs, hybrid, small business)
3. How many pages exist or are planned?
4. What are the 5 most important pages on the site?
5. Are there existing URLs that need to be preserved or redirected?
6. Who are the primary audiences, and what are they trying to accomplish on the site?

---

## Related Skills

- **content-strategy**: For planning what content to create and topic clusters
- **programmatic-seo**: For building SEO pages at scale with templates and data
- **seo-audit**: For technical SEO, on-page optimization, and indexation issues
- **page-cro**: For optimizing individual pages for conversion
- **schema-markup**: For implementing breadcrumb and site navigation structured data
- **competitor-alternatives**: For comparison page frameworks and URL patterns
