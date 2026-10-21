#!/usr/bin/env node
/**
 * Generates static SEO pages for the dream dictionary (snar/<slug>.html)
 * from data/dreams.json, plus a static link hub inside snar.html between
 * the SNAR-LINKS markers so crawlers can reach every page.
 *
 * Usage: node scripts/generate-snar-pages.mjs [--check]
 * --check compares generated output without writing to the site.
 * Normal runs only write files whose contents actually changed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'dreams.json');
// Authored long-form content per symbol (optional per entry — pages without
// it keep the base template). Kept out of dreams.json so the runtime
// dream-tool payload stays small.
const SEO_CONTENT_PATH = path.join(ROOT, 'data', 'dreams-seo.json');
const OUTPUT_DIR = path.join(ROOT, 'snar');
const HUB_PATH = path.join(ROOT, 'snar.html');
const CANONICAL_ORIGIN = 'https://www.mystickahvezda.cz';
const LASTMOD = '2026-07-11';
const ATLAS_WEB_VERSION = '20261020-02-mobile-hero-padding-dedup';
const MAIN_JS_VERSION = '20261018-status-icons';

// Dream links use only a small number of literal, relevant icons from the
// shared brand sprite. All other links stay text-only instead of falling
// back to platform-dependent emoji from the source data.
const HUB_LINK_PRESENTATION = {
    hvezdy: { label: 'Hvězdy / Noční obloha' },
    mesic: {
        label: 'Měsíc',
        icon: '<svg class="mh-symbol mh-symbol--inline" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#dream"></use></svg>'
    },
    tma: {
        label: 'Tma',
        icon: '<svg class="mh-moon-art" viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false"><use href="/img/icons/moon-phases.svg#moon-0"></use></svg>'
    },
    buh: { label: 'Bůh / Vyšší bytost' },
    'hvezdny-prach': { label: 'Hvězdný prach / Třpyt' },
    zvon: { label: 'Zvon / Zvonění' }
};

function slugify(value) {
    return String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9-]/g, '');
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalizeLineEndings(value) {
    return String(value).replace(/\r\n?/g, '\n');
}

function sameGeneratedContent(current, expected) {
    return normalizeLineEndings(current) === normalizeLineEndings(expected);
}

function lowerKeyword(keyword) {
    const value = String(keyword || '').trim();
    return value.charAt(0).toLocaleLowerCase('cs') + value.slice(1);
}

function buildDescription(dream) {
    const base = `Co znamená sen o: ${lowerKeyword(dream.keyword)}? ${dream.description}`;
    return base.length > 158 ? `${base.slice(0, 155)}…` : base;
}

function buildQuestions(dream) {
    const keyword = lowerKeyword(dream.keyword);
    return [
        `Co ti symbol „${keyword}“ připomíná a jaký pocit ve snu zůstal?`
    ];
}

function pickRelated(index, dreams) {
    const related = [];
    for (let offset = 1; related.length < 6 && offset <= dreams.length; offset += 1) {
        const next = dreams[(index + offset) % dreams.length];
        if (next) related.push(next);
    }
    return related;
}

function renderDreamChip(dream, href) {
    const override = HUB_LINK_PRESENTATION[dream.id];
    const label = escapeHtml(override?.label || dream.keyword);
    return `<a href="${href}" class="related-chip">${override?.icon || ''}${label}</a>`;
}

function renderPage(dream, index, dreams, seoContent) {
    const slug = slugify(dream.id);
    const pageUrl = `${CANONICAL_ORIGIN}/snar/${slug}.html`;
    const keyword = escapeHtml(dream.keyword);
    const related = pickRelated(index, dreams);
    const questions = buildQuestions(dream);
    const longContent = seoContent[dream.id] || null;
    const rawDescription = longContent?.metaDescription || buildDescription(dream);
    const description = escapeHtml(rawDescription);
    const imageAlt = escapeHtml(`Sen o: ${dream.keyword} — výklad snu | Snář Mystická Hvězda`);

    const faqEntries = Array.isArray(longContent?.faq) ? longContent.faq : [];
    const faqLd = faqEntries.length ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqEntries.map(({ question, answer }) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer }
        }))
    }, null, 2)}</script>` : '';

    const longBlocks = longContent ? `
                <details class="dream-interpretations">
                    <summary>Další možné souvislosti</summary>
                    <div class="dream-interpretations__content">
                        <section>
                            <h2>${escapeHtml(longContent.psychologicalHeading || 'Možný osobní úhel')}</h2>
                            <p>${escapeHtml(longContent.psychological)}</p>
                        </section>
                        <section>
                            <h2>Symbolika v příbězích a tradicích</h2>
                            <p>${escapeHtml(longContent.spiritual)}</p>
                        </section>
                        <section>
                            <h2>Různé podoby snu</h2>
                            <p>${escapeHtml(longContent.variants)}</p>
                        </section>
                        <section>
                            <h2>Kdy zpozornět</h2>
                            <p>${escapeHtml(longContent.warning)}</p>
                        </section>
                    </div>
                </details>` : '';

    const faqBlock = faqEntries.length ? `
                <div class="card">
                    <h2>Časté otázky</h2>
                    ${faqEntries.map(({ question, answer }) => `<h3>${escapeHtml(question)}</h3>
                    <p>${escapeHtml(answer)}</p>`).join('\n                    ')}
                </div>` : '';

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Sen o: ${dream.keyword} — výklad snu`,
        description: rawDescription,
        url: pageUrl,
        dateModified: longContent?.dateModified || LASTMOD,
        inLanguage: 'cs',
        author: { '@type': 'Organization', name: 'Mystická Hvězda' }
    }, null, 2);

    const breadcrumbLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Domů', item: CANONICAL_ORIGIN },
            { '@type': 'ListItem', position: 2, name: 'Snář', item: `${CANONICAL_ORIGIN}/snar.html` },
            { '@type': 'ListItem', position: 3, name: `Sen o: ${dream.keyword}`, item: pageUrl }
        ]
    }, null, 2);

    return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/img/icons/mh-favicon.svg">
  <link rel="apple-touch-icon" href="../img/icon-192.webp">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Sen o: ${keyword} — výklad snu | Snář Mystická Hvězda</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${pageUrl}">

    <meta property="og:type" content="article">
    <meta property="og:title" content="Sen o: ${keyword} — výklad snu | Mystická Hvězda">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${CANONICAL_ORIGIN}/img/search-preview/dreams.webp">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:locale" content="cs_CZ">
    <meta name="twitter:card" content="summary_large_image">

    <script type="application/ld+json">${jsonLd}</script>
    <script type="application/ld+json">${breadcrumbLd}</script>
${faqLd ? `    ${faqLd}\n` : ''}    <link rel="stylesheet" href="/fonts/local-fonts.css">
    <link rel="stylesheet" href="../css/style.v2.min.css?v=20261018-release-candidate">
<script src="/js/dist/analytics-init.js" defer></script>
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="${CANONICAL_ORIGIN}/img/search-preview/dreams.webp">
<meta property="og:image:alt" content="${imageAlt}">
<meta name="twitter:image:alt" content="${imageAlt}">

    <link rel="stylesheet" href="/css/atlas-web.css?v=20261020-03-horoscope-day-switcher-atlas">
    <link rel="stylesheet" href="/css/atlas-content.css?v=2">
</head>
<body class="atlas-page atlas-content-page atlas-content-detail">
    <a href="#main-content" class="skip-link">Přeskočit na obsah</a>
    <div id="header-placeholder"></div>

    <main id="main-content" tabindex="-1">
        <section class="section">
            <div class="container">
                <span class="section__badge">Snář</span>
                <h1 class="section__title">Sen o: <span class="text-gradient">${keyword}</span></h1>

                <div class="card">
                    <h2>Výklad snu</h2>
                    <p>${escapeHtml(dream.description)}</p>
                </div>
${longBlocks}

                <div class="card">
                    <h2>Otázky k zamyšlení</h2>
                    <p>Výklad ber jako jednu z možností a vztáhni ho k vlastní zkušenosti:</p>
                    <ul>
                        ${questions.map((question) => `<li>${escapeHtml(question)}</li>`).join('\n                        ')}
                    </ul>
                    <p>
                        Pokud si chceš sen uchovat, poznamenej si jeho děj a pocit, který v tobě zůstal.
                    </p>
                </div>
${faqBlock}

                <div class="card">
                    <h2>Pokračuj ve výkladu</h2>
                    <p>
                        <a href="../snar.html?source=snar_detail&feature=snar_vyklad" class="btn btn--primary">Vyložit celý sen ve snáři</a>
                        <a href="../tarot-karta-dne.html?source=snar_detail&feature=tarot_karta_dne" class="btn btn--secondary">Tarot karta dne</a>
                    </p>
                </div>

                <div class="card">
                    <h3>Související symboly</h3>
                    <div class="related-links">
                        ${related.map((other) => renderDreamChip(other, `${slugify(other.id)}.html`)).join('\n                        ')}
                    </div>
                    <p><a href="../snar.html">← Celý snář Mystické Hvězdy</a></p>
                </div>
            </div>
        </section>
    </main>

    <div id="footer-placeholder"></div>

    <script src="../js/dist/core.js?v=20261021-footer-support-locale" defer></script>${'\n\n    '}
    <script type="module" src="../js/dist/main.js?v=${MAIN_JS_VERSION}"></script>
</body>
</html>
`;
}

function renderHubLinks(dreams) {
    const startMarker = '<!-- SNAR-LINKS:START -->';
    const endMarker = '<!-- SNAR-LINKS:END -->';
    let html = fs.readFileSync(HUB_PATH, 'utf8');

    const links = dreams
        .map((dream) => renderDreamChip(dream, `snar/${slugify(dream.id)}.html`))
        .join('\n                        ');

    const section = `${startMarker}
                <section class="section" id="snar-vsechny-symboly">
                    <h2>Všechny snové symboly</h2>
                    <div class="related-links">
                        ${links}
                    </div>
                </section>
                ${endMarker}`;

    if (html.includes(startMarker) && html.includes(endMarker)) {
        const pattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);
        html = html.replace(pattern, section);
    } else {
        const anchor = '<div id="footer-placeholder"></div>';
        if (!html.includes(anchor)) {
            throw new Error('snar.html: cannot find footer placeholder to anchor the link hub.');
        }
        html = html.replace(anchor, `${section}\n\n    ${anchor}`);
    }

    return html;
}

function main() {
    const checkOnly = process.argv.includes('--check');
    const dreams = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    if (!Array.isArray(dreams)) throw new Error('data/dreams.json must be an array.');

    const seoContent = fs.existsSync(SEO_CONTENT_PATH)
        ? JSON.parse(fs.readFileSync(SEO_CONTENT_PATH, 'utf8'))
        : {};
    const missingContent = dreams.filter((dream) => !seoContent[dream.id]).length;
    if (missingContent) {
        console.warn(`[snar] ${missingContent} symbol(s) still without long-form content (base template used).`);
    }

    const seenSlugs = new Map();
    const staleFiles = [];
    let updated = 0;
    let generated = 0;

    if (!checkOnly) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    dreams.forEach((dream, index) => {
        const slug = slugify(dream.id);
        if (!slug) {
            console.warn(`[snar] Skipping dream with empty slug: ${dream.id}`);
            return;
        }
        if (seenSlugs.has(slug)) {
            console.warn(`[snar] Slug collision: ${dream.id} vs ${seenSlugs.get(slug)} — skipping ${dream.id}`);
            return;
        }
        seenSlugs.set(slug, dream.id);

        const outputPath = path.join(OUTPUT_DIR, `${slug}.html`);
        const expected = renderPage(dream, index, dreams, seoContent);
        generated++;

        if (checkOnly) {
            if (!fs.existsSync(outputPath) || !sameGeneratedContent(fs.readFileSync(outputPath, 'utf8'), expected)) {
                staleFiles.push(path.relative(ROOT, outputPath));
            }
        } else if (!fs.existsSync(outputPath) || !sameGeneratedContent(fs.readFileSync(outputPath, 'utf8'), expected)) {
            fs.writeFileSync(outputPath, expected, 'utf8');
            updated++;
        }
    });

    const expectedHub = renderHubLinks(dreams.filter((dream) => seenSlugs.get(slugify(dream.id)) === dream.id));
    if (checkOnly) {
        if (!fs.existsSync(HUB_PATH) || !sameGeneratedContent(fs.readFileSync(HUB_PATH, 'utf8'), expectedHub)) {
            staleFiles.push(path.relative(ROOT, HUB_PATH));
        }

        if (staleFiles.length) {
            const preview = staleFiles.slice(0, 20).join(', ');
            const remaining = staleFiles.length > 20 ? ` and ${staleFiles.length - 20} more` : '';
            console.error(`[snar] Check failed: ${staleFiles.length} generated file(s) need updates: ${preview}${remaining}`);
            process.exitCode = 1;
            return;
        }

        console.log(`[snar] Check passed: ${generated} dream pages and link hub are current; no files written.`);
        return;
    }

    let hubUpdated = false;
    if (!fs.existsSync(HUB_PATH) || !sameGeneratedContent(fs.readFileSync(HUB_PATH, 'utf8'), expectedHub)) {
        fs.writeFileSync(HUB_PATH, expectedHub, 'utf8');
        hubUpdated = true;
    }

    console.log(`[snar] Updated ${updated} of ${generated} dream pages; link hub ${hubUpdated ? 'updated' : 'unchanged'}.`);
}

main();
