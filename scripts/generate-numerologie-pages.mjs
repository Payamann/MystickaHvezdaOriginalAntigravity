#!/usr/bin/env node
/**
 * Generates static SEO pages for life-path numbers
 * (numerologie/zivotni-cislo-<n>.html) from data/numerology-numbers.json,
 * plus a static link hub inside kalkulacka-cisla-osudu.html between the
 * NUMEROLOGIE-LINKS markers.
 *
 * Usage: node scripts/generate-numerologie-pages.mjs
 * Idempotent: re-running overwrites generated pages in place.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'numerology-numbers.json');
const OUTPUT_DIR = path.join(ROOT, 'numerologie');
const HUB_PATH = path.join(ROOT, 'kalkulacka-cisla-osudu.html');
const CANONICAL_ORIGIN = 'https://www.mystickahvezda.cz';
const LASTMOD = '2026-07-04';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildDescription(number, entry) {
    return `Životní číslo ${number} — ${entry.title}: ${entry.short}. ${entry.meaning}`.slice(0, 158);
}

function renderPage(number, entry, allNumbers) {
    const slug = `zivotni-cislo-${number}`;
    const pageUrl = `${CANONICAL_ORIGIN}/numerologie/${slug}.html`;
    const description = escapeHtml(buildDescription(number, entry));
    const related = allNumbers.filter((other) => other !== number).slice(0, 12);

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Životní číslo ${number} (${entry.title}) — význam v numerologii`,
        description: buildDescription(number, entry),
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
            { '@type': 'ListItem', position: 2, name: 'Numerologie', item: `${CANONICAL_ORIGIN}/numerologie.html` },
            { '@type': 'ListItem', position: 3, name: `Životní číslo ${number}`, item: pageUrl }
        ]
    }, null, 2);

    return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔮</text></svg>">
  <link rel="apple-touch-icon" href="../img/icon-192.webp">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Životní číslo ${number}: ${escapeHtml(entry.title)} — význam | Mystická Hvězda</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${pageUrl}">

    <meta property="og:type" content="article">
    <meta property="og:title" content="Životní číslo ${number}: ${escapeHtml(entry.title)} | Mystická Hvězda">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${CANONICAL_ORIGIN}/img/hero-3d.webp">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:locale" content="cs_CZ">
    <meta name="twitter:card" content="summary_large_image">

    <script type="application/ld+json">${jsonLd}</script>
    <script type="application/ld+json">${breadcrumbLd}</script>
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
                <span class="section__badge">Numerologie</span>
                <h1 class="section__title">Životní číslo <span class="text-gradient">${number}</span> — ${escapeHtml(entry.title)}</h1>
                <p class="section__text"><strong>${escapeHtml(entry.short)}.</strong> ${escapeHtml(entry.meaning)}</p>

                <div class="card">
                    <h2>Silné stránky čísla ${number}</h2>
                    <p>${escapeHtml(entry.strengths)}</p>
                    <h3>Stinná stránka</h3>
                    <p>${escapeHtml(entry.shadow)}</p>
                </div>

                <div class="card">
                    <h2>❤️ Vztahy</h2>
                    <p>${escapeHtml(entry.relationships)}</p>
                    <h3>💼 Kariéra</h3>
                    <p>${escapeHtml(entry.career)}</p>
                </div>

                <div class="card">
                    <h2>Doporučení pro číslo ${number}</h2>
                    <p>${escapeHtml(entry.advice)}</p>
                </div>

                <div class="card">
                    <h2>Nevíš, jaké je tvoje životní číslo?</h2>
                    <p>Spočítá se z celého data narození. Zabere to pár vteřin a je to zdarma.</p>
                    <p>
                        <a href="../kalkulacka-cisla-osudu.html?source=numerology_number_detail&feature=numerologie_vyklad" class="btn btn--primary">Spočítat číslo osudu zdarma</a>
                        <a href="../numerologie.html?source=numerology_number_detail&feature=numerologie_vyklad" class="btn btn--secondary">Kompletní numerologický rozbor</a>
                    </p>
                </div>

                <div class="card">
                    <h3>Ostatní životní čísla</h3>
                    <div class="related-links">
                        ${related.map((other) => `<a href="zivotni-cislo-${other}.html" class="related-chip">Číslo ${other}</a>`).join('\n                        ')}
                    </div>
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

function updateHubLinks(numbers, data) {
    const startMarker = '<!-- NUMEROLOGIE-LINKS:START -->';
    const endMarker = '<!-- NUMEROLOGIE-LINKS:END -->';
    let html = fs.readFileSync(HUB_PATH, 'utf8');

    const links = numbers
        .map((number) => `<a href="numerologie/zivotni-cislo-${number}.html" class="related-chip">Číslo ${number} — ${escapeHtml(data[number].title)}</a>`)
        .join('\n                        ');

    const section = `${startMarker}
                <section class="section" id="vyznam-zivotnich-cisel">
                    <h2>Význam jednotlivých životních čísel</h2>
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
            throw new Error('kalkulacka-cisla-osudu.html: cannot find footer placeholder to anchor the link hub.');
        }
        html = html.replace(anchor, `${section}\n\n    ${anchor}`);
    }

    fs.writeFileSync(HUB_PATH, html, 'utf8');
}

function main() {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const numbers = Object.keys(data).sort((a, b) => Number(a) - Number(b));

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    for (const number of numbers) {
        fs.writeFileSync(
            path.join(OUTPUT_DIR, `zivotni-cislo-${number}.html`),
            renderPage(number, data[number], numbers),
            'utf8'
        );
    }

    updateHubLinks(numbers, data);
    console.log(`[numerologie] Generated ${numbers.length} life-path pages + link hub in kalkulacka-cisla-osudu.html.`);
}

main();
