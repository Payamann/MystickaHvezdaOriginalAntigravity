import fs from 'fs';
import {atlasShell} from '../../scripts/atlas-shell.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import ZODIAC_SIGNS from '../data/zodiac-signs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../');
const OUTPUT_DIR = path.join(ROOT, 'horoskop');
const SITEMAP_ENTRIES_PATH = path.join(ROOT, 'data/zodiac-sitemap.json');
const ZODIAC_ASSET_VERSIONS = Object.freeze({
    authClient: '20261020-02-register-password-policy',
    components: '20261021-footer-support-locale',
    main: '20261018-status-icons'
});

function isCurrent(filePath, expected) {
    if (!fs.existsSync(filePath)) return false;
    const normalizeTerminalNewline = (value) => value.replace(/\r\n/g, '\n').replace(/\n$/, '');
    return normalizeTerminalNewline(fs.readFileSync(filePath, 'utf8')) === normalizeTerminalNewline(expected);
}

function writeIfChanged(filePath, expected) {
    if (isCurrent(filePath, expected)) return false;
    fs.writeFileSync(filePath, expected, 'utf8');
    return true;
}

function firstLineDifference(filePath, expected) {
    if (!fs.existsSync(filePath)) {
        return {
            differences: 1,
            examples: [{ line: 1, current: '(file missing)', expected: expected.split(/\r?\n/, 1)[0]?.trim().slice(0, 180) || '(blank)' }]
        };
    }
    const currentLines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    const expectedLines = expected.split(/\r?\n/);
    const max = Math.max(currentLines.length, expectedLines.length);
    const preview = (value) => value === undefined ? '(missing)' : value.trim().slice(0, 180) || '(blank)';
    const examples = [];
    let differences = 0;
    for (let index = 0; index < max; index++) {
        if (currentLines[index] !== expectedLines[index]) {
            differences++;
            if (examples.length < 12) examples.push({
                line: index + 1,
                current: preview(currentLines[index]),
                expected: preview(expectedLines[index])
            });
        }
    }
    return differences ? { differences, examples } : null;
}

function buildPage(sign) {
    const seo = sign.seo || {};
    const pageTitle = seo.title || `${sign.name} znamení (${sign.en}): vlastnosti, láska a kompatibilita`;
    const pageDescription = seo.description || `${sign.name} znamení česky: období ${sign.dates}, vlastnosti, láska, silné stránky, slabiny a kompatibilita. Navazuje na osobní horoskop.`;
    const ogTitle = seo.og_title || `${sign.name} znamení (${sign.en}): vlastnosti a láska`;
    const ogDescription = seo.og_description || `${sign.name} znamení: období, povaha, láska, silné stránky, slabiny a kompatibilita s dalšími znameními.`;
    const strengthsList = sign.strengths.map(s => `<li>${s}</li>`).join('\n                    ');
    const weaknessesList = sign.weaknesses.map(w => `<li>${w}</li>`).join('\n                    ');
    const compatList = sign.compatible_signs.map(c => `
        <span class="sign-chip">${c}</span>`).join('');
    const luckyNums = sign.lucky_numbers.map(n => `<span class="sign-number">${n}</span>`).join(' ');
    const natalCtaLink = sign.natal_cta.link.includes('source=')
        ? sign.natal_cta.link
        : `${sign.natal_cta.link}?source=seo_zodiac_sign&feature=natal_chart&sign=${sign.slug}`;
    const answerSummary = sign.answer_summary
        || `${sign.name} je ${sign.en}, znamení zvěrokruhu pro období ${sign.dates}. Patří k elementu ${sign.element}, vládne mu ${sign.ruling_planet} a v astrologii popisuje základní temperament, vztahový styl a první vrstvu osobního horoskopu.`;

    const faqSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `Jaké jsou silné stránky znamení ${sign.name}?`,
                "acceptedAnswer": { "@type": "Answer", "text": sign.strengths.join(', ') }
            },
            {
                "@type": "Question",
                "name": `S jakými znameními je ${sign.name} nejkompatibilnější?`,
                "acceptedAnswer": { "@type": "Answer", "text": sign.compatible_signs.join(', ') }
            },
            {
                "@type": "Question",
                "name": `Kdy se rodí ${sign.name}?`,
                "acceptedAnswer": { "@type": "Answer", "text": sign.dates }
            }
        ]
    }, null, 2);

    const html = atlasShell(`<!DOCTYPE html>
<html lang="cs">
<head>
<link rel="icon" type="image/svg+xml" href="/img/icons/mh-favicon.svg">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${pageTitle}</title>
    <meta name="description" content="${pageDescription}">
    <meta name="robots" content="index, follow">

    <!-- Open Graph -->
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDescription}">
    <meta property="og:type" content="article">
    <meta property="og:image" content="https://www.mystickahvezda.cz/img/search-preview/horoscopes.webp">
    <meta property="og:url" content="https://www.mystickahvezda.cz/horoskop/${sign.slug}.html">
    <link rel="canonical" href="https://www.mystickahvezda.cz/horoskop/${sign.slug}.html">

    <!-- Fonts & Styles -->
    <link rel="stylesheet" href="/fonts/local-fonts.css">
    <link rel="stylesheet" href="../css/style.v2.css">
    <link rel="stylesheet" href="../css/pages/horoskop-znameni.css">

    <script type="application/ld+json">${faqSchema}</script>
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://www.mystickahvezda.cz/img/search-preview/horoscopes.webp">
<meta property="og:image:alt" content="${pageTitle}">
<meta name="twitter:image:alt" content="${pageTitle}">
</head>
<body>
    <a href="#main-content" class="skip-link">Přeskočit na obsah</a>
    <div id="header-placeholder"></div>

    <main id="main-content" tabindex="-1">
        <section class="sign-hero">
            <div class="container">
                <div class="bread"><a href="../index.html">Domů</a> &raquo; <a href="../horoskopy.html">Horoskopy</a> &raquo; ${sign.name}</div>
                <span class="sign-emoji" data-zodiac-sign="${sign.slug}" aria-hidden="true">${sign.emoji.replace(/[\uFE0E\uFE0F]/g, '')}︎</span>
                <h1 class="hero__title">${sign.name} <span class="text-gradient">(${sign.en})</span></h1>
                <p class="sign-dates"> ${sign.dates}</p>

                <div class="sign-answer-box">
                    <strong class="sign-answer-label">Rychlá odpověď:</strong>
                    ${answerSummary}
                </div>

                <div class="sign-meta-grid">
                    <div class="meta-card">
                        <div class="meta-label">Element</div>
                        <div class="meta-value">${sign.element}</div>
                    </div>
                    <div class="meta-card">
                        <div class="meta-label">Vládce</div>
                        <div class="meta-value">${sign.ruling_planet}</div>
                    </div>
                    <div class="meta-card">
                        <div class="meta-label">Modalita</div>
                        <div class="meta-value">${sign.modality}</div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section sign-section">
            <div class="container">
                <div class="sign-content">
                    <div class="sign-panel sign-panel--body">
                        ${sign.description}
                    </div>

                    <div class="traits-grid">
                        <div class="traits-card strengths">
                            <h3>Silné stránky</h3>
                            <ul>${strengthsList}</ul>
                        </div>
                        <div class="traits-card weaknesses">
                            <h3>Slabé stránky</h3>
                            <ul>${weaknessesList}</ul>
                        </div>
                    </div>

                    <div class="sign-panel">
                        <h2 class="sign-section-title">Partnerská kompatibilita</h2>
                        <p class="sign-muted">Znamení, se kterými ${sign.name} přirozeně rezonuje:</p>
                        <div>${compatList}</div>
                        <div class="sign-center-action">
                            <a href="${sign.featured_tool.link}" class="btn btn--secondary sign-secondary-cta">${sign.featured_tool.label}</a>
                        </div>
                    </div>

                    <div class="sign-panel">
                        <h2 class="sign-section-title">Šťastná čísla</h2>
                        <div class="sign-number-grid">${luckyNums}</div>
                    </div>

                    <div class="sign-cta-panel">
                        <h2 class="sign-cta-title">Vaše hvězdná mapa jde hlouběji</h2>
                        <p class="sign-cta-text">Sluneční znamení je jen jedno ze stovek bodů vaší Natální mapy. Zjistěte, kde skutečně leží váš Ascendent, Měsíc v znamení a pozice klíčových planet.</p>
                        <a href="${natalCtaLink}" class="btn btn--primary sign-primary-cta">${sign.natal_cta.label}</a>
                    </div>

                    <!-- FAQ Section -->
                    <div class="sign-faq">
                        <h2 class="sign-section-title">Nejčastější otázky o ${sign.name}</h2>
                        <div class="sign-faq-list">
                            <details class="sign-faq-item">
                                <summary class="sign-faq-summary">Kdy se rodí ${sign.name}?</summary>
                                <p class="sign-faq-answer">${sign.dates}</p>
                            </details>
                            <details class="sign-faq-item">
                                <summary class="sign-faq-summary">Jaký je element a vládce ${sign.name}?</summary>
                                <p class="sign-faq-answer">Element: <strong>${sign.element}</strong>. Vládnoucí planeta: <strong>${sign.ruling_planet}</strong>. Modalita: <strong>${sign.modality}</strong>.</p>
                            </details>
                            <details class="sign-faq-item sign-faq-item--last">
                                <summary class="sign-faq-summary">S jakými znameními je ${sign.name} nejkompatibilnější?</summary>
                                <p class="sign-faq-answer">Nejharmoničtější vztahy bývají se znameními: ${sign.compatible_signs.join(', ')}. Pro přesnou analýzu doporučujeme výpočet Synastrie (porovnání dvou Natálních map).</p>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer__bottom">
                <p>© 2026 Mystická Hvězda. Všechna práva vyhrazena.</p>

                <p class="footer__support-line">Podpora: <a href="mailto:support@mystickahvezda.cz">support@mystickahvezda.cz</a></p>
            </div>
        </div>
    </footer>

    <script src="../js/dist/api-config.js" defer></script>
    <script src="../js/dist/auth-client.js?v=${ZODIAC_ASSET_VERSIONS.authClient}" defer></script>
    <script src="../js/dist/components.js?v=${ZODIAC_ASSET_VERSIONS.components}" defer></script>
    <script type="module" src="../js/dist/main.js?v=${ZODIAC_ASSET_VERSIONS.main}"></script>
</body>
</html>`, 'atlas-astro-page', 'atlas-astro.css', '20261020-01-western-zodiac-image-cards');
    return html;
}

function main() {
    const checkOnly = process.argv.includes('--check');
    if (!Array.isArray(ZODIAC_SIGNS) || ZODIAC_SIGNS.length === 0) {
        throw new Error('Zodiac data must contain a non-empty array of signs.');
    }
    if (!checkOnly && !fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const expectedFiles = new Map();
    const sitemapEntries = [];
    const seenSlugs = new Set();

    for (const sign of ZODIAC_SIGNS) {
        if (!sign.slug || seenSlugs.has(sign.slug)) {
            throw new Error(`Missing or duplicate zodiac slug: ${sign.slug || '(empty)'}`);
        }
        seenSlugs.add(sign.slug);

        const html = buildPage(sign);
        expectedFiles.set(path.join(OUTPUT_DIR, `${sign.slug}.html`), html);

        sitemapEntries.push({ url: `/horoskop/${sign.slug}.html`, changefreq: 'weekly', priority: '0.8' });
    }

    expectedFiles.set(SITEMAP_ENTRIES_PATH, JSON.stringify(sitemapEntries, null, 2));

    if (checkOnly) {
        const staleFiles = [...expectedFiles.keys()].filter((filePath) => !isCurrent(filePath, expectedFiles.get(filePath)));
        if (staleFiles.length) {
            const preview = staleFiles.slice(0, 20).map((filePath) => path.relative(ROOT, filePath)).join(', ');
            const remaining = staleFiles.length > 20 ? ` and ${staleFiles.length - 20} more` : '';
            console.error(`[zodiac] Check failed: ${staleFiles.length} generated file(s) need updates: ${preview}${remaining}`);
            for (const filePath of staleFiles.slice(0, 3)) {
                const difference = firstLineDifference(filePath, expectedFiles.get(filePath));
                if (difference) {
                    console.error(`[zodiac] ${path.relative(ROOT, filePath)} has ${difference.differences} differing lines`);
                    for (const example of difference.examples) {
                        console.error(`[zodiac] line ${example.line}: current=${example.current} | expected=${example.expected}`);
                    }
                }
            }
            process.exitCode = 1;
            return;
        }

        console.log(`[zodiac] Check passed: ${ZODIAC_SIGNS.length} sign pages and sitemap are current; no files written.`);
        return;
    }

    let updated = 0;
    for (const [filePath, expected] of expectedFiles) {
        if (writeIfChanged(filePath, expected)) updated++;
    }
    console.log(`[zodiac] Updated ${updated} generated file(s) across ${ZODIAC_SIGNS.length} sign pages and sitemap.`);
}

main();
