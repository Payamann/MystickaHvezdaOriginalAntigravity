#!/usr/bin/env node
/**
 * Generates static SEO pages for the name lexicon (jmena/<slug>.html)
 * from data/jmena.json, plus a static link hub inside jmena/index.html
 * between the JMENA-LINKS markers so crawlers can reach every page.
 *
 * Usage: node scripts/generate-jmena-pages.mjs
 * Idempotent: re-running overwrites generated pages in place.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'jmena.json');
const OUTPUT_DIR = path.join(ROOT, 'jmena');
const INDEX_PATH = path.join(OUTPUT_DIR, 'index.html');
const CANONICAL_ORIGIN = 'https://www.mystickahvezda.cz';
const LASTMOD = '2026-07-04';

const NUMEROLOGY_MEANINGS = {
    1: 'číslo lídra. Nese energii nových začátků, samostatnosti a odvahy jít vlastní cestou.',
    2: 'číslo diplomata. Nese energii spolupráce, citlivosti a hledání rovnováhy ve vztazích.',
    3: 'číslo tvořivosti. Nese energii radosti, komunikace a přirozeného sebevyjádření.',
    4: 'číslo stavitele. Nese energii řádu, vytrvalosti a pevných základů.',
    5: 'číslo svobody. Nese energii změny, zvědavosti a chuti objevovat nové.',
    6: 'číslo harmonie. Nese energii péče, odpovědnosti a lásky k blízkým.',
    7: 'číslo hledače. Nese energii intuice, analýzy a duchovní hloubky.',
    8: 'číslo síly. Nese energii ambicí, materiálního úspěchu a spravedlnosti.',
    9: 'číslo dokončení. Nese energii soucitu, moudrosti a služby druhým.',
    11: 'mistrovské číslo. Nese zesílenou intuici, inspiraci a duchovní citlivost.'
};

const ELEMENT_MEANINGS = {
    'Oheň': 'Ohnivá jména dodávají energii, spontánnost a odvahu jednat.',
    'Země': 'Zemská jména dávají stabilitu, praktičnost a smysl pro realitu.',
    'Vzduch': 'Vzdušná jména podporují komunikaci, myšlení a lehkost v kontaktu.',
    'Voda': 'Vodní jména prohlubují intuici, citlivost a vnímavost k druhým.'
};

function slugify(name) {
    return String(name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatNameday(nameday) {
    const match = /^(\d{1,2})\.(\d{1,2})$/.exec(String(nameday || '').trim());
    if (!match) return null;
    return `${Number(match[1])}. ${Number(match[2])}.`;
}

function buildDescription(name, entry) {
    const parts = [`Jméno ${name} má ${entry.origin} původ a znamená „${entry.meaning}“.`];
    const nameday = formatNameday(entry.nameday);
    if (nameday) parts.push(`Svátek slaví ${nameday}`);
    parts.push(`Numerologie jména: ${entry.numerology}, živel ${entry.element}.`);
    return parts.join(' ').slice(0, 158);
}

function pickRelatedNames(name, entry, allEntries) {
    const sameElement = [];
    const sameNumber = [];
    for (const [otherName, other] of allEntries) {
        if (otherName === name) continue;
        if (other.numerology === entry.numerology && sameNumber.length < 3) sameNumber.push(otherName);
        else if (other.element === entry.element && sameElement.length < 3) sameElement.push(otherName);
    }
    return [...sameNumber, ...sameElement].slice(0, 6);
}

function renderPage(name, entry, allEntries) {
    const slug = slugify(name);
    const pageUrl = `${CANONICAL_ORIGIN}/jmena/${slug}.html`;
    const safeName = escapeHtml(name);
    const description = escapeHtml(buildDescription(name, entry));
    const nameday = formatNameday(entry.nameday);
    const numerologyMeaning = NUMEROLOGY_MEANINGS[entry.numerology] || NUMEROLOGY_MEANINGS[9];
    const elementMeaning = ELEMENT_MEANINGS[entry.element] || '';
    const related = pickRelatedNames(name, entry, allEntries);

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Jméno ${name} — původ, význam a numerologie`,
        description: buildDescription(name, entry),
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
            { '@type': 'ListItem', position: 2, name: 'Databáze jmen', item: `${CANONICAL_ORIGIN}/jmena/` },
            { '@type': 'ListItem', position: 3, name: `Jméno ${name}`, item: pageUrl }
        ]
    }, null, 2);

    return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔮</text></svg>">
  <link rel="apple-touch-icon" href="../img/icon-192.webp">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Jméno ${safeName} — původ, význam a numerologie | Mystická Hvězda</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${pageUrl}">

    <meta property="og:type" content="article">
    <meta property="og:title" content="Jméno ${safeName} — původ, význam a numerologie | Mystická Hvězda">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${CANONICAL_ORIGIN}/img/hero-3d.webp">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:locale" content="cs_CZ">
    <meta name="twitter:card" content="summary_large_image">

    <script type="application/ld+json">${jsonLd}</script>
    <script type="application/ld+json">${breadcrumbLd}</script>
    <link rel="stylesheet" href="/fonts/local-fonts.css">
    <link rel="stylesheet" href="../css/style.v2.min.css?v=11">
    <link rel="stylesheet" href="../css/pages/jmena-index.css">
<script src="/js/dist/analytics-init.js" defer></script>
</head>
<body>
    <a href="#main-content" class="skip-link">Přeskočit na obsah</a>
    <div class="stars" aria-hidden="true"></div>
    <div id="header-placeholder"></div>

    <main id="main-content">
        <section class="section">
            <div class="container">
                <span class="section__badge">Lexikon Duší</span>
                <h1 class="section__title">Jméno <span class="text-gradient">${safeName}</span></h1>
                <p class="section__text">
                    Jméno ${safeName} má <strong>${escapeHtml(entry.origin)}</strong> původ a znamená
                    <strong>„${escapeHtml(entry.meaning)}“</strong>.${nameday ? ` Svátek slaví <strong>${nameday}</strong>` : ''}
                </p>

                <div class="card">
                    <h2>Duchovní profil jména</h2>
                    <ul>
                        <li><strong>Původ:</strong> ${escapeHtml(entry.origin)}</li>
                        <li><strong>Význam:</strong> ${escapeHtml(entry.meaning)}</li>
                        ${nameday ? `<li><strong>Svátek:</strong> ${nameday}</li>` : ''}
                        <li><strong>Numerologické číslo:</strong> ${entry.numerology}</li>
                        <li><strong>Barva aury:</strong> ${escapeHtml(entry.aura)}</li>
                        <li><strong>Živel:</strong> ${escapeHtml(entry.element)}</li>
                    </ul>
                </div>

                <div class="card">
                    <h2>Osobnost</h2>
                    <p>${escapeHtml(entry.personality)}</p>
                    <h3>❤️ Láska a vztahy</h3>
                    <p>${escapeHtml(entry.love)}</p>
                    <h3>💼 Kariéra</h3>
                    <p>Vhodná povolání: ${escapeHtml(entry.career)}.</p>
                </div>

                <div class="card">
                    <h2>Numerologie čísla ${entry.numerology}</h2>
                    <p>${entry.numerology} je ${escapeHtml(numerologyMeaning)}</p>
                    <p>${escapeHtml(elementMeaning)}</p>
                    <p>
                        Jméno je jen část příběhu — celý numerologický profil vychází z data narození.
                        <a href="../kalkulacka-cisla-osudu.html?source=jmena_detail&feature=numerologie_vyklad">Spočítej si své číslo osudu zdarma &rarr;</a>
                    </p>
                </div>

                <div class="card">
                    <h2>Pokračuj ve výkladu</h2>
                    <p>
                        <a href="../numerologie.html?source=jmena_detail&feature=numerologie_vyklad" class="btn btn--primary">Numerologický rozbor</a>
                        <a href="../vyznam-data-narozeni.html?source=jmena_detail" class="btn btn--secondary">Význam data narození</a>
                    </p>
                </div>

                <div class="card">
                    <h3>Podobná jména</h3>
                    <div class="related-links">
                        ${related.map((otherName) => `<a href="${slugify(otherName)}.html" class="related-chip">${escapeHtml(otherName)}</a>`).join('\n                        ')}
                    </div>
                    <p><a href="index.html">← Všechna jména v lexikonu</a></p>
                </div>
            </div>
        </section>
    </main>

    <div id="footer-placeholder"></div>

    <script src="../js/dist/api-config.js?v=5" defer></script>
    <script src="../js/dist/templates.js?v=14" defer></script>
    <script src="../js/dist/auth-client.js?v=20260522-recovery-flush" defer></script>
    <script src="../js/dist/components.js?v=20260522-premium-gate-cache" defer></script>
    <script type="module" src="../js/dist/main.js?v=10"></script>
</body>
</html>
`;
}

function updateIndexLinks(entries) {
    const startMarker = '<!-- JMENA-LINKS:START -->';
    const endMarker = '<!-- JMENA-LINKS:END -->';
    let html = fs.readFileSync(INDEX_PATH, 'utf8');

    const links = entries
        .map(([name]) => `<a href="${slugify(name)}.html" class="related-chip">${escapeHtml(name)}</a>`)
        .join('\n                        ');

    const section = `${startMarker}
                <section class="section" id="jmena-vsechna">
                    <h2>Všechna jména v lexikonu</h2>
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
            throw new Error('jmena/index.html: cannot find footer placeholder to anchor the link hub.');
        }
        html = html.replace(anchor, `${section}\n\n    ${anchor}`);
    }

    fs.writeFileSync(INDEX_PATH, html, 'utf8');
}

function main() {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b, 'cs'));

    const seenSlugs = new Map();
    let written = 0;

    for (const [name, entry] of entries) {
        const slug = slugify(name);
        if (!slug) {
            console.warn(`[jmena] Skipping name with empty slug: ${name}`);
            continue;
        }
        if (seenSlugs.has(slug)) {
            console.warn(`[jmena] Slug collision: ${name} vs ${seenSlugs.get(slug)} — skipping ${name}`);
            continue;
        }
        seenSlugs.set(slug, name);

        fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), renderPage(name, entry, entries), 'utf8');
        written++;
    }

    updateIndexLinks(entries.filter(([name]) => seenSlugs.get(slugify(name)) === name));
    console.log(`[jmena] Generated ${written} name pages + link hub in index.html.`);
}

main();
