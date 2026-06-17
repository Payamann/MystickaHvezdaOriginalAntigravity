import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(repoRoot, 'partnerska-shoda');

const SIGNS = {
  aquarius: 'Vodnář',
  aries: 'Beran',
  cancer: 'Rak',
  capricorn: 'Kozoroh',
  gemini: 'Blíženci',
  leo: 'Lev',
  libra: 'Váhy',
  pisces: 'Ryby',
  sagittarius: 'Střelec',
  scorpio: 'Štír',
  taurus: 'Býk',
  virgo: 'Panna'
};

function replaceRequired(html, pattern, replacement, fileName, label) {
  if (!pattern.test(html)) {
    throw new Error(`Missing ${label} in ${fileName}`);
  }
  return html.replace(pattern, replacement);
}

function buildMetadata(slug) {
  const [firstSlug, secondSlug] = slug.split('-');
  const first = SIGNS[firstSlug];
  const second = SIGNS[secondSlug];

  if (!first || !second) {
    throw new Error(`Unknown partner pair slug: ${slug}`);
  }

  const pair = `${first} a ${second}`;
  const title = `${pair}: láska, vztah a kompatibilita | Mystická Hvězda`;
  const description = `${pair} ve vztahu: láska, komunikace, silné stránky i výzvy. Spočítejte přesnou partnerskou shodu podle dat narození.`;
  const ctaHref = `../partnerska-shoda.html?source=seo_partner_pair&feature=compatibility&pair=${slug}#form`;

  return {
    ctaHref,
    description,
    first,
    pair,
    second,
    title
  };
}

async function updatePartnerPages() {
  const entries = await fs.readdir(pagesDir, { withFileTypes: true });
  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html')
    .map((entry) => entry.name)
    .sort();

  let updated = 0;

  for (const fileName of htmlFiles) {
    const slug = fileName.replace(/\.html$/u, '');
    const metadata = buildMetadata(slug);
    const filePath = path.join(pagesDir, fileName);
    let html = await fs.readFile(filePath, 'utf8');

    html = replaceRequired(
      html,
      /<title>[\s\S]*?<\/title>/i,
      `<title>${metadata.title}</title>`,
      fileName,
      'title'
    );
    html = replaceRequired(
      html,
      /<meta\s+name="description"\s+content="[^"]*"\s*>/is,
      `<meta name="description"\n\n        content="${metadata.description}">`,
      fileName,
      'meta description'
    );
    html = replaceRequired(
      html,
      /<meta\s+property="og:title"\s+content="[^"]*"\s*>/i,
      `<meta property="og:title" content="${metadata.title}">`,
      fileName,
      'og:title'
    );
    html = replaceRequired(
      html,
      /<meta\s+property="og:description"\s+content="[^"]*"\s*>/is,
      `<meta property="og:description"\n\n        content="${metadata.description}">`,
      fileName,
      'og:description'
    );
    html = replaceRequired(
      html,
      /<h1 class="hero__title">[\s\S]*?<\/h1>/i,
      `<h1 class="hero__title">${metadata.first} <span class="text-gradient">&</span> ${metadata.second}</h1>`,
      fileName,
      'hero h1'
    );
    html = html.replace(
      /href="\.\.\/partnerska-shoda\.html(?:\?[^"#]*)?#form"/g,
      `href="${metadata.ctaHref}"`
    );
    html = html.replace(/href="\.\.\/partnerska-shoda\.html#form"/g, `href="${metadata.ctaHref}"`);

    await fs.writeFile(filePath, html, 'utf8');
    updated += 1;
  }

  console.log(`Updated ${updated} partner compatibility pages in ${path.relative(repoRoot, pagesDir)}`);
}

updatePartnerPages().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
