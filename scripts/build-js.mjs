import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const jsDir = path.join(rootDir, 'js');
const outDir = path.join(jsDir, 'dist');

const entries = (await readdir(jsDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => path.join(jsDir, entry.name));

if (entries.length === 0) {
    throw new Error('No JavaScript entry files found in /js');
}

await esbuild.build({
    entryPoints: entries,
    outdir: outDir,
    minify: true,
    bundle: false,
    format: 'esm',
    platform: 'browser',
    logLevel: 'info'
});

await esbuild.build({
    entryPoints: [path.join(jsDir, 'main.js')],
    outfile: path.join(outDir, 'main.js'),
    minify: true,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    logLevel: 'info'
});
