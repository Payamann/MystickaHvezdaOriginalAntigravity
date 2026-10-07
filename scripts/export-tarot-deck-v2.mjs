import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'docs', 'tarot-deck-v2', 'cards-manifest.json');
const STATUS_PATH = path.join(ROOT_DIR, 'docs', 'tarot-deck-v2', 'export-status.json');
const SOURCE_DIR = path.join(ROOT_DIR, 'img', 'tarot-v2', 'source');
const OUTPUT_DIR = path.join(ROOT_DIR, 'img', 'tarot-v2');
const CONTACT_DIR = path.join(ROOT_DIR, 'docs', 'tarot-deck-v2');

const EXPORT_WIDTH = 600;
const EXPORT_HEIGHT = 1000;
const WEBP_QUALITY = 90;
const THUMB_WIDTH = 180;
const THUMB_HEIGHT = 300;
const CELL_WIDTH = 204;
const CELL_HEIGHT = 344;

const GROUPS = [
  { key: 'major', label: 'Velká arkána', columns: 6 },
  { key: 'wands', label: 'Hole', columns: 4 },
  { key: 'cups', label: 'Poháry', columns: 4 },
  { key: 'swords', label: 'Meče', columns: 4 },
  { key: 'pentacles', label: 'Pentákly', columns: 4 }
];

function relativeToRoot(filePath) {
  return path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function ratio(width, height) {
  return width && height ? Number((width / height).toFixed(4)) : null;
}

function selectMetadata(metadata) {
  return {
    format: metadata.format ?? null,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    ratio: ratio(metadata.width, metadata.height),
    space: metadata.space ?? null,
    channels: metadata.channels ?? null,
    hasAlpha: metadata.hasAlpha ?? null
  };
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sourceFilename(outputFilename) {
  return `${path.parse(outputFilename).name}.png`;
}

function cardGroup(card) {
  return card.arcana === 'major' ? 'major' : card.suit;
}

async function inspect(filePath) {
  if (!(await exists(filePath))) return null;
  return selectMetadata(await sharp(filePath).metadata());
}

async function exportAsset({ index, name, filename, group, sourceName }) {
  const sourcePath = path.join(SOURCE_DIR, sourceName);
  const outputPath = path.join(OUTPUT_DIR, filename);
  const sourceExists = await exists(sourcePath);

  const result = {
    index,
    name,
    group,
    source: relativeToRoot(sourcePath),
    output: relativeToRoot(outputPath),
    sourceExists,
    png: null,
    state: sourceExists ? 'pending' : 'missing-source',
    webp: null,
    error: null
  };

  if (!sourceExists) {
    result.webp = await inspect(outputPath);
    if (result.webp) result.state = 'missing-source-existing-webp';
    return result;
  }

  try {
    result.png = selectMetadata(await sharp(sourcePath).metadata());
    await sharp(sourcePath)
      .resize(EXPORT_WIDTH, EXPORT_HEIGHT, { fit: 'fill' })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);
    result.webp = await inspect(outputPath);
    result.state = 'exported';
  } catch (error) {
    result.state = 'error';
    result.error = error instanceof Error ? error.message : String(error);
    result.webp = await inspect(outputPath).catch(() => null);
  }

  return result;
}

function labelSvg(title, width, height) {
  const safeTitle = escapeXml(title);
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0b0b22"/>
      <text x="50%" y="19" text-anchor="middle"
        fill="#d6b66f" font-family="Arial, sans-serif" font-size="13" font-weight="700"
        letter-spacing="0.7">${safeTitle}</text>
    </svg>
  `);
}

async function makeContactSheet(group, cards) {
  const available = [];
  for (const card of cards) {
    const outputPath = path.join(ROOT_DIR, card.output);
    if (await exists(outputPath)) available.push({ ...card, outputPath });
  }

  if (available.length === 0) {
    return { group: group.key, file: null, images: 0, state: 'no-webp-assets' };
  }

  const rows = Math.ceil(available.length / group.columns);
  const canvasWidth = group.columns * CELL_WIDTH;
  const canvasHeight = rows * CELL_HEIGHT;
  const composites = [];

  for (let position = 0; position < available.length; position += 1) {
    const card = available[position];
    const column = position % group.columns;
    const row = Math.floor(position / group.columns);
    const left = column * CELL_WIDTH + Math.floor((CELL_WIDTH - THUMB_WIDTH) / 2);
    const top = row * CELL_HEIGHT + 8;
    const thumbnail = await sharp(card.outputPath)
      .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'fill' })
      .jpeg({ quality: 92 })
      .toBuffer();

    composites.push({ input: thumbnail, left, top });
    composites.push({
      input: labelSvg(card.title, CELL_WIDTH, 30),
      left: column * CELL_WIDTH,
      top: top + THUMB_HEIGHT + 3
    });
  }

  const outputPath = path.join(CONTACT_DIR, `contact-${group.key}.jpg`);
  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: '#050510'
    }
  })
    .composite(composites)
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toFile(outputPath);

  return {
    group: group.key,
    file: relativeToRoot(outputPath),
    images: available.length,
    columns: group.columns,
    rows,
    thumbnail: `${THUMB_WIDTH}x${THUMB_HEIGHT}`,
    state: 'created'
  };
}

function printAssetTable(results) {
  console.table(results.map((item) => ({
    index: item.index ?? 'back',
    name: item.name,
    state: item.state,
    source: item.sourceExists ? 'yes' : 'missing',
    png: item.png ? `${item.png.width}x${item.png.height}` : '—',
    'PNG ratio': item.png?.ratio ?? '—',
    webp: item.webp ? `${item.webp.width}x${item.webp.height}` : '—',
    'WebP ratio': item.webp?.ratio ?? '—'
  })));
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  if (!Array.isArray(manifest) || manifest.length !== 78) {
    throw new Error(`Manifest musí obsahovat 78 karet; nalezeno ${manifest?.length ?? 'neznámý počet'}.`);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(CONTACT_DIR, { recursive: true });

  const results = [];
  for (const card of manifest) {
    results.push(await exportAsset({
      index: card.index,
      name: card.name,
      filename: card.filename,
      group: cardGroup(card),
      sourceName: sourceFilename(card.filename)
    }));
  }

  const backSource = path.join(SOURCE_DIR, 'tarot_card_back.png');
  const back = await exists(backSource)
    ? await exportAsset({
        index: null,
        name: 'Rub karty',
        filename: 'tarot_card_back.webp',
        group: 'back',
        sourceName: 'tarot_card_back.png'
      })
    : {
        index: null,
        name: 'Rub karty',
        group: 'back',
        source: relativeToRoot(backSource),
        output: relativeToRoot(path.join(OUTPUT_DIR, 'tarot_card_back.webp')),
        sourceExists: false,
        png: null,
        state: 'optional-source-missing',
        webp: await inspect(path.join(OUTPUT_DIR, 'tarot_card_back.webp')),
        error: null
      };

  const contactSheets = [];
  for (const group of GROUPS) {
    const groupedCards = manifest
      .filter((card) => cardGroup(card) === group.key)
      .map((card) => ({
        ...card,
        output: relativeToRoot(path.join(OUTPUT_DIR, card.filename))
      }));
    contactSheets.push(await makeContactSheet(group, groupedCards));
  }

  const exported = results.filter((item) => item.state === 'exported').length;
  const missing = results.filter((item) => item.state.startsWith('missing-source')).length;
  const errors = results.filter((item) => item.state === 'error').length;
  const existingWebp = results.filter((item) => item.webp).length;
  const status = {
    generatedAt: new Date().toISOString(),
    manifest: relativeToRoot(MANIFEST_PATH),
    config: {
      sourceDirectory: relativeToRoot(SOURCE_DIR),
      outputDirectory: relativeToRoot(OUTPUT_DIR),
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      fit: 'fill',
      webpQuality: WEBP_QUALITY,
      sourceFilesPreserved: true
    },
    summary: {
      expectedCards: 78,
      sourcePngPresent: results.filter((item) => item.sourceExists).length,
      sourcePngMissing: missing,
      exportedThisRun: exported,
      webpPresentAfterRun: existingWebp,
      errors,
      backSourcePresent: back.sourceExists,
      backWebpPresentAfterRun: Boolean(back.webp)
    },
    cards: results,
    back,
    contactSheets
  };

  await writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
  printAssetTable([...results, back]);
  console.log(`Stav exportu: ${relativeToRoot(STATUS_PATH)}`);
  console.log(`PNG existuje: ${status.summary.sourcePngPresent}; chybí: ${missing}; WebP existuje: ${existingWebp}; chyby: ${errors}.`);

  if (errors > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
