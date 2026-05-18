import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '../..');

async function readPage(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

function extract(html, pattern, label) {
  const match = html.match(pattern);
  if (!match) {
    throw new Error(`Missing ${label}`);
  }
  return match[1].trim();
}

function expectCoreMetadata(html) {
  const title = extract(html, /<title>([^<]+)<\/title>/i, 'title');
  const description = extract(html, /<meta\s+name="description"\s+content="([^"]+)"\s*>/is, 'meta description');

  expect(title.length).toBeGreaterThanOrEqual(35);
  expect(title.length).toBeLessThanOrEqual(75);
  expect(description.length).toBeGreaterThanOrEqual(80);
  expect(description.length).toBeLessThanOrEqual(170);
  expect(html).toMatch(/<link\s+rel="canonical"\s+href="https:\/\/www\.mystickahvezda\.cz\/[^"]+">/i);
  expect(html).toMatch(/<meta\s+property="og:title"\s+content="[^"]+">/i);
  expect(html).toMatch(/<meta\s+property="og:description"\s+content="[^"]+">/i);
}

describe('CTR sprint static SEO pages', () => {
  it('keeps Beran / Aries optimized for the GSC query intent', async () => {
    const html = await readPage('horoskop/beran.html');

    expectCoreMetadata(html);
    expect(html).toContain('Beran / Aries znamení');
    expect(html).toContain('Beran je Aries, první znamení zvěrokruhu');
    expect(html).toContain('../natalni-karta.html?source=seo_zodiac_sign&feature=natal_chart&sign=beran');
    expect(html).toContain('application/ld+json');
  });

  it('positions angel cards as one clear daily-card action before deeper readings', async () => {
    const html = await readPage('andelske-karty.html');

    expectCoreMetadata(html);
    expect(html).toContain('Andělská karta dne online | 44 karet | Mystická Hvězda');
    expect(html).toContain('Andělská <span class="text-gradient">karta dne</span>');
    expect(html).toContain('Jaký je rozdíl mezi kartou dne a andělským výkladem?');
    expect(html).toContain('Vytáhnout andělskou kartu');
    expect(html).toContain('application/ld+json');
  });

  it.each([
    ['partnerska-shoda/sagittarius-pisces.html', 'Střelec a Ryby', 'sagittarius-pisces'],
    ['partnerska-shoda/aquarius-taurus.html', 'Vodnář a Býk', 'aquarius-taurus'],
    ['partnerska-shoda/capricorn-leo.html', 'Kozoroh a Lev', 'capricorn-leo'],
    ['partnerska-shoda/virgo-leo.html', 'Panna a Lev', 'virgo-leo']
  ])('updates partner pair metadata and measured CTA for %s', async (relativePath, pair, slug) => {
    const html = await readPage(relativePath);

    expectCoreMetadata(html);
    expect(html).toContain(`${pair} ve vztahu | Partnerská shoda | Mystická Hvězda`);
    expect(html).toContain(`Hodí se k sobě ${pair}? Praktický rozbor lásky`);
    expect(html).toContain(`../partnerska-shoda.html?source=seo_partner_pair&feature=compatibility&pair=${slug}#form`);
    expect(html).toContain('application/ld+json');
  });

  it.each([
    ['sk/kristalova-koule.html', 'Krištáľová guľa áno alebo nie'],
    ['pl/kristalova-koule.html', 'Kryształowa kula tak czy nie']
  ])('keeps localized crystal ball yes-no intent and hreflang for %s', async (relativePath, intent) => {
    const html = await readPage(relativePath);

    expectCoreMetadata(html);
    expect(html).toContain(intent);
    expect(html).toMatch(/<link\s+rel="alternate"\s+hreflang="cs"/i);
    expect(html).toMatch(/<link\s+rel="alternate"\s+hreflang="sk"/i);
    expect(html).toMatch(/<link\s+rel="alternate"\s+hreflang="pl"/i);
  });
});
