#!/usr/bin/env node
/**
 * Generates static SEO pages for life-path numbers
 * (numerologie/zivotni-cislo-<n>.html) from data/numerology-numbers.json,
 * plus a static link hub inside kalkulacka-cisla-osudu.html between the
 * NUMEROLOGIE-LINKS markers.
 *
 * Usage: node scripts/generate-numerologie-pages.mjs [--check]
 * --check compares generated output without writing to the site.
 * Normal runs only write files whose contents actually changed.
 */
import fs from 'fs';
import {atlasShell} from './atlas-shell.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'numerology-numbers.json');
const OUTPUT_DIR = path.join(ROOT, 'numerologie');
const HUB_PATH = path.join(ROOT, 'kalkulacka-cisla-osudu.html');
const CANONICAL_ORIGIN = 'https://www.mystickahvezda.cz';
const LASTMOD = '2026-10-18';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildDescription(number, entry) {
    return `Životní číslo ${number} — ${entry.title}: ${entry.short}. Symbolické téma k zamyšlení, ne popis osobnosti ani předpověď.`;
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

    return atlasShell(`<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/img/icons/mh-favicon.svg">
  <link rel="apple-touch-icon" href="../img/icon-192.webp">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Životní číslo ${number}: ${escapeHtml(entry.title)} — význam | Mystická Hvězda</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${pageUrl}">

    <meta property="og:type" content="article">
    <meta property="og:title" content="Životní číslo ${number}: ${escapeHtml(entry.title)} | Mystická Hvězda">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${CANONICAL_ORIGIN}/img/search-preview/numerology.webp">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:locale" content="cs_CZ">
    <meta name="twitter:card" content="summary_large_image">

    <script type="application/ld+json">${jsonLd}</script>
    <script type="application/ld+json">${breadcrumbLd}</script>
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
                <span class="section__badge">Numerologie</span>
                <h1 class="section__title">Životní číslo <span class="text-gradient">${number}</span> — ${escapeHtml(entry.title)}</h1>
                <p class="section__text"><strong>${escapeHtml(entry.short)}.</strong> ${escapeHtml(entry.meaning)}</p>
                <p>Numerologické výklady jsou symbolické. Neověřují osobnost, vztahovou shodu ani budoucnost; ber si z nich jen témata, která dávají smysl ve světle tvé skutečné zkušenosti.</p>

                <div class="card">
                    <h2>Symbolická témata</h2>
                    <p>${escapeHtml(entry.strengths)}</p>
                    <h3>Druhá strana tématu</h3>
                    <p>${escapeHtml(entry.shadow)}</p>
                </div>

                <div class="card">
                    <h2>Otázka pro vztahy</h2>
                    <p>${escapeHtml(entry.relationships)}</p>
                    <h3>Otázka pro práci a směr</h3>
                    <p>${escapeHtml(entry.career)}</p>
                </div>

                <div class="card">
                    <h2>Malý další krok</h2>
                    <p>${escapeHtml(entry.advice)}</p>
                </div>

                <div class="card">
                    <h2>Nevíš, jaké je tvoje životní číslo?</h2>
                    <p>Naše kalkulačka redukuje den, měsíc a rok zvlášť, v mezikrocích ponechává 11, 22 a 33 a pak redukuje jejich součet. Jiné numerologické školy mohou počítat jinak.</p>
                    <p>
                        <a href="../kalkulacka-cisla-osudu.html?source=numerology_number_detail&feature=numerologie_vyklad" class="btn btn--primary">Spočítat číslo životní cesty zdarma</a>
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

    <script src="../js/dist/core.js?v=20261021-footer-support-locale" defer></script>
    <script type="module" src="../js/dist/main.js?v=10"></script>
</body>
</html>
`, 'atlas-content-page atlas-content-detail', 'atlas-content.css');
}

function renderHubLinks(numbers, data) {
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

    return html;
}

function main() {
    const checkOnly = process.argv.includes('--check');
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('data/numerology-numbers.json must contain an object keyed by life-path number.');
    }

    const numbers = Object.keys(data).sort((a, b) => Number(a) - Number(b));
    if (!checkOnly) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const staleFiles = [];
    let updated = 0;

    for (const number of numbers) {
        const outputPath = path.join(OUTPUT_DIR, `zivotni-cislo-${number}.html`);
        const expected = renderPage(number, data[number], numbers);

        if (checkOnly) {
            if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== expected) {
                staleFiles.push(path.relative(ROOT, outputPath));
            }
        } else if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== expected) {
            fs.writeFileSync(outputPath, expected, 'utf8');
            updated++;
        }
    }

    const expectedHub = renderHubLinks(numbers, data);
    if (checkOnly) {
        if (!fs.existsSync(HUB_PATH) || fs.readFileSync(HUB_PATH, 'utf8') !== expectedHub) {
            staleFiles.push(path.relative(ROOT, HUB_PATH));
        }

        if (staleFiles.length) {
            const preview = staleFiles.slice(0, 20).join(', ');
            const remaining = staleFiles.length > 20 ? ` and ${staleFiles.length - 20} more` : '';
            console.error(`[numerologie] Check failed: ${staleFiles.length} generated file(s) need updates: ${preview}${remaining}`);
            process.exitCode = 1;
            return;
        }

        console.log(`[numerologie] Check passed: ${numbers.length} life-path pages and link hub are current; no files written.`);
        return;
    }

    let hubUpdated = false;
    if (!fs.existsSync(HUB_PATH) || fs.readFileSync(HUB_PATH, 'utf8') !== expectedHub) {
        fs.writeFileSync(HUB_PATH, expectedHub, 'utf8');
        hubUpdated = true;
    }

    console.log(`[numerologie] Updated ${updated} of ${numbers.length} life-path pages; link hub ${hubUpdated ? 'updated' : 'unchanged'}.`);
}

main();
