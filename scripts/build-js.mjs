import { copyFile, mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const jsDir = path.join(rootDir, 'js');
const outDir = path.join(jsDir, 'dist');

const passthroughFiles = new Set(['three.min.js']);
const skippedDirs = new Set(['dist', 'vendor']);

async function collectEntries(dir = jsDir) {
    const entries = [];

    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!skippedDirs.has(entry.name)) {
                entries.push(...await collectEntries(fullPath));
            }
            continue;
        }

        if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
        if (dir === jsDir && passthroughFiles.has(entry.name)) continue;

        entries.push(fullPath);
    }

    return entries;
}

const entries = await collectEntries();

if (entries.length === 0) {
    throw new Error('No JavaScript entry files found in /js');
}

await mkdir(outDir, { recursive: true });

await Promise.all(
    [...passthroughFiles].map((fileName) => copyFile(
        path.join(jsDir, fileName),
        path.join(outDir, fileName)
    ))
);

const moduleEntries = [];
const classicEntries = [];

for (const entry of entries) {
    const source = await readFile(entry, 'utf8');
    if (/\b(?:import|export)\b/.test(source)) {
        moduleEntries.push(entry);
    } else {
        classicEntries.push(entry);
    }
}

if (classicEntries.length > 0) {
    await esbuild.build({
        entryPoints: classicEntries,
        outdir: outDir,
        outbase: jsDir,
        minify: true,
        bundle: false,
        format: 'iife',
        platform: 'browser',
        logLevel: 'info'
    });
}

if (moduleEntries.length > 0) {
    await esbuild.build({
        entryPoints: moduleEntries,
        outdir: outDir,
        outbase: jsDir,
        minify: true,
        bundle: true,
        format: 'esm',
        platform: 'browser',
        logLevel: 'info'
    });
}
