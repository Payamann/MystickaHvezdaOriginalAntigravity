import fs from 'fs';
import {atlasShell} from '../../scripts/atlas-shell.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import ZODIAC_SIGNS from '../data/zodiac-signs.js';
import { refreshCssAssetReferences } from '../../scripts/lib/release-css-versions.mjs';
import { refreshRuntimeAssetReferences } from '../../scripts/lib/release-runtime-versions.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../');
const OUTPUT_DIR = path.join(ROOT, 'horoskop');
const SITEMAP_ENTRIES_PATH = path.join(ROOT, 'data/zodiac-sitemap.json');
const SEO_OVERRIDES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/zodiac-seo-overrides.json'), 'utf8'));

const checkOnly = process.argv.includes('--check');
if (!checkOnly && !fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function buildPage(sign) {
    const seo = SEO_OVERRIDES[sign.slug] || {};
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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${seo.title || `${sign.name} znamení (${sign.en}): vlastnosti, láska a kompatibilita`}</title>
    <meta name="description" content="${seo.description || `${sign.name} znamení česky: období ${sign.dates}, vlastnosti, láska, silné stránky, slabiny a kompatibilita. Navazuje na osobní horoskop.`}">
    <meta name="robots" content="index, follow">

    <!-- Open Graph -->
    <meta property="og:title" content="${seo.og_title || `${sign.name} znamení (${sign.en}): vlastnosti a láska`}">
    <meta property="og:description" content="${seo.og_description || `${sign.name} znamení: období, povaha, láska, silné stránky, slabiny a kompatibilita s dalšími znameními.`}">
    <meta property="og:type" content="article">
    <meta property="og:image" content="${seo.og_image || 'https://www.mystickahvezda.cz/img/search-preview/horoscopes.webp'}">
    <meta property="og:url" content="https://www.mystickahvezda.cz/horoskop/${sign.slug}.html">
    <link rel="canonical" href="https://www.mystickahvezda.cz/horoskop/${sign.slug}.html">

    <!-- Fonts & Styles -->
    <link rel="stylesheet" href="/fonts/local-fonts.css">
    <link rel="stylesheet" href="../css/style.v2.css">
    <link rel="stylesheet" href="../css/pages/horoskop-znameni.css">

    <script type="application/ld+json">${faqSchema}</script>
</head>
<body>
    <div class="stars" aria-hidden="true"></div>
    <header class="header">
        <div class="container">
            <div class="header__inner">
                <a href="../index.html" class="logo">
                    <span class="sign-logo-text">Mystická<span class="text-gradient">Hvězda</span></span>
                </a>
                <nav class="nav">
                    <button class="nav__toggle" aria-label="Menu"><span></span><span></span><span></span></button>
                    <ul class="nav__list">
                        <li><a href="../index.html" class="nav__link">Domů</a></li>
                        <li><a href="../horoskopy.html" class="nav__link active">Horoskopy</a></li>
                        <li><a href="../blog.html" class="nav__link">Blog</a></li>
                        <li><a href="../slovnik.html" class="nav__link">Slovník</a></li>
                        <li><a href="../natalni-karta.html" class="nav__link">Natální Karta</a></li>
                        <li><a href="../tarot.html" class="nav__link">Tarot</a></li>
                    </ul>
                    <div class="auth-buttons sign-auth-buttons">
                        <a href="#" id="auth-register-btn" class="btn btn--secondary sign-register-btn">Registrace</a>
                        <a href="#" id="auth-btn" class="btn btn--primary">Přihlásit</a>
                    </div>
                </nav>
            </div>
        </div>
    </header>

    <main>
        <section class="sign-hero">
            <div class="container">
                <div class="bread"><a href="../index.html">Domů</a> &raquo; <a href="../horoskopy.html">Horoskopy</a> &raquo; ${sign.name}</div>
                <span class="sign-hero__art" aria-hidden="true"></span>
                <span class="sign-emoji">${sign.emoji.replace(/[\uFE0E\uFE0F]/g, '')}︎</span>
                <h1 class="hero__title">${sign.name} <span class="text-gradient">(${sign.en})</span></h1>
                <p class="sign-dates">📅 ${sign.dates}</p>

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
                            <h3>✅ Silné stránky</h3>
                            <ul>${strengthsList}</ul>
                        </div>
                        <div class="traits-card weaknesses">
                            <h3>⚠️ Slabé stránky</h3>
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
            </div>
        </div>
    </footer>

    <script src="../js/dist/api-config.js" defer></script>
    <script src="../js/dist/auth-client.js?v=20260522-recovery-flush" defer></script>
    <script src="../js/dist/components.js" defer></script>
    <script type="module" src="../js/dist/main.js"></script>
</body>
</html>`, 'atlas-astro-page', 'atlas-astro.css');

    const alt = seo.image_alt || `${sign.name} znamení zvěrokruhu`;
    const imageMeta = `\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${seo.og_image}">\n<meta property="og:image:alt" content="${alt}">\n<meta name="twitter:image:alt" content="${alt}">`;
    return html
        .replace('<head>', '<head>\n<link rel="icon" type="image/svg+xml" href="/img/icons/mh-favicon.svg">')
        .replace('    <link rel="stylesheet" href="/css/atlas-web.css?v=20261023-release-todo">', `${imageMeta}\n    <link rel="stylesheet" href="/css/atlas-web.css?v=20261023-release-todo">`)
        .replace(/(<link rel="stylesheet" href="\/css\/atlas-astro\.css[^"]*">)/, '$1\n    <link rel="stylesheet" href="/css/pages/horoskop-znameni-art-v1.css?v=1">')
        .replace(/<header\b[^>]*class="header"[^>]*>[\s\S]*?<\/header>/i, '<div id="header-placeholder"></div>')
        .replace(/<body([^>]*)>/i, `<body$1 data-sign="${sign.slug}">`)
        .replace(/(<div class="bread">[\s\S]*?<\/div>)\s*(<span class="sign-hero__art")/, '$1\n                $2')
        .replace(/(<p>© 2026 Mystická Hvězda\. Všechna práva vyhrazena\.<\/p>)/, '$1\n                <p class="footer__support-line">Podpora: <a href="mailto:support@mystickahvezda.cz">support@mystickahvezda.cz</a></p>');
}

const sitemapEntries = [];
const checkDrift = [];

function writeGenerated(filePath, expected) {
    expected = refreshCssAssetReferences(expected);
    expected = refreshRuntimeAssetReferences(expected);
    if (checkOnly) {
        if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== expected) checkDrift.push(path.relative(ROOT, filePath));
        return;
    }
    fs.writeFileSync(filePath, expected, 'utf8');
}

for (const sign of ZODIAC_SIGNS) {
    const html = buildPage(sign);
    const outPath = path.join(OUTPUT_DIR, `${sign.slug}.html`);
    writeGenerated(outPath, html);
    if (!checkOnly) console.log(`✅ Vygenerováno: /horoskop/${sign.slug}.html`);

    if (sign.slug === 'vodnar') {
        const legacyHtml = html.replace(
            '<meta name="robots" content="index, follow">',
            '<meta name="robots" content="noindex, follow">'
        );
        writeGenerated(path.join(OUTPUT_DIR, 'vodnár.html'), legacyHtml);
        if (!checkOnly) console.log('✅ Vygenerováno: /horoskop/vodnár.html (legacy noindex)');
    }

    sitemapEntries.push({ url: `/horoskop/${sign.slug}.html`, changefreq: 'weekly', priority: '0.8' });
}

writeGenerated(SITEMAP_ENTRIES_PATH, JSON.stringify(sitemapEntries, null, 2));
if (checkOnly && checkDrift.length) {
    console.error(`[zodiac] Check failed: ${checkDrift.length} generated file(s) differ: ${checkDrift.slice(0, 20).join(', ')}`);
    process.exitCode = 1;
} else if (checkOnly) {
    console.log(`[zodiac] Check passed: ${ZODIAC_SIGNS.length} sign pages and sitemap current; no files written.`);
} else {
    console.log(`\n🗺️  Sitemap data uložena: data/zodiac-sitemap.json`);
    console.log(`🎉 Vygenerováno ${ZODIAC_SIGNS.length} stránek znamení!`);
}
