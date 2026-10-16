import { mkdir, readFile, writeFile } from 'node:fs/promises';

// JSON remains the editorial source. Plain ESM output works with the existing
// ESLint parser, Node test loader and browser bundle without import attributes.
export async function buildSharedToolData() {
    const data = new URL('../data/', import.meta.url);
    const output = new URL('generated/', data);
    await mkdir(output, { recursive: true });
    for (const name of ['moon-primary-phases', 'tarot-daily-practice', 'tarot-card-hub']) {
        const value = JSON.parse(await readFile(new URL(`${name}.json`, data), 'utf8'));
        const target = new URL(`${name}.js`, output);
        const source = `// Generated from data/${name}.json by scripts/build-shared-tool-data.mjs.\nexport default ${JSON.stringify(value, null, 2)};\n`;
        const previous = await readFile(target, 'utf8').catch(() => null);
        if (previous !== source) await writeFile(target, source, 'utf8');
    }
}
