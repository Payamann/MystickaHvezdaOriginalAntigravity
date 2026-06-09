/**
 * Programmatic Horoscope Day Pages
 * GET /horoskop/:sign/:date  → Server-rendered HTML page for SEO
 * GET /horoskop/:sign        → Redirects to today's date
 * GET /horoskop/sitemap-horoscopes.xml → Dynamic sitemap for Google
 *
 * Each sign+date combination is a unique, indexable URL targeting
 * long-tail searches like "horoskop štír 12 března 2026".
 */
import express from 'express';
import { getCachedHoroscope } from '../services/astrology.js';
import { normalizeHoroscopeAiResponse } from '../services/horoscope-response.js';
import { setHtmlContentSecurityPolicy } from '../utils/csp.js';

export const router = express.Router();
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://www.mystickahvezda.cz';

const SIGN_MAP = {
    'beran':    { name: 'Beran',    nameGen: 'Berana',    nameAcc: 'Berana',   symbol: '♈', dates: '21.3. – 19.4.' },
    'byk':      { name: 'Býk',      nameGen: 'Býka',      nameAcc: 'Býka',     symbol: '♉', dates: '20.4. – 20.5.' },
    'blizenci': { name: 'Blíženci', nameGen: 'Blíženců',  nameAcc: 'Blížence', symbol: '♊', dates: '21.5. – 20.6.' },
    'rak':      { name: 'Rak',      nameGen: 'Raka',      nameAcc: 'Raka',     symbol: '♋', dates: '21.6. – 22.7.' },
    'lev':      { name: 'Lev',      nameGen: 'Lva',       nameAcc: 'Lva',      symbol: '♌', dates: '23.7. – 22.8.' },
    'panna':    { name: 'Panna',    nameGen: 'Panny',     nameAcc: 'Pannu',    symbol: '♍', dates: '23.8. – 22.9.' },
    'vahy':     { name: 'Váhy',     nameGen: 'Vah',       nameAcc: 'Váhy',     symbol: '♎', dates: '23.9. – 22.10.' },
    'stir':     { name: 'Štír',     nameGen: 'Štíra',     nameAcc: 'Štíra',    symbol: '♏', dates: '23.10. – 21.11.' },
    'strelec':  { name: 'Střelec',  nameGen: 'Střelce',   nameAcc: 'Střelce',  symbol: '♐', dates: '22.11. – 21.12.' },
    'kozoroh':  { name: 'Kozoroh',  nameGen: 'Kozoroha',  nameAcc: 'Kozoroha', symbol: '♑', dates: '22.12. – 19.1.' },
    'vodnar':   { name: 'Vodnář',   nameGen: 'Vodnáře',   nameAcc: 'Vodnáře',  symbol: '♒', dates: '20.1. – 18.2.' },
    'ryby':     { name: 'Ryby',     nameGen: 'Ryb',       nameAcc: 'Ryby',     symbol: '♓', dates: '19.2. – 20.3.' },
};

const CZECH_MONTHS = ['ledna', 'února', 'března', 'dubna', 'května', 'června',
    'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

function formatCzechDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${day}. ${CZECH_MONTHS[month - 1]} ${year}`;
}

function shiftDate(dateStr, days) {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
}

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

function parseIsoDateStrict(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

    const targetDate = new Date(dateStr + 'T12:00:00Z');
    if (isNaN(targetDate.getTime())) return null;

    return targetDate.toISOString().split('T')[0] === dateStr ? targetDate : null;
}

const FALLBACK_THEMES = Object.freeze([
    {
        theme: 'jasných priorit',
        guidance: 'Vyber si jednu věc, která má skutečnou váhu, a dej jí přednost před drobným rozptýlením.',
        affirmation: 'Volím jasně a svou energii dávám tomu, co má pro mě opravdový význam.'
    },
    {
        theme: 'klidné odvahy',
        guidance: 'Udělej malý krok, který už delší dobu odkládáš, ale netlač na výsledek.',
        affirmation: 'Jednám odvážně, klidně a důvěřuji tempu, které je pro mě udržitelné.'
    },
    {
        theme: 'pravdivé komunikace',
        guidance: 'Pojmenuj své potřeby jednoduše a nech druhé odpovědět bez domýšlení jejich záměrů.',
        affirmation: 'Mluvím pravdivě a zároveň nechávám prostor pro porozumění.'
    },
    {
        theme: 'obnovy vnitřní rovnováhy',
        guidance: 'Vrať se k činnosti, po které se cítíš pevněji, a dopřej jí dnes konkrétní čas.',
        affirmation: 'Vrátím se k sobě pokaždé, když vědomě zvolím klid a jednoduchost.'
    },
    {
        theme: 'trpělivého dokončení',
        guidance: 'Nezačínej další úkol, dokud neposuneš alespoň o jeden krok to, co už máš otevřené.',
        affirmation: 'Dokončuji podstatné věci s trpělivostí a čistou pozorností.'
    },
    {
        theme: 'otevřenosti novému pohledu',
        guidance: 'Zkus se na známou situaci podívat očima člověka, který v ní nehledá chybu, ale možnost.',
        affirmation: 'Dovoluji si vidět nové možnosti tam, kde dříve byla jen překážka.'
    }
]);

function stableSeed(value) {
    let seed = 0;
    for (const character of value) {
        seed = ((seed * 31) + character.codePointAt(0)) >>> 0;
    }
    return seed;
}

function buildFallbackHoroscopePage(signData, dateStr) {
    const seed = stableSeed(`${signData.name}:${dateStr}`);
    const theme = FALLBACK_THEMES[seed % FALLBACK_THEMES.length];
    const luckyNumbers = [];

    for (let offset = 0; luckyNumbers.length < 4; offset += 1) {
        const number = ((seed + (offset * 11)) % 49) + 1;
        if (!luckyNumbers.includes(number)) luckyNumbers.push(number);
    }

    return {
        prediction: `Dne ${formatCzechDate(dateStr)} se pro ${signData.nameAcc} otevírá téma ${theme.theme}. ${theme.guidance} Večer si všimni, co se změnilo, když místo spěchu dostal prostor vědomý krok.`,
        affirmation: theme.affirmation,
        luckyNumbers
    };
}

// ============================================================
// DYNAMIC SITEMAP — /horoskop/sitemap-horoscopes.xml
// Covers last 60 days + next 7 days for all 12 signs
// ============================================================
router.get('/sitemap-horoscopes.xml', (req, res) => {
    const today = getTodayStr();
    const dates = [];
    for (let i = -60; i <= 7; i++) {
        dates.push(shiftDate(today, i));
    }

    const urls = [];
    for (const date of dates) {
        for (const slug of Object.keys(SIGN_MAP)) {
            const loc = `${SITE_ORIGIN}/horoskop/${slug}/${date}`;
            const priority = date === today ? '1.0' : date > today ? '0.6' : '0.7';
            urls.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`);
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=43200');
    res.send(xml);
});

// ============================================================
// REDIRECT /:sign → today's date
// ============================================================
router.get('/:sign', (req, res, next) => {
    const slug = req.params.sign.toLowerCase();
    if (!SIGN_MAP[slug]) return next();
    res.redirect(301, `/horoskop/${slug}/${getTodayStr()}`);
});

// ============================================================
// MAIN ROUTE — /horoskop/:sign/:date
// ============================================================
router.get('/:sign/:date', async (req, res, next) => {
    try {
        const slug = req.params.sign.toLowerCase();
        const date = req.params.date;

        const signData = SIGN_MAP[slug];
        if (!signData) return next();

        // Validate date format without allowing JS Date rollover, e.g. 2026-02-31.
        const targetDate = parseIsoDateStrict(date);
        if (!targetDate) return next();

        // Restrict range: 2 years back, 30 days forward
        const todayMs = Date.now();
        const diffDays = (targetDate.getTime() - todayMs) / 86400000;
        if (diffDays > 30 || diffDays < -730) return next();

        const todayStr = getTodayStr();
        const czechDate = formatCzechDate(date);

        // Cache key sjednocen s horoskopy.html — stejný klíč, stejný text, stejný model (Claude)
        const signNormalized = signData.name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cacheKey = `${signNormalized}_daily_${date}_v3-cs-nocontext`;

        // Try cache first
        let parsed;
        const cached = await getCachedHoroscope(cacheKey);
        if (cached) {
            try {
                ({ parsed } = normalizeHoroscopeAiResponse(cached.response));
            } catch {
                parsed = buildFallbackHoroscopePage(signData, date);
            }
        } else {
            // Public crawlable GET routes must never initiate paid AI requests.
            parsed = buildFallbackHoroscopePage(signData, date);
        }

        const prevDate = shiftDate(date, -1);
        const nextDate = shiftDate(date, 1);
        const hasNext = diffDays < 0;
        const isToday = date === todayStr;

        const canonicalUrl = `${SITE_ORIGIN}/horoskop/${slug}/${date}`;
        const titleStr = `Horoskop ${signData.nameGen} — ${czechDate} | Mystická Hvězda`;
        const prediction = parsed.prediction || '';
        const descStr = `Denní horoskop pro ${signData.nameAcc} na ${czechDate}. ${prediction.substring(0, 130).replace(/"/g, '&quot;')}…`;
        // Only index past+today, not future
        const robotsContent = diffDays > 7 ? 'noindex, follow' : 'index, follow';

        const luckyNumbersHtml = Array.isArray(parsed.luckyNumbers) && parsed.luckyNumbers.length
            ? `<div class="horoscope-day-lucky">
                <span class="horoscope-day-lucky__label">✨ Čísla štěstí:</span>
                ${parsed.luckyNumbers.map(n =>
                `<span class="horoscope-day-lucky__number">${Number(n)}</span>`
            ).join('')}
              </div>`
            : '';

        const affirmationHtml = parsed.affirmation
            ? `<div class="horoscope-day-affirmation">
                <p class="horoscope-day-affirmation__label">Afirmace dne</p>
                <p class="horoscope-day-affirmation__text">&ldquo;${parsed.affirmation}&rdquo;</p>
              </div>`
            : '';

        const otherSignsHtml = Object.entries(SIGN_MAP).map(([s, d]) =>
            `<a href="/horoskop/${s}/${date}" class="zodiac-card${s === slug ? ' zodiac-card--highlighted' : ''}">
                <span class="zodiac-card__symbol">${d.symbol}</span>
                <h3 class="zodiac-card__name">${d.name}</h3>
                <span class="zodiac-card__dates">${d.dates}</span>
             </a>`
        ).join('');

        const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${titleStr}</title>
  <meta name="description" content="${descStr}">
  <meta name="keywords" content="horoskop ${signData.name.toLowerCase()}, ${signData.name.toLowerCase()} horoskop, denní horoskop ${signData.name.toLowerCase()}, astrologie ${czechDate}">
  <meta name="robots" content="${robotsContent}">
  <meta name="theme-color" content="#0a0a1a">

  <meta property="og:type" content="article">
  <meta property="og:title" content="${titleStr}">
  <meta property="og:description" content="${descStr}">
  <meta property="og:image" content="${SITE_ORIGIN}/img/icon-zodiac.webp">
  <meta property="og:locale" content="cs_CZ">
  <meta property="og:url" content="${canonicalUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titleStr}">
  <meta name="twitter:description" content="${descStr}">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${titleStr.replace(/"/g, '\\"')}",
    "description": "${descStr.replace(/"/g, '\\"')}",
    "datePublished": "${date}T00:00:00+01:00",
    "dateModified": "${date}T00:00:00+01:00",
    "inLanguage": "cs",
    "publisher": {
      "@type": "Organization",
      "name": "Mystická Hvězda",
      "url": "${SITE_ORIGIN}"
    },
    "mainEntityOfPage": "${canonicalUrl}"
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Horoskopy", "item": "${SITE_ORIGIN}/horoskopy.html"},
      {"@type": "ListItem", "position": 2, "name": "${signData.name}", "item": "${SITE_ORIGIN}/horoskop/${slug}/${todayStr}"},
      {"@type": "ListItem", "position": 3, "name": "${czechDate}", "item": "${canonicalUrl}"}
    ]
  }
  </script>

  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="cs" href="${canonicalUrl}">
  <link rel="prev" href="${SITE_ORIGIN}/horoskop/${slug}/${prevDate}">
  ${hasNext ? `<link rel="next" href="${SITE_ORIGIN}/horoskop/${slug}/${nextDate}">` : ''}

  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${signData.symbol}</text></svg>">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/img/icon-192.webp">

  <!-- Local Fonts - Eliminates 750ms Google Fonts CDN latency -->
  <link rel="preload" href="/fonts/local-fonts.css" as="style">
  <link rel="stylesheet" href="/fonts/local-fonts.css">
  <link rel="stylesheet" href="/css/style.v2.min.css?v=11">
</head>
<body>
  <a href="#main-content" class="skip-link">Přeskočit na obsah</a>
  <div class="stars" aria-hidden="true"></div>
  <div id="header-placeholder"></div>

  <main id="main-content">

    <!-- HERO -->
    <section class="section section--hero horoscope-day-hero">
      <div class="container">
        <div class="hero__content">
          <nav aria-label="Drobečková navigace" class="horoscope-day-breadcrumb">
            <a href="/horoskopy.html" class="horoscope-day-breadcrumb__link">Horoskopy</a>
            <span class="horoscope-day-breadcrumb__separator">›</span>
            <a href="/horoskop/${slug}/${todayStr}" class="horoscope-day-breadcrumb__link">${signData.name}</a>
            <span class="horoscope-day-breadcrumb__separator">›</span>
            <span>${czechDate}</span>
          </nav>
          <p class="horoscope-day-symbol" aria-hidden="true">${signData.symbol}</p>
          <h1 class="hero__title horoscope-day-title">
            <span class="text-gradient">Horoskop ${signData.nameGen}</span>
          </h1>
          <p class="hero__subtitle horoscope-day-subtitle">${czechDate} • ${signData.dates}</p>
          ${isToday ? '<p class="horoscope-day-pill">✨ Dnešní předpověď</p>' : ''}
        </div>
      </div>
    </section>

    <!-- HOROSCOPE CONTENT -->
    <section class="section section--alt">
      <div class="container horoscope-day-content-container">
        <div class="card horoscope-day-card" data-animate>
          <span class="section__badge">Denní inspirace • ${signData.name} ${signData.symbol}</span>
          <h2 class="horoscope-day-heading">
            Co vám hvězdy říkají
          </h2>
          <p class="horoscope-day-prediction">${prediction}</p>
          ${affirmationHtml}
          ${luckyNumbersHtml}

          <!-- Day navigation -->
          <div class="horoscope-day-nav">
            <a href="/horoskop/${slug}/${prevDate}" class="btn btn--glass horoscope-day-nav__link">‹ Předchozí den</a>
            ${!isToday ? `<a href="/horoskop/${slug}/${todayStr}" class="horoscope-day-nav__today">→ Dnes</a>` : ''}
            ${hasNext ? `<a href="/horoskop/${slug}/${nextDate}" class="btn btn--glass horoscope-day-nav__link">Následující den ›</a>` : '<span></span>'}
          </div>
        </div>
      </div>
    </section>

    <!-- OTHER SIGNS SAME DAY -->
    <section class="section horoscope-day-section--flush">
      <div class="container">
        <h3 class="horoscope-day-other-title">
          Horoskop pro jiné znamení — ${czechDate}
        </h3>
        <div class="zodiac-grid" data-animate>
          ${otherSignsHtml}
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section horoscope-day-section--flush">
      <div class="container horoscope-day-cta-container">
        <div class="cta-banner" data-animate>
          <div class="cta-banner__content">
            <h2 class="cta-banner__title">Chcete osobnější výklad?</h2>
            <p class="cta-banner__text">Zadejte datum, čas a místo narození pro natální kartu, která doplní obecný horoskop o osobní kontext a konkrétní témata k sebereflexi.</p>
            <a href="/natalni-karta.html?source=seo_horoscope_day&feature=natalni_karta" class="btn btn--primary btn--lg">Vytvořit natální kartu</a>
          </div>
        </div>
      </div>
    </section>

  </main>

  <div id="footer-placeholder"></div>

  <script src="/js/dist/api-config.js?v=5" defer></script>
  <script src="/js/dist/templates.js?v=11" defer></script>
  <script src="/js/dist/auth-client.js?v=20260522-recovery-flush" defer></script>
  <script src="/js/dist/components.js?v=20260513-cookie-compact" defer></script>
  <script type="module" src="/js/dist/main.js?v=11"></script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        // Cache 1h browser, 24h CDN — content is stable once generated
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        setHtmlContentSecurityPolicy(res, html);
        res.send(html);

    } catch (err) {
        console.error('[HoroscopePage] Error:', err.message);
        next(err);
    }
});

export default router;
