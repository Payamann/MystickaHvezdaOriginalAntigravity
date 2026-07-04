# SEO Growth Plan - 2026-07-04

Mandate: distribution is now the bottleneck, and the owner chose SEO as the primary channel. The product and technical base are ready; this plan turns 896 indexable pages into compounding organic traffic.

## Where we stand today

- **896 indexable canonical URLs** (was 396 this morning): tools, blog (64), tarot meanings (78), compatibility (78 pairs), names (280), dreams (164), life-path numbers (12), angel cards (44), per-sign pages, glossary (30), SK/PL.
- Technical SEO is a solved problem here: canonical discipline, sitemap generation from canonicals, robots.txt, JSON-LD, hreflang for SK/PL, CSP-safe pages, daily scheduled smoke test. `npm run audit:site` guards it all.
- Main CZ tool pages now all carry FAQ content + FAQPage schema (7 thin pages deepened today: aura, cinsky-horoskop, biorytmy, kristalova-koule, minuly-zivot, numerologie, runy).
- `llms.txt` / `llms-full.txt` updated for AI-search visibility (ChatGPT/Perplexity citations).

## The strategy in one sentence

Win Czech long-tail esoteric queries with programmatic reference content (already built), funnel that traffic into free tools via the source-attributed bridges (already built), and let the funnel infrastructure convert it (already built) — while the blog targets the mid-tail queries programmatic pages can't.

## First 30 days (indexation + baseline)

1. **Google Search Console — weekly ritual (owner, ~20 min/week):**
   - Submit `sitemap.xml` again after each deploy that adds pages (it now lists 896 URLs).
   - Watch Pages > Indexing: the new clusters (jmena, snar, numerologie, andelske-karty) should move from "Discovered" to "Indexed" over 2-6 weeks. If a cluster stalls at "Crawled - currently not indexed", flag it — that signals thin-content perception and we iterate on that cluster's template.
   - Watch Performance > filter by `/jmena/`, `/snar/`, `/numerologie/`, `/andelske-karty/` to see first impressions per cluster.
2. **Do not add more programmatic pages this month.** Let Google digest the 500 new ones. Adding more now dilutes crawl budget and delays the signal we need to read.
3. **Blog cadence: 1-2 posts/week targeting mid-tail queries** (see keyword map below). Each post must link to 2-3 tool pages with `source=` attribution and to 3-5 programmatic pages (names/dreams/numbers) — this is how authority flows into the new clusters.
4. **Internal-linking sweep of existing blog posts:** the 64 existing posts predate the new clusters. Add contextual links from relevant posts to the new pages (dream posts → snar/, numerology posts → numerologie/, name-day posts → jmena/). One batch pass, high leverage.

## Days 30-90 (iterate on data)

5. **Double down on the cluster that indexes best.** If jmena pages get impressions, expand name pages (name days calendar, name compatibility). If snar wins, extend `data/dreams.json` with the top unanswered dream queries from GSC.
6. **Rich results check:** FAQPage and Article schema are in place; verify in GSC's Enhancements. FAQ rich results materially lift CTR on esoteric queries.
7. **Ritualy cluster** (currently 2 pages) — build only if lunace/ritual queries show up in GSC.
8. **SK expansion decision:** if `/sk/` pages get Slovak impressions, replicate the programmatic clusters for SK (the generators are locale-ready patterns). Slovak search is ~50% additional TAM with near-zero competition for these queries.
9. **Lighthouse/CWV pass on production** (from the audit backlog) once traffic makes it worth measuring.

## Blog keyword map (mid-tail targets, CZ)

Priority order — pick from top when writing. Format: query → angle → internal links.

| Query cluster | Angle | Links into |
|---|---|---|
| "co znamená když se mi zdá o..." variations | Weekly dream-interpretation posts | snar/ pages, snar.html |
| "životní číslo výpočet" / "mistrovské číslo 11" | Master-number deep dives | numerologie/, kalkulacka |
| "tarot výklad zdarma" / "jak se ptát tarotu" | How-to guides | tarot-ano-ne, tarot.html |
| "horoskop na [měsíc] 2026" per sign | Monthly forecast posts (evergreen slots) | horoskop/, horoskopy.html |
| "jak se hodí [znamení] k [znamení]" | Compatibility stories | partnerska-shoda/ |
| "svátek [jméno]" / "význam jména [jméno]" | Name-day seasonal posts | jmena/ |
| "úplněk [měsíc] 2026 význam" | Lunar event posts (timely, high spikes) | lunace.html, ritualy/ |
| "andělská čísla 1111/2222" | Angel-number meanings | andelske-karty/, andelska-posta |

Voice: brand tone (tykání, functional astro context — "co to pro mě dnes znamená"), 800-1200 words, one FAQ block with schema, one image.

## Measurement (the only three numbers that matter)

| Checkpoint | Metric | Green signal |
|---|---|---|
| Day 30 | Indexed pages in GSC | > 60% of new cluster URLs indexed |
| Day 60 | Impressions/week for new clusters | > 1 000/week combined and rising |
| Day 90 | Organic clicks → tool sessions → trial starts | Funnel report shows organic `source` segments converting |

If Day-60 impressions are flat across ALL clusters, the diagnosis is domain authority, not content — then the play shifts to link-building (Czech esoteric portals, name-day widgets, PR) before more content.

## What NOT to do

- No mass AI-generated blog spam — Google's spam policies target scaled unoriginal content, and one manual action would take the whole domain down with it. The programmatic pages work because they're structured reference data, not generated prose.
- No new tool features until Day-60 data lands (operator-context guardrail still applies).
- No paid ads to compensate for slow SEO — different budget game, poor fit for the margins.
