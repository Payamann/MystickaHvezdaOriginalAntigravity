import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(__dirname, '..');
const EXCLUDED_DIRECTORIES = new Set([
    '.git',
    '.claude',
    '.codex-worktrees',
    'artifacts',
    'coverage',
    'docs',
    'node_modules',
    'playwright-report',
    'social-media-agent',
    'templates',
    'test-results',
    'tests',
    'tmp',
    'tmp_email_previews'
]);
const CANONICAL_LINK_RE = /<link\b(?=[^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'])[^>]*>/i;
const NOINDEX_RE = /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*\bnoindex\b[^"']*["'])[^>]*>/i;
const ANALYTICS_INIT_RE = /<script\b(?=[^>]*\bsrc=["'][^"']*\/?js\/dist\/analytics-init\.js(?:\?[^"']*)?["'])[^>]*>\s*<\/script>/gi;
const ANALYTICS_RE = /<script\b(?=[^>]*\bsrc=["'][^"']*\/?js\/dist\/analytics\.js(?:\?[^"']*)?["'])[^>]*>\s*<\/script>/gi;
const INIT_LOADER = '<script src="/js/dist/analytics-init.js" defer></script>';
const ANALYTICS_LOADER = '<script src="/js/dist/analytics.js?v=8" defer></script>';

async function walkHtmlFiles(directory, root = directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (!EXCLUDED_DIRECTORIES.has(entry.name)) {
                files.push(...await walkHtmlFiles(absolutePath, root));
            }
            continue;
        }

        if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
            files.push({
                absolutePath,
                relativePath: path.relative(root, absolutePath).replaceAll(path.sep, '/')
            });
        }
    }

    return files;
}

function matchesOf(html, regex) {
    return [...html.matchAll(regex)];
}

function lineIndentAt(html, index) {
    const lineStart = html.lastIndexOf('\n', index - 1) + 1;
    return html.slice(lineStart, index).match(/^[\t ]*/)?.[0] || '';
}

function insertBeforeHeadEnd(html, loaders, eol) {
    const headMatches = [...html.matchAll(/<\/head\s*>/gi)];
    if (headMatches.length !== 1) {
        return { html, changed: false, error: `expected one </head>, found ${headMatches.length}` };
    }

    const headIndex = headMatches[0].index;
    const needsLeadingEol = headIndex > 0 && !/[\r\n]/.test(html[headIndex - 1]);
    const insertion = `${needsLeadingEol ? eol : ''}    ${loaders.join(`${eol}    `)}${eol}`;
    return {
        html: `${html.slice(0, headIndex)}${insertion}${html.slice(headIndex)}`,
        changed: true,
        error: null
    };
}

export function ensureAnalyticsLoaders(html) {
    const initMatches = matchesOf(html, ANALYTICS_INIT_RE);
    const analyticsMatches = matchesOf(html, ANALYTICS_RE);
    const eol = html.includes('\r\n') ? '\r\n' : '\n';

    if (initMatches.length > 1 || analyticsMatches.length > 1) {
        return {
            html,
            changed: false,
            error: `duplicate loader tags (init=${initMatches.length}, analytics=${analyticsMatches.length})`
        };
    }

    if (initMatches.length === 1 && analyticsMatches.length === 1) {
        if (initMatches[0].index > analyticsMatches[0].index) {
            return { html, changed: false, error: 'analytics-init.js must load before analytics.js' };
        }
        return { html, changed: false, error: null };
    }

    if (analyticsMatches.length === 1) {
        const analyticsMatch = analyticsMatches[0];
        const indent = lineIndentAt(html, analyticsMatch.index);
        return {
            html: `${html.slice(0, analyticsMatch.index)}${INIT_LOADER}${eol}${indent}${html.slice(analyticsMatch.index)}`,
            changed: true,
            error: null
        };
    }

    if (initMatches.length === 1) {
        const initMatch = initMatches[0];
        const insertAt = initMatch.index + initMatch[0].length;
        const indent = lineIndentAt(html, initMatch.index);
        return {
            html: `${html.slice(0, insertAt)}${eol}${indent}${ANALYTICS_LOADER}${html.slice(insertAt)}`,
            changed: true,
            error: null
        };
    }

    return insertBeforeHeadEnd(html, [INIT_LOADER, ANALYTICS_LOADER], eol);
}

export async function auditAnalyticsLoaderCoverage({ root = DEFAULT_ROOT, write = false } = {}) {
    const htmlFiles = await walkHtmlFiles(root);
    const canonicalFiles = [];
    const coveredFiles = [];
    const changedFiles = [];
    const skippedFiles = [];
    const unsafeFiles = [];
    const pendingWrites = [];

    for (const file of htmlFiles) {
        const html = await fs.readFile(file.absolutePath, 'utf8');
        if (!CANONICAL_LINK_RE.test(html)) continue;

        canonicalFiles.push(file.relativePath);
        const result = ensureAnalyticsLoaders(html);
        if (result.error) {
            if (NOINDEX_RE.test(html) && !/<\/head\s*>/i.test(html)) {
                skippedFiles.push({ path: file.relativePath, reason: result.error });
                continue;
            }
            unsafeFiles.push({ path: file.relativePath, reason: result.error });
            continue;
        }
        if (result.changed) {
            changedFiles.push(file.relativePath);
            pendingWrites.push({ ...file, html: result.html });
        } else {
            coveredFiles.push(file.relativePath);
        }
    }

    if (write && unsafeFiles.length === 0) {
        for (const file of pendingWrites) {
            await fs.writeFile(file.absolutePath, file.html, 'utf8');
        }
    }

    return {
        canonicalFiles,
        coveredFiles,
        changedFiles,
        skippedFiles,
        unsafeFiles,
        wrote: write && unsafeFiles.length === 0 ? changedFiles.length : 0
    };
}

async function main() {
    const write = process.argv.includes('--write');
    const report = await auditAnalyticsLoaderCoverage({ write });

    console.log(`Canonical HTML: ${report.canonicalFiles.length}`);
    console.log(`Already covered: ${report.coveredFiles.length}`);
    console.log(`Skipped malformed noindex aliases: ${report.skippedFiles.length}`);
    console.log(`${write ? 'Updated' : 'Missing loaders'}: ${write ? report.wrote : report.changedFiles.length}`);

    if (report.unsafeFiles.length > 0) {
        console.error('Unsafe files:');
        for (const file of report.unsafeFiles) console.error(`- ${file.path}: ${file.reason}`);
        process.exitCode = 1;
        return;
    }

    if (!write && report.changedFiles.length > 0) {
        for (const file of report.changedFiles.slice(0, 20)) console.error(`- ${file}`);
        if (report.changedFiles.length > 20) console.error(`- ... and ${report.changedFiles.length - 20} more`);
        process.exitCode = 1;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
