/**
 * Create High-Converting Landing Pages for SEO Target Keywords
 * Optimized for organic search and conversion
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// High-intent keyword landing pages
const landingPages = [
  {
    slug: 'tarot-online-cz',
    filename: 'tarot-online.html',
    title: 'Tarot Online - Bezplatné Čtení Tarotu Online | Mystická Hvězda',
    description: 'Zadarmo tarot čtení online od expertek. Okamžité interpretace, jednoduché rozložení a hluboké vhledy. Žádný poplatek, bez registrace.',
    keywords: 'tarot online, čtení tarotu, tarot zdarma, tarot čtení online',
    h1: 'Tarot Online - Bezplatné Čtení Tarotu s Okamžitou Interpretací',
    content: [
      {
        type: 'section',
        title: 'Proč zvolit náš tarot?',
        content: `
          <ul>
            <li>✨ Zcela bezplatné čtení tarotu</li>
            <li>🎯 Přesné a detailní interpretace</li>
            <li>⚡ Okamžité výsledky bez čekání</li>
            <li>🔒 Zcela anonymní a soukromé</li>
            <li>📱 Funguje na všech zařízeních</li>
          </ul>
        `
      },
      {
        type: 'cta',
        text: 'Začít s Tarotem',
        link: '/tarot.html',
        variant: 'primary'
      },
      {
        type: 'faq',
        items: [
          {
            q: 'Kolik stojí tarot čtení?',
            a: 'Naše tarot čtení je zcela zdarma. Není potřeba kredit či registrace.'
          },
          {
            q: 'Je tarot přesný?',
            a: 'Tarot je nástrojem sebepoznání a sebereflexe. Interpretace závisí na otevřenosti a intuici.'
          },
          {
            q: 'Jak funguje online tarot?',
            a: 'Vyberete si karty, náš algoritmus je interpretuje a poskytuje vám podrobný výklad.'
          }
        ]
      }
    ]
  },
  {
    slug: 'horoskop-zdarma-cz',
    filename: 'horoskop-zdarma.html',
    title: 'Horoskop Zdarma - Denní Horoskop Online | Mystická Hvězda',
    description: 'Přečtěte si váš horoskop denně. Bezplatný horoskop pro všechna znamení se specifickými předpověďmi.',
    keywords: 'horoskop, horoskop dnes, denní horoskop, horoskop zdarma',
    h1: 'Horoskop Zdarma - Personalizovaný Denní Horoskop pro Vaše Znamení',
    content: [
      {
        type: 'section',
        title: 'Personalizovaný Horoskop',
        content: `
          <p>Vyberte své znamení a obdržejte denní horoskop s předpověďmi pro:</p>
          <ul>
            <li>💼 Kariéra a práce</li>
            <li>❤️ Láska a vztahy</li>
            <li>💰 Finance a bohatství</li>
            <li>💪 Zdraví a wellness</li>
            <li>🌟 Osobní rozvoj</li>
          </ul>
        `
      },
      {
        type: 'cta',
        text: 'Zjistit můj horoskop',
        link: '/horoskopy.html',
        variant: 'primary'
      }
    ]
  },
  {
    slug: 'numerologie-kalkulacka',
    filename: 'numerologie-kalkulacka.html',
    title: 'Numerologická Kalkulačka - Zjistěte Vaše Číslo Osudu | Mystická Hvězda',
    description: 'Bezplatná numerologická kalkulačka. Zjistěte své číslo osudu, číslo života a více s detailní interpretací.',
    keywords: 'numerologie, číslo osudu, numerologická kalkulačka, číslo života',
    h1: 'Numerologická Kalkulačka - Zjistěte Tajemství Vašeho Čísla',
    content: [
      {
        type: 'section',
        title: 'Co numerologie odhaluje?',
        content: `
          <p>Numerologie je starobylá věda o symbolickém významu čísel. Pomocí vaného jména a data narození zjistíme:</p>
          <ul>
            <li>🎯 Vaše číslo osudu (životní cíl)</li>
            <li>💫 Číslo vnitřní sily (skryté talent)</li>
            <li>🌀 Číslo osobnosti (jak vás vidí ostatní)</li>
            <li>🚀 Číslo karmy (vaše životní lekce)</li>
          </ul>
        `
      },
      {
        type: 'cta',
        text: 'Vypočítat můj profil',
        link: '/numerologie.html',
        variant: 'primary'
      }
    ]
  },
  {
    slug: 'sladev-partneru',
    filename: 'sladev-partneru.html',
    title: 'Slučitelnost Partnerů - Astrologická Analýza Vztahu | Mystická Hvězda',
    description: 'Zjistěte astrologickou slučitelnost vašeho vztahu. Analýza kompatibility znamení, planet a více.',
    keywords: 'slučitelnost partnerů, kompatibilita znamení, astrologická analýza vztahu',
    h1: 'Slučitelnost Partnerů - Objevte Astrologickou Dynamiku Vašeho Vztahu',
    content: [
      {
        type: 'section',
        title: 'Pochopte svůj vztah hlouběji',
        content: `
          <p>Astrologie nám pomáhá porozumět dynamice našich vztahů. Analýza slučitelnosti ukazuje:</p>
          <ul>
            <li>🌙 Kompatibilitu slunečních znamení</li>
            <li>💖 Slučitelnost měsíčních znamení (emoce)</li>
            <li>🪐 Pozici planet v obou horoskopech</li>
            <li>✨ Silné a slabé stránky vztahu</li>
            <li>🔮 Predikce budoucího vývoje</li>
          </ul>
        `
      },
      {
        type: 'cta',
        text: 'Zjistit slučitelnost',
        link: '/partnerska-shoda.html',
        variant: 'primary'
      }
    ]
  }
];

// HTML template generator
function generateLandingPageHTML(page) {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${page.description}">
    <meta name="keywords" content="${page.keywords}">
    <title>${page.title}</title>

    <!-- Canonical URL -->
    <link rel="canonical" href="https://mystickahvezda.cz/${page.filename}">

    <!-- Open Graph Tags -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${page.title}">
    <meta property="og:description" content="${page.description}">
    <meta property="og:url" content="https://mystickahvezda.cz/${page.filename}">
    <meta property="og:image" content="https://mystickahvezda.cz/img/og-image.webp">
    <meta property="og:locale" content="cs_CZ">

    <!-- Styles -->
    <link rel="stylesheet" href="/css/style.css">
    <style>
        .landing-hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 20px;
            text-align: center;
            margin-bottom: 40px;
        }

        .landing-hero h1 {
            font-size: 2.5rem;
            margin-bottom: 20px;
            line-height: 1.2;
        }

        .landing-hero p {
            font-size: 1.2rem;
            margin-bottom: 30px;
            opacity: 0.95;
        }

        .landing-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        .landing-section {
            margin-bottom: 40px;
            background: #f9f7f4;
            padding: 30px;
            border-radius: 8px;
        }

        .landing-section h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.8rem;
        }

        .landing-section ul {
            list-style: none;
            padding: 0;
        }

        .landing-section li {
            padding: 10px 0;
            font-size: 1.1rem;
            line-height: 1.6;
        }

        .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 40px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.1rem;
            margin: 20px 0;
            transition: background 0.3s;
        }

        .cta-button:hover {
            background: #764ba2;
        }

        .faq-section {
            background: white;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
        }

        .faq-item {
            margin-bottom: 20px;
        }

        .faq-item strong {
            color: #667eea;
            display: block;
            margin-bottom: 10px;
        }

        .breadcrumb {
            padding: 20px;
            background: #f0f0f0;
            border-radius: 4px;
            margin-bottom: 30px;
        }

        .breadcrumb a {
            color: #667eea;
            text-decoration: none;
            margin: 0 5px;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <header class="navbar">
        <nav class="navbar-container">
            <a href="/" class="navbar-brand">Mystická Hvězda</a>
            <button class="navbar-toggle" aria-label="Toggle navigation">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <ul class="navbar-menu">
                <li><a href="/">Domů</a></li>
                <li><a href="/horoskopy.html">Horoskop</a></li>
                <li><a href="/tarot.html">Tarot</a></li>
                <li><a href="/numerologie.html">Numerologie</a></li>
                <li><a href="/cenik.html">Ceny</a></li>
            </ul>
        </nav>
    </header>

    <!-- Breadcrumb Navigation -->
    <div class="breadcrumb">
        <a href="/">Domů</a> / <span>${page.h1}</span>
    </div>

    <!-- Hero Section -->
    <section class="landing-hero">
        <h1>${page.h1}</h1>
        <p>${page.description}</p>
    </section>

    <!-- Main Content -->
    <main class="landing-content">
        ${page.content.map(section => {
            if (section.type === 'section') {
                return \`<section class="landing-section">
                    <h2>\${section.title}</h2>
                    \${section.content}
                </section>\`;
            } else if (section.type === 'cta') {
                return \`<div style="text-align: center;">
                    <a href="\${section.link}" class="cta-button">\${section.text}</a>
                </div>\`;
            } else if (section.type === 'faq') {
                return \`<div class="landing-section">
                    <h2>Často kladené otázky</h2>
                    \${section.items.map(item => \`<div class="faq-item">
                        <strong>Q: \${item.q}</strong>
                        <p>A: \${item.a}</p>
                    </div>\`).join('')}
                </div>\`;
            }
            return '';
        }).join('')}
    </main>

    <!-- Footer -->
    <footer class="footer">
        <p>&copy; 2026 Mystická Hvězda. Všechna práva vyhrazena.</p>
    </footer>

    <!-- Schema Markup -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "LandingPage",
        "name": "${page.title}",
        "description": "${page.description}",
        "url": "https://mystickahvezda.cz/${page.filename}",
        "mainEntity": {
            "@type": "WebPage",
            "name": "${page.h1}"
        }
    }
    </script>
</body>
</html>`;
}

// Generate all landing pages
console.log('🎯 Creating high-converting landing pages...\n');

try {
  landingPages.forEach(page => {
    const filePath = path.join(rootDir, page.filename);
    const html = generateLandingPageHTML(page);

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Created: ${page.filename}`);
    console.log(`   Title: ${page.title}`);
    console.log(`   Keywords: ${page.keywords}\n`);
  });

  console.log('📊 Landing pages created successfully!\n');
  console.log('🚀 SEO Optimization Tips:');
  console.log('   1. Link to these pages from your blog');
  console.log('   2. Add internal links from feature pages');
  console.log('   3. Create backlinks from guest posts');
  console.log('   4. Track conversions in Google Analytics');
  console.log('   5. A/B test headlines and CTAs\n');

  console.log('📈 Expected impact:');
  console.log('   - Higher organic CTR from search results');
  console.log('   - Better conversion rates (landing pages convert 2-3x better)');
  console.log('   - Increased premium trial signups');
  console.log('   - Improved keyword rankings\n');

} catch (error) {
  console.error('❌ Error creating landing pages:', error.message);
  process.exit(1);
}
