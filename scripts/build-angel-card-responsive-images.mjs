import sharp from 'sharp';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const sourceDir = new URL('img/atlas/angels-v1/', root);
const names = ['abundance', 'guidance', 'healing', 'love', 'nature', 'peace', 'purpose', 'strength'];

await mkdir(fileURLToPath(sourceDir), { recursive: true });

for (const name of names) {
    const sourcePath = new URL(`${name}.webp`, sourceDir);
    const outputPath = new URL(`${name}-360.webp`, sourceDir);
    const source = await readFile(sourcePath);
    const metadata = await sharp(source).metadata();

    if (metadata.width !== 600 || metadata.height !== 1000) {
        throw new Error(`Unexpected dimensions for ${name}: ${metadata.width}×${metadata.height}`);
    }

    await sharp(source)
        .resize({ width: 360, withoutEnlargement: true })
        .webp({ quality: 82, effort: 6 })
        .toFile(fileURLToPath(outputPath));

    const outputBytes = (await stat(outputPath)).size;
    if (outputBytes >= source.byteLength) {
        throw new Error(`Responsive variant is not smaller for ${name}: ${outputBytes} >= ${source.byteLength}`);
    }

    console.log(`${name}: ${source.byteLength} B → ${outputBytes} B (${metadata.width}×${metadata.height} → 360×600)`);
}
