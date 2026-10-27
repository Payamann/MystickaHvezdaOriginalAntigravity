import { copyFile, mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as esbuild from 'esbuild';
import { buildSharedToolData } from './build-shared-tool-data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const jsDir = path.join(rootDir, 'js');
const outDir = path.join(jsDir, 'dist');

// Compile registered translations before public assets. This reads reviewed
// cache only, never calls AI; stale/missing translations stop the build.
try {
    execFileSync(process.env.PYTHON_EXECUTABLE || 'python', ['scripts/localize_site.py', 'render', '--publish'], {
        cwd: rootDir, encoding: 'utf8', stdio: 'pipe'
    });
    console.log('[locales] Generated reviewed pages from the Czech source and translation cache');
} catch (error) {
    throw new Error(`Localization build stopped. Run locales:plan, sync, preview and review first. ${error.stderr?.toString().trim() || ''}`);
}

const passthroughFiles = new Set(['three.min.js']);
const skippedDirs = new Set(['dist', 'vendor']);
const localizedRoutes = JSON.parse(await readFile(path.join(rootDir, 'data/localization/routes.json'), 'utf8'));
for (const [locale, routes] of Object.entries(localizedRoutes)) {
    if (!['sk', 'pl', 'en'].includes(locale)) throw new Error('Unsupported generated route locale');
    for (const [source, target] of Object.entries(routes)) {
        if (typeof target !== 'string' || !/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]*\.?[a-zA-Z0-9_-]*$/.test(source)
            || !target.startsWith(`/${locale}/`) || /[?#]|\.\.|\\/.test(target)) {
            throw new Error('Invalid generated localization route');
        }
    }
}
await buildSharedToolData();

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
const profileDashboardEntry = path.join(jsDir, 'profile', 'dashboard.js');

for (const entry of entries) {
    const source = await readFile(entry, 'utf8');
    if (/\b(?:import|export)\b/.test(source)) {
        if (entry !== profileDashboardEntry) moduleEntries.push(entry);
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
        define: { MH_BUILD_LOCALIZED_ROUTES: JSON.stringify(localizedRoutes) },
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

// The profile's reading-detail modal is used only after a visitor opens a
// saved reading. Split this entry so the modal and its renderer can be fetched
// on demand while keeping the existing dashboard URL stable.
if (entries.includes(profileDashboardEntry)) {
    await esbuild.build({
        entryPoints: [profileDashboardEntry],
        outdir: path.join(outDir, 'profile'),
        outbase: path.join(jsDir, 'profile'),
        entryNames: '[name]',
        chunkNames: 'chunks/[name]-[hash]',
        minify: true,
        bundle: true,
        splitting: true,
        format: 'esm',
        platform: 'browser',
        logLevel: 'info'
    });
}

// Core bundle: the four shared classic scripts every content page loads
// (api-config -> templates -> auth-client -> components, in dependency
// order). Concatenating the already-minified dist outputs keeps behaviour
// identical to four sequential deferred scripts while cutting three
// requests per page. Keep the core version in sync with refresh-auth-asset-versions.mjs.
const CORE_BUNDLE_FILES = ['api-config.js', 'templates.js', 'auth-client.js', 'components.js'];
const { writeFile } = await import('node:fs/promises');

const coreParts = [];
for (const fileName of CORE_BUNDLE_FILES) {
    const distPath = path.join(outDir, fileName);
    const source = await readFile(distPath, 'utf8');
    coreParts.push(`/* ${fileName} */\n${source.trimEnd()}`);
}
await writeFile(path.join(outDir, 'core.js'), `${coreParts.join('\n;\n')}\n`, 'utf8');
console.log(`[build-js] core.js bundled from ${CORE_BUNDLE_FILES.join(' + ')}`);
