#!/usr/bin/env node
/**
 * Generates static SEO pages for angel card meanings
 * (andelske-karty/<slug>.html) from data/angel-cards.json, plus a static
 * link hub inside andelske-karty.html between the ANDELSKE-LINKS markers.
 *
 * Usage: node scripts/generate-andelske-karty-pages.mjs
 * Idempotent: re-running overwrites generated pages in place.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'angel-cards.json');
const OUTPUT_DIR = path.join(ROOT, 'andelske-karty');
const HUB_PATH = path.join(ROOT, 'andelske-karty.html');
const CANONICAL_ORIGIN = 'https://www.mystickahvezda.cz';
const LASTMOD = '2026-07-04';

// Interpretive layer per archetype so each page carries more than the
// card's one-line message without inventing per-card claims.
const ARCHETYPE_MEANINGS = {
    strength: {
        label: 'Síla a ochrana',
        text: 'Karty síly a ochrany přicházejí ve chvílích, kdy potřebuješ pevnou půdu pod nohama. Připomínají, že odvaha není nepřítomnost strachu, ale krok navzdory němu — a že nejsi na těžké situace sám.',
        practice: 'Dnes udělej jeden krok, který odkládáš ze strachu. Malý stačí — důležitý je směr.'
    },
    healing: {
        label: 'Uzdravení',
        text: 'Karty uzdravení mluví k tělu i duši. Objevují se, když něco starého potřebuje odejít — únava, křivda nebo vzorec, který už neslouží. Uzdravení začíná přiznáním, že něco bolí.',
        practice: 'Polož si dnes otázku: co ve mně potřebuje odpočinek? A dopřej to tomu — bez výčitek.'
    },
    guidance: {
        label: 'Vedení a jasnost',
        text: 'Karty vedení přicházejí na křižovatkách. Nepřinášejí hotovou odpověď, ale zostřují vnitřní kompas — najednou je snazší rozlišit, co je tvoje cesta a co jen očekávání okolí.',
        practice: 'Zapiš si rozhodnutí, které řešíš, a k němu první odpověď, která tě napadne bez přemýšlení. To bývá ta tvoje.'
    },
    peace: {
        label: 'Mír a klid',
        text: 'Karty míru se objevují, když vnitřní hluk přehlušil tiché vědění. Zvou tě zpomalit — protože odpovědi, které hledáš v akci, často čekají v klidu.',
        practice: 'Najdi si dnes deset minut úplného ticha. Žádný telefon, žádný úkol. Jen dech.'
    },
    abundance: {
        label: 'Hojnost',
        text: 'Karty hojnosti připomínají, že přijímání je dovednost. Objevují se, když je čas přestat počítat, co chybí, a všimnout si, co už proudí — vděčnost otevírá dveře, kterými hojnost přichází.',
        practice: 'Napiš si večer tři věci, které dnes přišly samy — bez tvého úsilí. To je tvoje hojnost v akci.'
    },
    purpose: {
        label: 'Poslání a růst',
        text: 'Karty poslání se ukazují, když je čas na další krok v růstu. Nemusíš vidět celou cestu — stačí vidět další schod. Tvoje poslání se odhaluje chůzí, ne čekáním.',
        practice: 'Odpověz si: co bych dělal, kdyby mě nikdo nehodnotil? V odpovědi je kus tvého poslání.'
    },
    nature: {
        label: 'Příroda a rytmus',
        text: 'Karty přírody připomínají, že i ty máš svá roční období. Ne každý den je na setbu a ne každý na sklizeň — respektovat vlastní rytmus není lenost, ale moudrost.',
        practice: 'Vyjdi dnes aspoň na chvíli ven — beze spěchu a bez sluchátek. Nech přírodu srovnat tvoje tempo.'
    },
    love: {
        label: 'Láska a vztahy',
        text: 'Karty lásky mluví o všech jejích podobách — k partnerovi, k blízkým i k sobě. Objevují se, když srdce potřebuje změkčit: odpustit, otevřít se, nebo si říct o to, co potřebuje.',
        practice: 'Řekni dnes jednomu člověku konkrétně, co na něm máš rád. Nahlas, ne v duchu.'
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
    return `Andělská karta ${card.name} (${card.theme}): ${card.short_message}`.slice(0, 158);
}

function pickRelated(card, cards) {
    const sameArchetype = cards.filter((other) => other.id !== card.id && other.archetype === card.archetype);
    const others = cards.filter((other) => other.id !== card.id && other.archetype !== card.archetype);
    return [...sameArchetype, ...others].slice(0, 6);
}

function renderPage(card, cards) {
    const slug = slugify(card.id);
    const pageUrl = `${CANONICAL_ORIGIN}/andelske-karty/${slug}.html`;
    const description = escapeHtml(buildDescription(card));
    const archetype = ARCHETYPE_MEANINGS[card.archetype] || ARCHETYPE_MEANINGS.guidance;
    const related = pickRelated(card, cards);

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Andělská karta ${card.name} — význam a poselství`,
        description: buildDescription(card),
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
            { '@type': 'ListItem', position: 2, name: 'Andělské karty', item: `${CANONICAL_ORIGIN}/andelske-karty.html` },
            { '@type': 'ListItem', position: 3, name: card.name, item: pageUrl }
        ]
    }, null, 2);

    return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔮</text></svg>">
  <link rel="apple-touch-icon" href="../img/icon-192.webp">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${escapeHtml(card.name)} — význam andělské karty | Mystická Hvězda</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${pageUrl}">

    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(card.name)} — význam andělské karty | Mystická Hvězda">
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
                <span class="section__badge">Andělské karty</span>
                <h1 class="section__title">🕊️ <span class="text-gradient">${escapeHtml(card.name)}</span></h1>
                <p class="section__text"><strong>${escapeHtml(card.theme)}</strong></p>

                <div class="card">
                    <h2>Poselství karty</h2>
                    <p>${escapeHtml(card.short_message)}</p>
                </div>

                <div class="card">
                    <h2>Energie karty: ${escapeHtml(archetype.label)}</h2>
                    <p>${escapeHtml(archetype.text)}</p>
                    <h3>Jak s kartou dnes pracovat</h3>
                    <p>${escapeHtml(archetype.practice)}</p>
                </div>

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

    <script src="../js/dist/api-config.js?v=5" defer></script>
    <script src="../js/dist/templates.js?v=14" defer></script>
    <script src="../js/dist/auth-client.js?v=20260522-recovery-flush" defer></script>
    <script src="../js/dist/components.js?v=20260522-premium-gate-cache" defer></script>
    <script type="module" src="../js/dist/main.js?v=10"></script>
</body>
</html>
`;
}

function updateHubLinks(cards) {
    const startMarker = '<!-- ANDELSKE-LINKS:START -->';
    const endMarker = '<!-- ANDELSKE-LINKS:END -->';
    let html = fs.readFileSync(HUB_PATH, 'utf8');

    const links = cards
        .map((card) => `<a href="andelske-karty/${slugify(card.id)}.html" class="related-chip">${escapeHtml(card.name)}</a>`)
        .join('\n                        ');

    const section = `${startMarker}
                <section class="section" id="vyznamy-andelskych-karet">
                    <h2>Významy všech andělských karet</h2>
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
            throw new Error('andelske-karty.html: cannot find footer placeholder to anchor the link hub.');
        }
        html = html.replace(anchor, `${section}\n\n    ${anchor}`);
    }

    fs.writeFileSync(HUB_PATH, html, 'utf8');
}

function main() {
    const cards = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    if (!Array.isArray(cards)) throw new Error('data/angel-cards.json must be an array.');

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const seenSlugs = new Map();
    let written = 0;

    for (const card of cards) {
        const slug = slugify(card.id);
        if (!slug || seenSlugs.has(slug)) {
            console.warn(`[andelske-karty] Skipping invalid/duplicate slug: ${card.id}`);
            continue;
        }
        seenSlugs.set(slug, card.id);
        fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), renderPage(card, cards), 'utf8');
        written++;
    }

    updateHubLinks(cards.filter((card) => seenSlugs.get(slugify(card.id)) === card.id));
    console.log(`[andelske-karty] Generated ${written} card pages + link hub in andelske-karty.html.`);
}

main();
