import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELEASE_CSS_VERSION, refreshCssAssetReferences } from './lib/release-css-versions.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');
const backupDir = path.join(rootDir, '.tmp', 'todo-css-release-before-refresh');
const skippedDirectories = new Set([
    '.git', '.codex-tmp', '.codex-worktrees', '.tmp', '.agents', '.claude', '.claire',
    '.pytest-tmp', 'node_modules', 'docs', 'reports', 'coverage', 'artifacts', 'output',
    'playwright-report', 'test-results', 'tmp', 'tmp_email_previews', 'polymarket-bot',
    'production-release-v2', 'orchestrator-routing-fix'
]);
const changedFiles = [];

async function visit(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (skippedDirectories.has(entry.name)) continue;
            await visit(path.join(directory, entry.name));
            continue;
        }

        if (!entry.isFile() || !['.html', '.mjs'].includes(path.extname(entry.name).toLowerCase())) continue;

        const filePath = path.join(directory, entry.name);
        if (path.relative(rootDir, filePath).replaceAll('\\', '/') === 'scripts/lib/release-css-versions.mjs') continue;
        const original = await fs.readFile(filePath, 'utf8');
        const updated = refreshCssAssetReferences(original);
        if (updated === original) continue;

        if (write) {
            const backupPath = path.join(backupDir, path.relative(rootDir, filePath));
            await fs.mkdir(path.dirname(backupPath), { recursive: true });
            await fs.copyFile(filePath, backupPath);
            await fs.writeFile(filePath, updated, 'utf8');
        }
        changedFiles.push(path.relative(rootDir, filePath));
    }
}

await visit(rootDir);

if (write) {
    console.log(`[css-asset-versions] Updated ${changedFiles.length} HTML/generator files (release CSS v=${RELEASE_CSS_VERSION}).`);
} else {
    console.log(`[css-asset-versions] ${changedFiles.length} HTML/generator files contain stale CSS asset references (release CSS v=${RELEASE_CSS_VERSION}).`);
    for (const file of changedFiles.slice(0, 30)) console.log(`- ${file}`);
    if (changedFiles.length) process.exitCode = 1;
}
