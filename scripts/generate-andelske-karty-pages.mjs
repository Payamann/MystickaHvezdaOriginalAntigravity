#!/usr/bin/env node
/**
 * Generates static SEO pages for angel card meanings
 * (andelske-karty/<slug>.html) from data/angel-cards.json, plus a static
 * link hub inside andelske-karty.html between the ANDELSKE-LINKS markers.
 *
 * Usage: node scripts/generate-andelske-karty-pages.mjs [--check]
 * --check compares generated output without writing to the site.
 * Normal runs only write files whose contents actually changed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { atlasShell } from './atlas-shell.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'angel-cards.json');
// Authored long-form content per card, kept out of angel-cards.json so the
// runtime card-draw payload the browser fetches stays small.
const SEO_CONTENT_PATH = path.join(ROOT, 'data', 'angel-cards-seo.json');
const OUTPUT_DIR = path.join(ROOT, 'andelske-karty');
const HUB_PATH = path.join(ROOT, 'andelske-karty.html');
const CANONICAL_ORIGIN = 'https://www.mystickahvezda.cz';
const LASTMOD = '2026-10-18';

// Interpretive layer per archetype so each page carries more than the
// card's one-line message without inventing per-card claims.
const ARCHETYPE_MEANINGS = {
    strength: {
        label: 'Síla a ochrana',
        text: 'Karty síly mohou otevřít téma odvahy, podpory a hranic. Samy neurčují, zda je konkrétní situace bezpečná; tu posuzuj podle toho, co se skutečně děje.',
        practice: 'Zastav se a pojmenuj, co teď potřebuješ. Zvaž bezpečný další krok nebo podporu, kterou můžeš vyhledat.'
    },
    healing: {
        label: 'Péče a obnova',
        text: 'Karty s motivem péče a obnovy mohou posloužit jako symbolický podnět k zamyšlení. Nevyhodnocují zdravotní stav, neurčují příčinu potíží ani neslibují uzdravení; jejich poselství nenahrazuje odbornou péči.',
        practice: 'Vyber si drobný, bezpečný krok podpory, který je v tvých možnostech. Pokud tě trápí zdravotní potíže, prober je se zdravotníkem.'
    },
    guidance: {
        label: 'Vedení a jasnost',
        text: 'Karty vedení mohou nabídnout prostor k zastavení a ujasnění otázky. Samy neurčují správnou odpověď; možnosti můžeš zvážit podle faktů, vlastních potřeb a jejich důsledků.',
        practice: 'Napiš si, co zvažuješ, co už víš a co potřebuješ zjistit. U důležitého kroku si dopřej čas a prober ho s někým důvěryhodným.'
    },
    peace: {
        label: 'Mír a klid',
        text: 'Karty klidu mohou nabídnout symbolický prostor ke zpomalení a pojmenování toho, co potřebuješ. Neurčují, proč se cítíš určitým způsobem ani neslibují úlevu.',
        practice: 'Pokud chceš, vyber si krátkou chvíli bez povinností nebo oslov někoho, kdo tě může podpořit. Způsob odpočinku si zvol podle sebe.'
    },
    abundance: {
        label: 'Hojnost',
        text: 'Karty hojnosti mohou vybídnout k zamyšlení nad zdroji, penězi a tím, jak s nimi zacházíš. Nepředpovídají příjem ani neodstraňují finanční potíže.',
        practice: 'Vyber si jeden praktický krok: zkontroluj rozpočet, ověř podmínky nabídky nebo vyhledej vhodnou radu.'
    },
    purpose: {
        label: 'Směr a další krok',
        text: 'Karty směru mohou nabídnout prostor k ujasnění toho, co je pro tebe důležité a jaké možnosti máš. Samy neurčují životní úkol ani správnou odpověď; další krok můžeš zvážit podle skutečných okolností a vlastních potřeb.',
        practice: 'Vyber si jednu možnost, kterou máš pod kontrolou, a zapiš si její přínosy, rizika a první malý krok.'
    },
    nature: {
        label: 'Příroda a rytmus',
        text: 'Karty přírody mohou připomenout osobní vztah k místům, rytmu a odpočinku. Nepředpovídají účinek pobytu venku ani neurčují příčinu únavy či stresu.',
        practice: 'Pokud ti to vyhovuje a můžeš, věnuj chvíli pobytu venku nebo klidné pauze uvnitř. Zvol si, co je pro tebe dostupné.'
    },
    love: {
        label: 'Láska a vztahy',
        text: 'Karty lásky mohou otevřít otázky blízkosti, respektu a toho, co ve vztazích potřebuješ. Neříkají, co cítí druhý člověk ani co se stane.',
        practice: 'Zkus si pojmenovat jednu potřebu nebo hranici, o které chceš mluvit. Vyber si, zda, kdy a s kým je bezpečné ji otevřít.'
    }
};

function slugify(id) {
    return String(id).toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]/g, '');
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildDescription(card) {
    const description = `Andělská karta ${card.name} (${card.theme}): ${card.short_message}`;
    if (description.length <= 158) return description;

    // Keep generated meta, Open Graph and JSON-LD descriptions readable when
    // an authored card message is too long for the search snippet.
    const snippet = description.slice(0, 157);
    const lastSpace = snippet.lastIndexOf(' ');
    return `${snippet.slice(0, lastSpace).trimEnd().replace(/[,:;–—-]+$/, '')}…`;
}

function pickRelated(card, cards) {
    const sameArchetype = cards.filter((other) => other.id !== card.id && other.archetype === card.archetype);
    const others = cards.filter((other) => other.id !== card.id && other.archetype !== card.archetype);
    return [...sameArchetype, ...others].slice(0, 6);
}

function renderPage(card, cards, seoContent) {
    const slug = slugify(card.id);
    const pageUrl = `${CANONICAL_ORIGIN}/andelske-karty/${slug}.html`;
    const description = escapeHtml(buildDescription(card));
    const archetype = ARCHETYPE_MEANINGS[card.archetype] || ARCHETYPE_MEANINGS.guidance;
    const related = pickRelated(card, cards);
    const longContent = seoContent[card.id] || null;
    const faqEntries = [
        {
            question: `Co znamená andělská karta ${card.name}?`,
            answer: `${card.name} nese téma „${card.theme}“. ${card.short_message}`
        },
        ...(longContent ? [{
            question: `Co karta ${card.name} znamená pro lásku a vztahy?`,
            answer: longContent.love
        }] : []),
        {
            question: `Jak s kartou ${card.name} pracovat?`,
            answer: longContent?.practice || archetype.practice
        }
    ];

    const faqLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqEntries.map(({ question, answer }) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer }
        }))
    }, null, 2);

    const longBlocks = longContent ? `
                <div class="card">
                    <h2>Hlubší výklad karty</h2>
                    <p>${escapeHtml(longContent.message_long)}</p>
                </div>

                <div class="card">
                    <h2>Co karta znamená pro tvůj život</h2>
                    <h3><svg class="mh-symbol angel-detail-section-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#heart"></use></svg>Láska a vztahy</h3>
                    <p>${escapeHtml(longContent.love)}</p>
                    <h3><svg class="mh-symbol angel-detail-section-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#compass"></use></svg>Práce a peníze</h3>
                    <p>${escapeHtml(longContent.work)}</p>
                    <h3>Duše a praxe</h3>
                    <p>${escapeHtml(longContent.spirit)}</p>
                </div>` : '';

    const faqBlock = `
                <div class="card">
                    <h2>Časté otázky</h2>
                    ${faqEntries.map(({ question, answer }) => `<h3>${escapeHtml(question)}</h3>
                    <p>${escapeHtml(answer)}</p>`).join('\n                    ')}
                </div>`;

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Andělská karta ${card.name} — význam a poselství`,
        description: buildDescription(card),
        url: pageUrl,
        dateModified: longContent?.date_modified || LASTMOD,
        inLanguage: 'cs',
        author: { '@type': 'Organization', name: 'Mystická Hvězda' }
    }, null, 2);

    const breadcrumbLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Domů', item: CANONICAL_ORIGIN },
            { '@type': 'ListItem', position: 2, name: 'Andělské karty', item: `${CANONICAL_ORIGIN}/andelske-karty.html` },
            { '@type': 'ListItem', position: 3, name: card.name, item: pageUrl }
        ]
    }, null, 2);

    return atlasShell(`<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/img/icons/mh-favicon.svg">
  <link rel="apple-touch-icon" href="../img/icon-192.webp">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${escapeHtml(card.name)} — význam andělské karty | Mystická Hvězda</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${pageUrl}">

    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(card.name)} — význam andělské karty | Mystická Hvězda">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${CANONICAL_ORIGIN}/img/search-preview/angels.webp">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:locale" content="cs_CZ">
    <meta name="twitter:card" content="summary_large_image">

    <script type="application/ld+json">${jsonLd}</script>
    <script type="application/ld+json">${breadcrumbLd}</script>
    <script type="application/ld+json">${faqLd}</script>
    <link rel="stylesheet" href="/fonts/local-fonts.css">
    <link rel="stylesheet" href="../css/style.v2.min.css?v=20261018-release-candidate">
<script src="/js/dist/analytics-init.js" defer></script>
</head>
<body>
    <a href="#main-content" class="skip-link">Přeskočit na obsah</a>
    <div class="stars" aria-hidden="true"></div>
    <div id="header-placeholder"></div>

    <main id="main-content" tabindex="-1">
        <section class="section">
            <div class="container">
                <span class="section__badge">Andělské karty</span>
                <h1 class="section__title"><svg class="mh-symbol angel-detail-title-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#angel"></use></svg><span class="text-gradient">${escapeHtml(card.name)}</span></h1>
                <p class="section__text"><strong>${escapeHtml(card.theme)}</strong></p>

                <div class="card">
                    <h2>Poselství karty</h2>
                    <p>${escapeHtml(card.short_message)}</p>
                </div>

                <div class="card">
                    <h2>Energie karty: ${escapeHtml(archetype.label)}</h2>
                    <p>${escapeHtml(archetype.text)}</p>
                    <h3>Jak s kartou dnes pracovat</h3>
                    <p>${escapeHtml(longContent?.practice || archetype.practice)}</p>
                </div>

${longBlocks}
${faqBlock}

                <div class="card">
                    <h2>Vytáhni si vlastní kartu</h2>
                    <p>Každý den si můžeš zdarma vytáhnout jednu andělskou kartu — a nechat si její poselství projít celým dnem.</p>
                    <p>
                        <a href="../andelske-karty.html?source=angel_card_meaning&feature=daily_angel_card" class="btn btn--primary">Vytáhnout kartu dne zdarma</a>
                        <a href="../tarot-ano-ne.html?source=angel_card_meaning&feature=tarot_yes_no" class="btn btn--secondary">Rychlý tarot ANO / NE</a>
                    </p>
                </div>

                <div class="card">
                    <h3>Související karty</h3>
                    <div class="related-links">
                        ${related.map((other) => `<a href="${slugify(other.id)}.html" class="related-chip">${escapeHtml(other.name)}</a>`).join('\n                        ')}
                    </div>
                    <p><a href="../andelske-karty.html">← Andělské karty — karta dne</a></p>
                </div>
            </div>
        </section>
    </main>

    <div id="footer-placeholder"></div>

    <script src="../js/dist/core.js?v=20261021-footer-support-locale" defer></script>
    <script type="module" src="../js/dist/main.js?v=10"></script>
</body>
</html>
`, 'atlas-content-page atlas-content-detail', 'atlas-content.css');
}

function renderHubLinks(cards) {
    const startMarker = '<!-- ANDELSKE-LINKS:START -->';
    const endMarker = '<!-- ANDELSKE-LINKS:END -->';
    let html = fs.readFileSync(HUB_PATH, 'utf8');

    const links = cards
        .map((card) => `<a href="andelske-karty/${slugify(card.id)}.html" class="related-chip">${escapeHtml(card.name)}</a>`)
        .join('\n                        ');

    const section = `${startMarker}
                <section class="section" id="vyznamy-andelskych-karet" aria-labelledby="angel-card-meanings-title">
                    <div class="container">
                    <h2 id="angel-card-meanings-title">Významy všech andělských karet</h2>
                    <details class="feature-reference">
                        <summary class="feature-reference__summary">Prohlédnout celý seznam významů</summary>
                        <div class="related-links">
                        ${links}
                        </div>
                    </details>
                    </div>
                </section>
                ${endMarker}`;

    if (html.includes(startMarker) && html.includes(endMarker)) {
        const pattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);
        html = html.replace(pattern, section);
    } else {
        const anchor = '<div id="footer-placeholder"></div>';
        if (!html.includes(anchor)) {
            throw new Error('andelske-karty.html: cannot find footer placeholder to anchor the link hub.');
        }
        html = html.replace(anchor, `${section}\n\n    ${anchor}`);
    }

    return html;
}

function main() {
    const checkOnly = process.argv.includes('--check');
    const cards = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    if (!Array.isArray(cards)) throw new Error('data/angel-cards.json must be an array.');

    const seoContent = JSON.parse(fs.readFileSync(SEO_CONTENT_PATH, 'utf8'));
    if (!seoContent || typeof seoContent !== 'object' || Array.isArray(seoContent)) {
        throw new Error('data/angel-cards-seo.json must contain an object keyed by card id.');
    }

    const missingContent = cards.filter((card) => !seoContent[card.id]).map((card) => card.id);
    if (missingContent.length) {
        console.warn(`[andelske-karty] Missing long-form content for: ${missingContent.join(', ')}`);
    }
    if (!checkOnly) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const seenSlugs = new Map();
    const staleFiles = [];
    let updated = 0;
    let generated = 0;

    for (const card of cards) {
        const slug = slugify(card.id);
        if (!slug || seenSlugs.has(slug)) {
            console.warn(`[andelske-karty] Skipping invalid/duplicate slug: ${card.id}`);
            continue;
        }
        seenSlugs.set(slug, card.id);
        const outputPath = path.join(OUTPUT_DIR, `${slug}.html`);
        const expected = renderPage(card, cards, seoContent);
        generated++;

        if (checkOnly) {
            if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== expected) {
                staleFiles.push(path.relative(ROOT, outputPath));
            }
        } else if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== expected) {
            fs.writeFileSync(outputPath, expected, 'utf8');
            updated++;
        }
    }

    const expectedHub = renderHubLinks(cards.filter((card) => seenSlugs.get(slugify(card.id)) === card.id));
    if (checkOnly) {
        if (!fs.existsSync(HUB_PATH) || fs.readFileSync(HUB_PATH, 'utf8') !== expectedHub) {
            staleFiles.push(path.relative(ROOT, HUB_PATH));
        }

        if (staleFiles.length) {
            const preview = staleFiles.slice(0, 20).join(', ');
            const remaining = staleFiles.length > 20 ? ` and ${staleFiles.length - 20} more` : '';
            console.error(`[andelske-karty] Check failed: ${staleFiles.length} generated file(s) need updates: ${preview}${remaining}`);
            process.exitCode = 1;
            return;
        }

        console.log(`[andelske-karty] Check passed: ${generated} card pages and link hub are current; no files written.`);
        return;
    }

    let hubUpdated = false;
    if (!fs.existsSync(HUB_PATH) || fs.readFileSync(HUB_PATH, 'utf8') !== expectedHub) {
        fs.writeFileSync(HUB_PATH, expectedHub, 'utf8');
        hubUpdated = true;
    }

    console.log(`[andelske-karty] Updated ${updated} of ${generated} card pages; link hub ${hubUpdated ? 'updated' : 'unchanged'}.`);
}

main();
