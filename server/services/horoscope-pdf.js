import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';
import { callClaude } from './claude.js';
import { HOROSCOPE_VOICE_CONTRACTS } from '../config/prompts.js';
import { getChromiumLaunchOptions } from './chromium-launch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SIGN_NAMES = {
    beran: 'Beran', byk: 'Býk', blizenci: 'Blíženci', rak: 'Rak',
    lev: 'Lev', panna: 'Panna', vahy: 'Váhy', stir: 'Štír',
    strelec: 'Střelec', kozoroh: 'Kozoroh', vodnar: 'Vodnář', ryby: 'Ryby'
};

const SIGN_GLYPHS = {
    beran: '♈', byk: '♉', blizenci: '♊', rak: '♋',
    lev: '♌', panna: '♍', vahy: '♎', stir: '♏',
    strelec: '♐', kozoroh: '♑', vodnar: '♒', ryby: '♓'
};

export function isValidHoroscopeSign(sign) {
    return Object.prototype.hasOwnProperty.call(SIGN_NAMES, sign);
}

const SECTIONS = [
    { key: 'osobnost', title: 'Osobnost & Duše', icon: '✦' },
    { key: 'laska', title: 'Láska & Vztahy', icon: '♥' },
    { key: 'kariera', title: 'Kariéra & Finance', icon: '◆' },
    { key: 'rust', title: 'Osobní Růst', icon: '✦' },
    { key: 'mesice', title: 'Klíčové Měsíce', icon: '◐' },
    { key: 'slovo', title: 'Slovo pro', icon: '✧' },
];

/**
 * Calls Claude to generate 6-section personalized horoscope.
 * Returns an object with section keys → text.
 */
export async function generateHoroscopeContent({ name, birthDate, sign, year = new Date().getFullYear() }) {
    const safeInputName = String(name || 'Tazatel').substring(0, 100);
    const signName = SIGN_NAMES[sign] || sign;
    const systemPrompt = `${HOROSCOPE_VOICE_CONTRACTS.cs}U ročního výkladu vztahuj symboliku k období roku ${year}, nikoli jen k dnešku. Jsi hlas automaticky vytvářeného produktu Mystická Hvězda. Píšeš osobní roční astrologický výklad jako podnět k zamyšlení. Tón je vřelý, přímý, poetický a konkrétní, bez obecných kosmických frází.`;

    const userPrompt = `Napiš mi personalizovaný Roční Horoskop na míru ${year} pro:
Jméno: ${safeInputName}
Datum narození: ${birthDate}
Znamení: ${signName}

Horoskop musí mít přesně 6 sekcí. Každou sekci začni řádkem SEKCE:[klíč] a text sekce piš rovnou za ním (bez nadpisu). Klíče sekcí jsou přesně: osobnost, laska, kariera, rust, mesice, slovo

Výklad je symbolický rámec, ne ověřená informace ani jistá předpověď. Vycházej jen z dodaného znamení a data narození; nevymýšlej planetární aspekty, tranzity ani výpočty, které nejsou v zadání. Nepředpovídej konkrétní události, city jiné osoby ani jistý pracovní či finanční výsledek. Nedávej zdravotní, právní ani finanční doporučení. Piš jako možnosti k zamyšlení a respektuj svobodnou volbu čtenáře.

Pravidla pro každou sekci:
- osobnost: 120–150 slov. Nabídni možná témata silných stránek a vnitřního světa; datum ani znamení nevydávej za důkaz osobnostních rysů.
- laska: 120–150 slov. Zaměř se na komunikaci, potřeby a hranice ve vztazích. Nepiš, co konkrétně přijde nebo co cítí druhý člověk.
- kariera: 120–150 slov. Nabídni témata pracovních hodnot, dovedností a plánování. Nedoporučuj, kdy riskovat, šetřit nebo investovat.
- rust: 100–120 slov. Nabídni jedno téma k sebereflexi, ne jistou lekci nebo transformaci.
- mesice: Vypiš 4–5 měsíců roku ${year} s krátkým symbolickým tématem k zamyšlení (1–2 věty každý); nepředpovídej události.
- slovo: 80–100 slov. Závěrečné povzbuzení a jeden bezpečný praktický krok bez příslibu výsledku. Jméno ${safeInputName} použij přirozeně, ne v každé sekci.

Piš výhradně v češtině. Nepiš nadpisy sekcí, jen SEKCE:[klíč] a pak text.`;

    const raw = await callClaude(systemPrompt, userPrompt, null, {
        feature: 'annual_horoscope_pdf'
    });
    return parseSections(raw);
}

function parseSections(raw) {
    const result = {};
    const regex = /SEKCE:(\w+)\s*([\s\S]*?)(?=SEKCE:\w+|$)/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
        result[match[1].trim()] = match[2].trim();
    }
    return result;
}

/**
 * Renders the horoscope HTML and converts to PDF buffer via Playwright.
 */
export async function renderPdf({ name, sign, birthDate, sections, year = new Date().getFullYear() }) {
    const signName = SIGN_NAMES[sign] || sign;
    const glyph = SIGN_GLYPHS[sign] || '✦';
    const birthFormatted = new Date(birthDate).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = buildHtml({ name, signName, glyph, year, birthFormatted, sections });

    const browser = await chromium.launch(getChromiumLaunchOptions());
    // This PDF is static content only — JS is disabled so a maliciously crafted
    // name/AI section can never execute script inside the render context.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    await browser.close();
    return pdfBuffer;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function buildHtml({ name, signName, glyph, year = new Date().getFullYear(), birthFormatted, sections }) {
    const safeName = escapeHtml(name);
    const safeSignName = escapeHtml(signName);
    const safeBirthFormatted = escapeHtml(birthFormatted);

    const sectionHtml = SECTIONS.map(({ key, title, icon }) => {
        const sectionTitle = key === 'slovo' ? `${title} ${year}` : title;
        const text = escapeHtml(sections[key] || '');
        const isMonths = key === 'mesice';
        const formattedText = isMonths
            ? formatMonths(text)
            : `<p>${text.replace(/\n+/g, '</p><p>')}</p>`;

        return `
        <div class="section">
            <div class="section-header">
                <span class="section-icon">${icon}</span>
                <h2 class="section-title">${sectionTitle}</h2>
                <span class="section-icon">${icon}</span>
            </div>
            <div class="section-divider"></div>
            <div class="section-body">${formattedText}</div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: #0b1929;
    color: #e8e0d0;
    font-family: 'Crimson Text', Georgia, serif;
    font-size: 13.5pt;
    line-height: 1.75;
  }

  /* ── COVER PAGE ── */
  .cover {
    width: 210mm;
    height: 297mm;
    background: radial-gradient(ellipse at 50% 30%, #173348 0%, #102638 50%, #0b1929 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }

  .cover::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(208,177,124,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(91,132,151,0.08) 0%, transparent 50%);
  }

  .cover-ornament-top {
    font-family: 'Cinzel', serif;
    font-size: 11pt;
    letter-spacing: 6px;
    color: rgba(208,177,124,0.5);
    text-transform: uppercase;
    margin-bottom: 48px;
  }

  .cover-glyph {
    font-size: 88pt;
    color: #d0b17c;
    text-shadow: 0 0 60px rgba(208,177,124,0.4), 0 0 120px rgba(208,177,124,0.15);
    line-height: 1;
    margin-bottom: 32px;
  }

  .cover-brand {
    font-family: 'Cinzel', serif;
    font-size: 11pt;
    letter-spacing: 5px;
    color: rgba(208,177,124,0.65);
    text-transform: uppercase;
    margin-bottom: 56px;
  }

  .cover-title {
    font-family: 'Cinzel', serif;
    font-size: 28pt;
    font-weight: 700;
    color: #f5ead0;
    letter-spacing: 3px;
    text-align: center;
    line-height: 1.3;
    margin-bottom: 8px;
  }

  .cover-year {
    font-family: 'Cinzel', serif;
    font-size: 18pt;
    color: #d0b17c;
    letter-spacing: 8px;
    margin-bottom: 64px;
  }

  .cover-divider {
    width: 180px;
    height: 1px;
    background: linear-gradient(to right, transparent, #d0b17c, transparent);
    margin-bottom: 40px;
  }

  .cover-name {
    font-family: 'Cinzel', serif;
    font-size: 16pt;
    color: #e8e0d0;
    letter-spacing: 3px;
    text-align: center;
    margin-bottom: 10px;
  }

  .cover-sign {
    font-size: 12pt;
    color: rgba(208,177,124,0.7);
    letter-spacing: 2px;
    font-style: italic;
  }

  .cover-birth {
    margin-top: 6px;
    font-size: 10.5pt;
    color: rgba(232,224,208,0.45);
    letter-spacing: 1px;
  }

  .cover-footer {
    position: absolute;
    bottom: 36px;
    font-size: 8.5pt;
    color: rgba(208,177,124,0.3);
    letter-spacing: 3px;
    text-transform: uppercase;
    font-family: 'Cinzel', serif;
  }

  /* ── CONTENT PAGES ── */
  .content {
    padding: 20mm 18mm;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10mm;
    padding-bottom: 4mm;
    border-bottom: 1px solid rgba(208,177,124,0.2);
  }

  .page-header-name {
    font-family: 'Cinzel', serif;
    font-size: 8pt;
    letter-spacing: 3px;
    color: rgba(208,177,124,0.6);
    text-transform: uppercase;
  }

  .page-header-glyph {
    font-size: 14pt;
    color: rgba(208,177,124,0.4);
  }

  .section {
    margin-bottom: 12mm;
    page-break-inside: avoid;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 3mm;
  }

  .section-icon {
    color: #d0b17c;
    font-size: 10pt;
    opacity: 0.7;
  }

  .section-title {
    font-family: 'Cinzel', serif;
    font-size: 13pt;
    font-weight: 600;
    color: #d0b17c;
    letter-spacing: 2px;
    text-transform: uppercase;
    flex: 1;
    text-align: center;
  }

  .section-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(208,177,124,0.4), transparent);
    margin-bottom: 5mm;
  }

  .section-body p {
    margin-bottom: 6pt;
    color: #ddd5c8;
  }

  /* Months list */
  .month-item {
    display: flex;
    gap: 12px;
    margin-bottom: 8pt;
    align-items: flex-start;
  }

  .month-label {
    font-family: 'Cinzel', serif;
    font-size: 9.5pt;
    color: #d0b17c;
    letter-spacing: 1px;
    min-width: 80px;
    padding-top: 2px;
  }

  .month-text {
    color: #ddd5c8;
    flex: 1;
    font-size: 12pt;
  }

  /* Last section — closing word — centered italic */
  .section.slovo .section-body {
    text-align: center;
    font-style: italic;
    color: #e8dfc8;
    font-size: 13pt;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-ornament-top">Mystická Hvězda · ${year}</div>
  <div class="cover-glyph">${glyph}</div>
  <div class="cover-brand">mystickahvezda.cz</div>
  <div class="cover-title">Roční Horoskop<br>na míru</div>
  <div class="cover-year">${year}</div>
  <div class="cover-divider"></div>
  <div class="cover-name">${safeName}</div>
  <div class="cover-sign">${safeSignName}</div>
  <div class="cover-birth">${safeBirthFormatted}</div>
  <div class="cover-footer">Personalizovaný výklad · Mystická Hvězda</div>
</div>

<!-- CONTENT -->
<div class="content">
  <div class="page-header">
    <div class="page-header-name">${safeName} · ${safeSignName}</div>
    <div class="page-header-glyph">${glyph}</div>
    <div class="page-header-name">Roční Horoskop ${year}</div>
  </div>

  ${sectionHtml}
</div>

</body>
</html>`;
}

function formatMonths(text) {
    // Try to parse "Měsíc: text" lines
    const lines = text.split('\n').filter(l => l.trim());
    const monthPattern = /^([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:\s+\d{4})?)[:\-–]\s*(.+)/;
    const parsed = lines.map(line => {
        const m = monthPattern.exec(line.trim());
        if (m) {
            return `<div class="month-item"><span class="month-label">${m[1]}</span><span class="month-text">${m[2]}</span></div>`;
        }
        return `<p>${line}</p>`;
    });
    return parsed.join('');
}
