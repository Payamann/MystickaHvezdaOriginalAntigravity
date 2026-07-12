#!/usr/bin/env node
/**
 * Generates static SEO pages for the dream dictionary (snar/<slug>.html)
 * from data/dreams.json, plus a static link hub inside snar.html between
 * the SNAR-LINKS markers so crawlers can reach every page.
 *
 * Usage: node scripts/generate-snar-pages.mjs
 * Idempotent: re-running overwrites generated pages in place.
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
        `Jakou emoci ve mně symbol „${keyword}“ ve snu vyvolal — klid, napětí, touhu, nebo strach?`,
        `Kde se v mém bdělém životě právě teď objevuje téma, které mi „${keyword}“ může zrcadlit?`,
        `Co by se změnilo, kdybych poselství tohoto snu vzal vážně jen na jeden den?`
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

function renderPage(dream, index, dreams, seoContent) {
    const slug = slugify(dream.id);
    const pageUrl = `${CANONICAL_ORIGIN}/snar/${slug}.html`;
    const keyword = escapeHtml(dream.keyword);
    const description = escapeHtml(buildDescription(dream));
    const related = pickRelated(index, dreams);
    const questions = buildQuestions(dream);
    const longContent = seoContent[dream.id] || null;

    const faqEntries = [
        {
            question: `Co znamená sen o: ${lowerKeyword(dream.keyword)}?`,
            answer: dream.description
        },
        ...(longContent ? [
            {
                question: `Jak symbol „${lowerKeyword(dream.keyword)}“ vykládá psychologie snů?`,
                answer: longContent.psychological
            },
            {
                question: `Kdy je sen o: ${lowerKeyword(dream.keyword)} varováním?`,
                answer: longContent.warning
            }
        ] : [])
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
                    <h2>Psychologický pohled</h2>
                    <p>${escapeHtml(longContent.psychological)}</p>
                </div>

                <div class="card">
                    <h2>Duchovní a mystický výklad</h2>
                    <p>${escapeHtml(longContent.spiritual)}</p>
                </div>

                <div class="card">
                    <h2>Nejčastější podoby snu</h2>
                    <p>${escapeHtml(longContent.variants)}</p>
                </div>

                <div class="card">
                    <h2>Kdy zpozornět</h2>
                    <p>${escapeHtml(longContent.warning)}</p>
                </div>` : '';

    const faqBlock = longContent ? `
                <div class="card">
                    <h2>Časté otázky</h2>
                    ${faqEntries.map(({ question, answer }) => `<h3>${escapeHtml(question)}</h3>
                    <p>${escapeHtml(answer)}</p>`).join('\n                    ')}
                </div>` : '';

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Sen o: ${dream.keyword} — výklad snu`,
        description: buildDescription(dream),
        url: pageUrl,
        dateModified: LASTMOD,
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
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔮</text></svg>">
  <link rel="apple-touch-icon" href="../img/icon-192.webp">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Sen o: ${keyword} — výklad snu | Snář Mystická Hvězda</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${pageUrl}">

    <meta property="og:type" content="article">
    <meta property="og:title" content="Sen o: ${keyword} — výklad snu | Mystická Hvězda">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${CANONICAL_ORIGIN}/img/hero-3d.webp">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:locale" content="cs_CZ">
    <meta name="twitter:card" content="summary_large_image">

    <script type="application/ld+json">${jsonLd}</script>
    <script type="application/ld+json">${breadcrumbLd}</script>
    <script type="application/ld+json">${faqLd}</script>
    <link rel="stylesheet" href="/fonts/local-fonts.css">
    <link rel="stylesheet" href="../css/style.v2.min.css?v=11">
<script src="/js/dist/analytics-init.js" defer></script>
</head>
<body>
    <a href="#main-content" class="skip-link">Přeskočit na obsah</a>
    <div class="stars" aria-hidden="true"></div>
    <div id="header-placeholder"></div>

    <main id="main-content">
        <section class="section">
            <div class="container">
                <span class="section__badge">Snář</span>
                <h1 class="section__title">${dream.emoji ? `${dream.emoji} ` : ''}Sen o: <span class="text-gradient">${keyword}</span></h1>

                <div class="card">
                    <h2>Výklad snu</h2>
                    <p>${escapeHtml(dream.description)}</p>
                </div>

${longBlocks}

                <div class="card">
                    <h2>Otázky k zamyšlení</h2>
                    <p>Symbol má vždy osobní vrstvu. Než výklad přijmeš, polož si tři otázky:</p>
                    <ul>
                        ${questions.map((question) => `<li>${escapeHtml(question)}</li>`).join('\n                        ')}
                    </ul>
                    <p>
                        Sen se vyplatí zapsat co nejdřív po probuzení — detaily mizí během minut.
                        Klíčová je emoce, se kterou ses probudil, ne jen samotný symbol.
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
                        ${related.map((other) => `<a href="${slugify(other.id)}.html" class="related-chip">${other.emoji ? `${other.emoji} ` : ''}${escapeHtml(other.keyword)}</a>`).join('\n                        ')}
                    </div>
                    <p><a href="../snar.html">← Celý snář Mystické Hvězdy</a></p>
                </div>
            </div>
        </section>
    </main>

    <div id="footer-placeholder"></div>

    <script src="../js/dist/core.js?v=1" defer></script>
    <script type="module" src="../js/dist/main.js?v=10"></script>
</body>
</html>
`;
}

function updateHubLinks(dreams) {
    const startMarker = '<!-- SNAR-LINKS:START -->';
    const endMarker = '<!-- SNAR-LINKS:END -->';
    let html = fs.readFileSync(HUB_PATH, 'utf8');

    const links = dreams
        .map((dream) => `<a href="snar/${slugify(dream.id)}.html" class="related-chip">${dream.emoji ? `${dream.emoji} ` : ''}${escapeHtml(dream.keyword)}</a>`)
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

    fs.writeFileSync(HUB_PATH, html, 'utf8');
}

function main() {
    const dreams = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const seoContent = fs.existsSync(SEO_CONTENT_PATH)
        ? JSON.parse(fs.readFileSync(SEO_CONTENT_PATH, 'utf8'))
        : {};
    const missingContent = dreams.filter((dream) => !seoContent[dream.id]).length;
    if (missingContent) {
        console.warn(`[snar] ${missingContent} symbol(s) still without long-form content (base template used).`);
    }
    if (!Array.isArray(dreams)) throw new Error('data/dreams.json must be an array.');

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const seenSlugs = new Map();
    let written = 0;

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

        fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), renderPage(dream, index, dreams, seoContent), 'utf8');
        written++;
    });

    updateHubLinks(dreams.filter((dream) => seenSlugs.get(slugify(dream.id)) === dream.id));
    console.log(`[snar] Generated ${written} dream pages + link hub in snar.html.`);
}

main();
