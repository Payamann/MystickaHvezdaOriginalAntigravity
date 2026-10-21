import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const versions = {
    core: '20261021-footer-support-locale',
    components: '20261021-footer-support-locale',
    'auth-client': '20261020-02-register-password-policy',
    templates: '20261021-celtic-footer-star-svg',
    horoscope: '20261020-journal-context-consent'
};
const write = process.argv.includes('--write');
const skippedDirectories = new Set(['.git', '.codex-tmp', 'node_modules', 'docs', 'reports']);
const assetPattern = /(js\/dist\/(core|components|auth-client|templates|horoscope)\.js)(?:\?v=[^&"'.\s]+)?/g;
const changedFiles = [];

async function visit(directory, includeHtml) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (skippedDirectories.has(entry.name)) continue;
            await visit(path.join(directory, entry.name), includeHtml);
            continue;
        }

        if (!entry.isFile()) continue;
        const extension = path.extname(entry.name).toLowerCase();
        if (includeHtml ? extension !== '.html' : !['.mjs', '.js'].includes(extension)) continue;

        const filePath = path.join(directory, entry.name);
        // This audit stores unversioned manifest keys, not URLs to rewrite.
        if (['audit-site-structure.mjs', 'production-critical-assets-smoke.mjs'].some(name => filePath === path.join(rootDir, 'scripts', name))) continue;
        const original = await fs.readFile(filePath, 'utf8');
        const updated = original.replace(assetPattern, (_match, assetPath, assetName) => `${assetPath}?v=${versions[assetName]}`);
        if (updated === original) continue;

        if (write) await fs.writeFile(filePath, updated, 'utf8');
        changedFiles.push(path.relative(rootDir, filePath));
    }
}

await visit(rootDir, true);
await visit(path.join(rootDir, 'scripts'), false);

if (write) {
    console.log(`[auth-asset-versions] Updated ${changedFiles.length} HTML/generator files to their configured asset versions.`);
} else {
    console.log(`[auth-asset-versions] ${changedFiles.length} HTML/generator files contain stale shared asset references.`);
    if (changedFiles.length) {
        for (const file of changedFiles.slice(0, 30)) console.log(`- ${file}`);
        process.exitCode = 1;
    }
}
