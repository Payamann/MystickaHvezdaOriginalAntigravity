/**
 * Create High-Converting Landing Pages for SEO Target Keywords
 * Optimized for organic search and premium subscription conversion
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillAction } from '../skills/skill-framework.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Landing page definitions — copy follows CONVERSION-COPYWRITING-GUIDE.md
// KEY RULE: zero AI/algorithm mentions, mystical language only
const landingPages = [
  {
    filename: 'tarot-online.html',
    title: 'Tarot Online – Bezplatné Čtení Tarotu | Mystická Hvězda',
    description: 'Obdržte své osobní čtení tarotu zdarma. Hluboká interpretace karet, okamžité výsledky, zcela anonymně.',
    keywords: 'tarot online, čtení tarotu, tarot zdarma, tarot čtení online',
    h1: 'Tarot Online – Vaše Osobní Čtení Karet',
    content: [
      {
        type: 'section',
        title: 'Proč otevřít karty právě dnes?',
        content: `
          <ul>
            <li>✨ Bezplatné čtení pro každého</li>
            <li>🎯 Hluboké, osobní interpretace</li>
            <li>⚡ Výsledky ihned – žádné čekání</li>
            <li>🔒 Zcela anonymní a soukromé</li>
            <li>📱 Funguje na každém zařízení</li>
          </ul>
        `
      },
      {
        type: 'cta',
        text: 'Začít Čtení',
        link: '/tarot.html'
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Kolik stojí tarot čtení?',
            a: 'Naše základní čtení je zcela zdarma. Prémiové rozložení nabízíme jako součást předplatného.'
          },
          {
            q: 'Je čtení tarotu skutečně osobní?',
            a: 'Každá karta, kterou vyberete, je vedena vaší intuicí. Výklad pak odkryje poselství přímo pro vás.'
          },
          {
            q: 'Jak čtení tarotu funguje?',
            a: 'Soustředíte se na svou otázku, vyberete karty a my vám předložíme jejich hluboké, symbolické poselství.'
          }
        ]
      }
    ]
  },
  {
    filename: 'horoskop-zdarma.html',
    title: 'Horoskop Zdarma – Denní Kosmické Vedení | Mystická Hvězda',
    description: 'Zjistěte, co vám hvězdy připravily na dnešní den. Personalizovaný horoskop pro vaše znamení.',
    keywords: 'horoskop, horoskop dnes, denní horoskop, horoskop zdarma',
    h1: 'Denní Horoskop – Nechte Hvězdy Promluvit',
    content: [
      {
        type: 'section',
        title: 'Kosmické vedení pro každý den',
        content: `
          <p>Zjistěte, jaké energie vás dnes obklopují v oblastech:</p>
          <ul>
            <li>💼 Kariéra a životní poslání</li>
            <li>❤️ Láska a mezilidské vztahy</li>
            <li>💰 Finance a hojnost</li>
            <li>💪 Zdraví a vitalita</li>
            <li>🌟 Duchovní rozvoj</li>
          </ul>
        `
      },
      {
        type: 'cta',
        text: 'Zjistit Svůj Horoskop',
        link: '/horoskopy.html'
      }
    ]
  },
  {
    filename: 'numerologie-kalkulacka.html',
    title: 'Numerologická Kalkulačka – Číslo Osudu | Mystická Hvězda',
    description: 'Odhalte skryté poselství svého jména a data narození. Bezplatná numerologická analýza s hlubokou interpretací.',
    keywords: 'numerologie, číslo osudu, numerologická kalkulačka, číslo života',
    h1: 'Numerologická Kalkulačka – Odhalte Svůj Osud',
    content: [
      {
        type: 'section',
        title: 'Co čísla odhalují o vašem životě?',
        content: `
          <p>Numerologie je starodávná moudrost o posvátném jazyce čísel. Vaše jméno a datum narození skrývají:</p>
          <ul>
            <li>🎯 Číslo osudu – váš životní úkol</li>
            <li>💫 Číslo vnitřní síly – skrytý talent</li>
            <li>🌀 Číslo osobnosti – jak vás vnímá svět</li>
            <li>🚀 Karmické číslo – lekce této inkarnace</li>
          </ul>
        `
      },
      {
        type: 'cta',
        text: 'Odhalit Svá Čísla',
        link: '/numerologie.html'
      }
    ]
  },
  {
    filename: 'sladev-partneru.html',
    title: 'Slučitelnost Partnerů – Kosmická Analýza Vztahu | Mystická Hvězda',
    description: 'Prozkoumejte hlubokou astrologickou dynamiku vašeho vztahu. Zjistěte, co říkají hvězdy o vás a vašem partnerovi.',
    keywords: 'slučitelnost partnerů, kompatibilita znamení, astrologická analýza vztahu',
    h1: 'Slučitelnost Partnerů – Co Říkají Hvězdy o Vašem Vztahu',
    content: [
      {
        type: 'section',
        title: 'Poznejte svůj vztah do hloubky',
        content: `
          <p>Hvězdná mapa odhaluje hlubokou dynamiku vašeho spojení:</p>
          <ul>
            <li>🌙 Harmonie slunečních znamení</li>
            <li>💖 Emocionální ladění (Měsíc)</li>
            <li>🪐 Planetární aspekty v obou mapách</li>
            <li>✨ Silné stránky a výzvy vztahu</li>
            <li>🔮 Kosmický potenciál vašeho spojení</li>
          </ul>
        `
      },
      {
        type: 'cta',
        text: 'Zjistit Slučitelnost',
        link: '/partnerska-shoda.html'
      }
    ]
  }
];

function generateLandingPageHTML(page) {
  const sectionsHTML = page.content.map(section => {
    if (section.type === 'section') {
      return `<section class="landing-section">
  <h2>${section.title}</h2>
  ${section.content}
</section>`;
    }
    if (section.type === 'cta') {
      return `<div class="landing-cta">
  <a href="${section.link}" class="cta-button" data-track-cta="landing-page-main">${section.text}</a>
</div>`;
    }
    if (section.type === 'faq') {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": section.items.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": { "@type": "Answer", "text": item.a }
        }))
      };
      return `<section class="landing-section" id="faq">
  <h2>Časté otázky</h2>
  ${section.items.map(item => `<div class="faq-item">
    <strong>${item.q}</strong>
    <p>${item.a}</p>
  </div>`).join('\n  ')}
</section>
<script type="application/ld+json">${JSON.stringify(faqSchema, null, 2)}</script>`;
    }
    return '';
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <meta name="keywords" content="${page.keywords}">
  <link rel="canonical" href="https://mystickahvezda.cz/${page.filename}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="https://mystickahvezda.cz/${page.filename}">
  <meta property="og:image" content="https://mystickahvezda.cz/img/og-default.webp">
  <meta property="og:locale" content="cs_CZ">

  <link rel="stylesheet" href="/css/style.css">
  <style>
    .landing-hero{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:64px 20px;text-align:center}
    .landing-hero h1{font-size:2.4rem;margin-bottom:16px;line-height:1.2}
    .landing-hero p{font-size:1.15rem;opacity:.95;max-width:640px;margin:0 auto}
    .landing-content{max-width:800px;margin:0 auto;padding:40px 20px}
    .landing-section{background:#f9f7f4;border-radius:10px;padding:30px;margin-bottom:32px}
    .landing-section h2{color:#667eea;margin-bottom:16px;font-size:1.6rem}
    .landing-section ul{list-style:none;padding:0}
    .landing-section li{padding:8px 0;font-size:1.05rem;line-height:1.6}
    .landing-cta{text-align:center;margin:32px 0}
    .cta-button{display:inline-block;background:#667eea;color:#fff;padding:16px 44px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1.1rem;transition:background .25s}
    .cta-button:hover{background:#764ba2}
    .faq-item{margin-bottom:20px}
    .faq-item strong{color:#667eea;display:block;margin-bottom:6px}
    .breadcrumb{padding:12px 20px;font-size:.9rem;color:#666}
    .breadcrumb a{color:#667eea;text-decoration:none}
  </style>
</head>
<body data-feature="landing-${page.filename.replace('.html','')}">

  <div class="breadcrumb">
    <a href="/">Domů</a> › ${page.h1}
  </div>

  <header class="landing-hero">
    <h1>${page.h1}</h1>
    <p>${page.description}</p>
  </header>

  <main class="landing-content">
    ${sectionsHTML}
  </main>

  <footer style="text-align:center;padding:30px;color:#666;font-size:.9rem">
    <p>© 2026 Mystická Hvězda · <a href="/ochrana-soukromi.html">Ochrana soukromí</a> · <a href="/podminky.html">Podmínky</a></p>
  </footer>

  <script src="/js/analytics.js" defer></script>
</body>
</html>`;
}

function runCreateLandingPages() {
  let created = 0;
  for (const page of landingPages) {
    const filePath = path.join(rootDir, page.filename);
    fs.writeFileSync(filePath, generateLandingPageHTML(page), 'utf8');
    console.log(`✅ ${page.filename}`);
    created++;
  }
  return created;
}

/**
 * SKILL ACTION export
 */
export const createLandingPagesAction = new SkillAction({
  id: 'create-landing-pages',
  name: 'Create SEO Landing Pages',
  description: 'Generate high-converting landing pages for top organic keywords (tarot, horoscope, numerology, compatibility)',
  category: 'seo',
  priority: 'quick-win',
  estimatedTime: '10min',
  dependencies: [],
  metrics: ['organic_traffic', 'keyword_rankings', 'trial_conversion'],
  requirements: {},
  handler: async () => {
    console.log('\n🎯 Creating SEO Landing Pages\n');
    const created = runCreateLandingPages();
    console.log(`\n✅ ${created} landing pages created`);
    console.log('   Link to these from blog posts to drive organic traffic\n');
    return {
      pages_created: created,
      files: landingPages.map(p => p.filename),
      keywords_targeted: landingPages.map(p => p.keywords.split(',')[0].trim()),
      expected_impact: '2-3x higher conversion rate vs generic pages'
    };
  }
});

export default createLandingPagesAction;
