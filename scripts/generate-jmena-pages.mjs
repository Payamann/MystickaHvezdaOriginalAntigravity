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
const NUMEROLOGY_DATA_PATH = path.join(ROOT, 'data', 'numerology-numbers.json');
const OUTPUT_DIR = path.join(ROOT, 'jmena');
const INDEX_PATH = path.join(OUTPUT_DIR, 'index.html');
const CANONICAL_ORIGIN = 'https://www.mystickahvezda.cz';
const LASTMOD = '2026-07-11';

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

const NUMEROLOGY_PROFILES = JSON.parse(fs.readFileSync(NUMEROLOGY_DATA_PATH, 'utf8'));

// Zodiac seasons by nameday date: [nominativ, genitiv, element, from(m,d), to(m,d)]
const ZODIAC_SEASONS = [
    ['Beran', 'Berana', 'Oheň', [3, 21], [4, 19]],
    ['Býk', 'Býka', 'Země', [4, 20], [5, 20]],
    ['Blíženci', 'Blíženců', 'Vzduch', [5, 21], [6, 20]],
    ['Rak', 'Raka', 'Voda', [6, 21], [7, 22]],
    ['Lev', 'Lva', 'Oheň', [7, 23], [8, 22]],
    ['Panna', 'Panny', 'Země', [8, 23], [9, 22]],
    ['Váhy', 'Vah', 'Vzduch', [9, 23], [10, 22]],
    ['Štír', 'Štíra', 'Voda', [10, 23], [11, 21]],
    ['Střelec', 'Střelce', 'Oheň', [11, 22], [12, 21]],
    ['Kozoroh', 'Kozoroha', 'Země', [12, 22], [1, 19]],
    ['Vodnář', 'Vodnáře', 'Vzduch', [1, 20], [2, 18]],
    ['Ryby', 'Ryb', 'Voda', [2, 19], [3, 20]]
];

// How the name's element meets the element of its nameday zodiac season.
const ELEMENT_INTERPLAY = {
    'Oheň|Oheň': 'Dvojitý oheň — energie jména se v této sezóně násobí. Svátek bývá dnem, kdy máš chuť začínat nové věci.',
    'Oheň|Země': 'Oheň jména se opírá o zemskou sezónu — impulz dostává pevný základ. Dobrá kombinace pro dotahování rozdělaných plánů.',
    'Oheň|Vzduch': 'Vzduch rozdmýchává oheň — kolem svátku bývá tvoje energie viditelnější a přitahuje pozornost okolí.',
    'Oheň|Voda': 'Voda sezóny učí oheň jména trpělivosti. Svátek je dobrý moment zpomalit a naslouchat intuici víc než obvykle.',
    'Země|Oheň': 'Ohnivá sezóna rozproudí zemskou stálost jména — kolem svátku přichází chuť změnit něco, co dlouho stojí.',
    'Země|Země': 'Dvojitá země — svátek padá do sezóny, která přeje praktickým krokům, financím a všemu, co má růst pomalu a jistě.',
    'Země|Vzduch': 'Vzdušná sezóna přináší zemskému jménu nové kontakty a nápady. Kolem svátku se vyplatí říkat věci nahlas.',
    'Země|Voda': 'Voda vyživuje zemi — svátek v této sezóně podporuje vztahy, domov a vše, o co dlouhodobě pečuješ.',
    'Vzduch|Oheň': 'Ohnivá sezóna dává vzdušnému jménu odvahu jednat, ne jen přemýšlet. Kolem svátku se rozhoduj rychleji.',
    'Vzduch|Země': 'Zemská sezóna uzemňuje myšlenky vzdušného jména — dobrý čas přetavit nápady do konkrétního plánu.',
    'Vzduch|Vzduch': 'Dvojitý vzduch — svátek přeje komunikaci, psaní a setkáním, která posunou tvoje plány dál.',
    'Vzduch|Voda': 'Vodní sezóna dodává vzdušnému jménu hloubku. Kolem svátku vnímáš pod povrch slov — věř prvnímu dojmu.',
    'Voda|Oheň': 'Ohnivá sezóna prohřívá vodní citlivost jména — emoce kolem svátku neschovávej, mají teď tah i směr.',
    'Voda|Země': 'Zemská sezóna dává vodnímu jménu břehy — svátek je dobrý čas proměnit pocity v konkrétní rozhodnutí.',
    'Voda|Vzduch': 'Vzdušná sezóna pomáhá vodnímu jménu pojmenovat, co cítí. Kolem svátku piš, mluv, sdílej.',
    'Voda|Voda': 'Dvojitá voda — svátek padá do sezóny, kdy je tvoje intuice nejsilnější. Sny a synchronicity ber vážně.'
};

// Cornerstone: what the first letter's Pythagorean value says about how the name "starts".
const CORNERSTONE_TRAITS = {
    1: 'začíná energií jedničky — první krok, iniciativa, odvaha jít první',
    2: 'začíná energií dvojky — vnímavost, takt a schopnost číst druhé',
    3: 'začíná energií trojky — hravost, slova a přirozený projev',
    4: 'začíná energií čtyřky — řád, spolehlivost a pevná půda pod nohama',
    5: 'začíná energií pětky — zvědavost, pohyb a chuť zkoušet nové',
    6: 'začíná energií šestky — péče, odpovědnost a smysl pro blízké',
    7: 'začíná energií sedmičky — hloubka, otázky a vnitřní svět',
    8: 'začíná energií osmičky — ambice, výsledky a přirozená autorita',
    9: 'začíná energií devítky — soucit, nadhled a služba většímu celku'
};

const PYTHAGOREAN_VALUES = {
    a: 1, j: 1, s: 1,
    b: 2, k: 2, t: 2,
    c: 3, l: 3, u: 3,
    d: 4, m: 4, v: 4,
    e: 5, n: 5, w: 5,
    f: 6, o: 6, x: 6,
    g: 7, p: 7, y: 7,
    h: 8, q: 8, z: 8,
    i: 9, r: 9
};

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

function stripDiacritics(value) {
    return String(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function reduceNumber(value) {
    let n = value;
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
        n = String(n).split('').reduce((sum, digit) => sum + Number(digit), 0);
    }
    return n;
}

function zodiacForNameday(nameday) {
    const match = /^(\d{1,2})\.(\d{1,2})$/.exec(String(nameday || '').trim());
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    // Every zodiac span covers exactly two calendar months, so a date matches
    // either the from-month branch or the to-month branch (incl. Kozoroh 12→1).
    for (const [nominative, genitive, element, [fromM, fromD], [toM, toD]] of ZODIAC_SEASONS) {
        if ((month === fromM && day >= fromD) || (month === toM && day <= toD)) {
            return { nominative, genitive, element };
        }
    }
    return null;
}

function nameNumbers(name) {
    const letters = stripDiacritics(name).replace(/[^a-z]/g, '').split('');
    if (!letters.length) return null;
    const cornerstoneValue = PYTHAGOREAN_VALUES[letters[0]] || null;
    let vowelSum = 0;
    for (const letter of letters) {
        if (VOWELS.has(letter)) vowelSum += PYTHAGOREAN_VALUES[letter] || 0;
    }
    return {
        firstLetter: letters[0].toUpperCase(),
        cornerstoneValue,
        soulNumber: vowelSum > 0 ? reduceNumber(vowelSum) : null
    };
}

// Deterministic variant picker so re-runs are stable but neighbouring
// pages don't all open with the same sentence.
function hashPick(name, variants) {
    let hash = 0;
    for (const ch of String(name)) hash = (hash * 31 + ch.codePointAt(0)) % 997;
    return variants[hash % variants.length];
}

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

function buildFaqEntries(name, entry, nameday, zodiac) {
    const profile = NUMEROLOGY_PROFILES[String(entry.numerology)];
    const faq = [];
    if (nameday) {
        faq.push({
            question: `Kdy má ${name} svátek?`,
            answer: `${name} slaví svátek ${nameday}${zodiac ? `, tedy v období znamení ${zodiac.genitive}` : ''}.`
        });
    }
    faq.push({
        question: `Jaký je původ a význam jména ${name}?`,
        answer: `Jméno ${name} má ${entry.origin} původ a znamená „${entry.meaning}“.`
    });
    faq.push({
        question: `Jaké numerologické číslo má jméno ${name}?`,
        answer: `Jméno ${name} nese numerologické číslo ${entry.numerology}${profile ? ` — ${profile.title}: ${profile.short.toLowerCase()}` : ''}. Vibrace jména je jen část profilu, číslo osudu vychází z data narození.`
    });
    faq.push({
        question: `Jakou auru a živel má jméno ${name}?`,
        answer: `Jménu ${name} tradičně náleží ${entry.aura} barva aury a živel ${entry.element}. ${ELEMENT_MEANINGS[entry.element] || ''}`.trim()
    });
    return faq;
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
    const profile = NUMEROLOGY_PROFILES[String(entry.numerology)];
    const zodiac = zodiacForNameday(entry.nameday);
    const hidden = nameNumbers(name);
    const faqEntries = buildFaqEntries(name, entry, nameday, zodiac);

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

    const faqLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqEntries.map(({ question, answer }) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer }
        }))
    }, null, 2);

    const numerologyOpener = hashPick(name, [
        `Číslo ${entry.numerology} není jen statistika — je to vibrace, kterou jméno ${name} vnáší do každého představení, podpisu i oslovení.`,
        `Každé jméno zní na určité frekvenci. ${name} rezonuje s číslem ${entry.numerology} a to se promítá do toho, jak jeho nositele vnímá okolí.`,
        `V numerologii se jméno počítá písmeno po písmenu. U jména ${name} vychází číslo ${entry.numerology} — a to nese svůj vlastní příběh.`
    ]);

    const deepNumerologyBlock = profile ? `
                <div class="card">
                    <h2>Numerologie čísla ${entry.numerology} do hloubky</h2>
                    <p>${escapeHtml(numerologyOpener)}</p>
                    <p>${escapeHtml(profile.meaning)}</p>
                    <h3>✨ Silné stránky</h3>
                    <p>${escapeHtml(profile.strengths)}</p>
                    <h3>🌑 Stín čísla</h3>
                    <p>${escapeHtml(profile.shadow)}</p>
                    <h3>🤝 Ve vztazích</h3>
                    <p>${escapeHtml(profile.relationships)}</p>
                    <h3>🧭 Rada pro nositele jména</h3>
                    <p>${escapeHtml(profile.advice)}</p>
                    <p>
                        Jméno je jen část příběhu — celý numerologický profil vychází z data narození.
                        <a href="../kalkulacka-cisla-osudu.html?source=jmena_detail&feature=numerologie_vyklad">Spočítej si své číslo osudu zdarma &rarr;</a>
                    </p>
                </div>` : `
                <div class="card">
                    <h2>Numerologie čísla ${entry.numerology}</h2>
                    <p>${entry.numerology} je ${escapeHtml(numerologyMeaning)}</p>
                    <p>
                        Jméno je jen část příběhu — celý numerologický profil vychází z data narození.
                        <a href="../kalkulacka-cisla-osudu.html?source=jmena_detail&feature=numerologie_vyklad">Spočítej si své číslo osudu zdarma &rarr;</a>
                    </p>
                </div>`;

    const zodiacBlock = zodiac && nameday ? `
                <div class="card">
                    <h2>Svátek ve znamení ${escapeHtml(zodiac.genitive)}</h2>
                    <p>
                        ${safeName} slaví svátek <strong>${nameday}</strong> — v období, kdy Slunce prochází znamením
                        <strong>${escapeHtml(zodiac.nominative)}</strong> (živel ${escapeHtml(zodiac.element)}).
                        Jméno samo nese živel <strong>${escapeHtml(entry.element)}</strong>.
                    </p>
                    <p>${escapeHtml(ELEMENT_INTERPLAY[`${entry.element}|${zodiac.element}`] || '')}</p>
                    <p>
                        Chceš vědět, co tahle sezóna přináší právě tobě?
                        <a href="../horoskopy.html?source=jmena_detail">Přečti si aktuální horoskop &rarr;</a>
                    </p>
                </div>` : '';

    const hiddenNumbersBlock = hidden && hidden.cornerstoneValue ? `
                <div class="card">
                    <h2>Skrytá čísla ve jménu ${safeName}</h2>
                    <p>
                        Numerologie čte jméno po vrstvách. První písmeno — <strong>${escapeHtml(hidden.firstLetter)}</strong> —
                        je tzv. kámen úhelný: říká, jak jméno „startuje“. ${safeName} ${CORNERSTONE_TRAITS[hidden.cornerstoneValue] || ''}.
                    </p>
                    ${hidden.soulNumber ? `<p>
                        Samohlásky ve jménu tvoří <strong>číslo duše ${hidden.soulNumber}</strong>${NUMEROLOGY_PROFILES[String(hidden.soulNumber)] ? ` (${escapeHtml(NUMEROLOGY_PROFILES[String(hidden.soulNumber)].title)} — ${escapeHtml(NUMEROLOGY_PROFILES[String(hidden.soulNumber)].short.toLowerCase())})` : ''} —
                        vnitřní touhu, kterou jméno nese pod povrchem. Spolu s číslem jména ${entry.numerology} tak ${safeName} spojuje to,
                        jak působí navenek, s tím, co ho pohání zevnitř.
                    </p>` : ''}
                    <p>
                        Celý rozbor — včetně čísla osudu z data narození — najdeš v
                        <a href="../numerologie.html?source=jmena_detail&feature=numerologie_vyklad">numerologickém výkladu</a>.
                    </p>
                </div>` : '';

    const faqBlock = `
                <div class="card">
                    <h2>Časté otázky o jménu ${safeName}</h2>
                    ${faqEntries.map(({ question, answer }) => `<h3>${escapeHtml(question)}</h3>
                    <p>${escapeHtml(answer)}</p>`).join('\n                    ')}
                </div>`;

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
    <script type="application/ld+json">${faqLd}</script>
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
                    <p>${escapeHtml(elementMeaning)}</p>
                </div>

                <div class="card">
                    <h2>Osobnost</h2>
                    <p>${escapeHtml(entry.personality)}</p>
                    <h3>❤️ Láska a vztahy</h3>
                    <p>${escapeHtml(entry.love)}</p>
                    <h3>💼 Kariéra</h3>
                    <p>Vhodná povolání: ${escapeHtml(entry.career)}.</p>
                </div>

${deepNumerologyBlock}
${zodiacBlock}
${hiddenNumbersBlock}
${faqBlock}

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

    <script src="../js/dist/core.js?v=1" defer></script>
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
