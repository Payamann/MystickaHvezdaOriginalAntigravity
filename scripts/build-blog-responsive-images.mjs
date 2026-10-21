import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const imageWidths = [480, 800];
const htmlFiles = [
  path.join(root, 'blog.html'),
  ...(await fs.readdir(path.join(root, 'blog')))
    .filter((name) => name.endsWith('.html'))
    .map((name) => path.join(root, 'blog', name)),
];
const srcPattern = /\bsrc=(['"])([^'"]+)\1/i;
const imgPattern = /<img\b[^>]*>/gi;
const generated = new Set();
const candidateCache = new Map();

function responsiveAtlasSourceForTag(tag) {
  const source = tag.match(srcPattern)?.[2]?.split('?')[0];
  return source && /(?:^|\/)img\/atlas\/(?:social|tools)-v1\/[^/]+\.webp$/i.test(source) ? source : null;
}

function withWidthSuffix(src, width) {
  return src.replace(/\.webp(?=\?|$)/i, `-${width}.webp`);
}

function sizesForTag(tag) {
  if (/\bblog-card-image\b/i.test(tag)) return '(max-width: 720px) 88vw, 320px';
  if (/\bfeatured-post__image\b/i.test(tag)) return '(max-width: 720px) 88vw, 640px';
  return '(max-width: 720px) calc(100vw - 2rem), 960px';
}

for (const htmlFile of htmlFiles) {
  let html = await fs.readFile(htmlFile, 'utf8');
  let changed = false;

  html = html.replace(imgPattern, (tag) => {
    const src = responsiveAtlasSourceForTag(tag);
    if (!src) return tag;
    const sourcePath = path.resolve(path.dirname(htmlFile), src);
    const assetKey = sourcePath.toLowerCase();
    generated.add(assetKey);

    return tag.replace(/\s+srcset=(['"])[^'"]*\1/i, '').replace(/\s+sizes=(['"])[^'"]*\1/i, '');
  });

  const socialSources = [...html.matchAll(/<img\b[^>]*>/gi)]
    .map((match) => ({ tag: match[0], source: responsiveAtlasSourceForTag(match[0]) }))
    .filter((entry) => entry.source);

  for (const { tag, source } of socialSources) {
    const sourcePath = path.resolve(path.dirname(htmlFile), source);
    const cacheKey = sourcePath.toLowerCase();
    let candidates = candidateCache.get(cacheKey);
    if (!candidates) {
      const metadata = await sharp(sourcePath).metadata();
      if (!metadata.width) throw new Error(`Could not read image width: ${sourcePath}`);

      candidates = [];
      for (const width of imageWidths.filter((candidate) => candidate < metadata.width)) {
        const variantPath = withWidthSuffix(sourcePath, width);
        try {
          await fs.access(variantPath);
        } catch {
          await sharp(sourcePath)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: width <= 480 ? 82 : 86, effort: 6 })
            .toFile(variantPath);
        }
        const stat = await fs.stat(variantPath);
        candidates.push({ width, bytes: stat.size });
      }
      candidateCache.set(cacheKey, { variants: candidates, originalWidth: metadata.width, originalBytes: (await fs.stat(sourcePath)).size });
      candidates = candidateCache.get(cacheKey);
    }

    const srcset = [
      ...candidates.variants.map((candidate) => `${withWidthSuffix(source, candidate.width)} ${candidate.width}w`),
      `${source} ${candidates.originalWidth}w`,
    ].join(', ');
    const sizes = sizesForTag(tag);
    const updatedTag = tag
      .replace(/\s+srcset=(['"])[^'"]*\1/i, '')
      .replace(/\s+sizes=(['"])[^'"]*\1/i, '')
      .replace(/\s*\/?>$/, (ending) => ` srcset="${srcset}" sizes="${sizes}"${ending.trimStart()}`);
    html = html.replace(tag, updatedTag);
    changed = true;
  }

  if (changed) await fs.writeFile(htmlFile, html, 'utf8');
}

for (const [sourcePath, candidates] of candidateCache) {
  console.log(`${path.relative(root, sourcePath)}: ${candidates.variants.map(({ width, bytes }) => `${width}w=${bytes}B`).join(', ')}, ${candidates.originalWidth}w=${candidates.originalBytes}B`);
}
console.log(`Updated responsive Atlas sources on blog index/articles; processed ${generated.size} source image paths.`);
