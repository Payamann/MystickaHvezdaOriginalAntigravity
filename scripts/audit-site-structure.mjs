import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const siteOrigin = process.env.SITE_ORIGIN || 'https://www.mystickahvezda.cz';
const skippedDirs = new Set([
    '.git',
    '.claude',
    '.pytest_cache',
    'components',
    'coverage',
    'node_modules',
    'playwright-report',
    'social-media-agent',
    'templates',
    'test-results',
    'tests',
    'tmp_email_previews'
]);

const issues = [];

function report(type, file, detail) {
    issues.push({ type, file, detail });
}

function read(file) {
    return fs.readFileSync(file, 'utf8');
}

function walkHtml(dir = rootDir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!skippedDirs.has(entry.name)) {
                walkHtml(fullPath, out);
            }
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.html')) {
            out.push(fullPath);
        }
    }

    return out;
}

function relative(file) {
    return path.relative(rootDir, file).replace(/\\/g, '/');
}

function localPathForSiteUrl(url) {
    const parsed = new URL(url);
    let pathname = decodeURIComponent(parsed.pathname);

    if (pathname === '/') return 'index.html';
    if (pathname.endsWith('/')) return path.join(pathname.slice(1), 'index.html');

    return pathname.replace(/^\/+/, '');
}

function localTargetForAssetUrl(assetUrl, sourceFile) {
    if (!assetUrl || assetUrl.startsWith('#')) return null;
    if (/^(?:https?:)?\/\//i.test(assetUrl)) return null;
    if (/^(?:mailto|tel|data|javascript):/i.test(assetUrl)) return null;

    const cleanUrl = assetUrl.split('#')[0].split('?')[0];
    if (!cleanUrl) return null;

    if (cleanUrl === '/') return path.join(rootDir, 'index.html');
    if (cleanUrl.startsWith('/')) {
        const localPath = cleanUrl.endsWith('/')
            ? path.join(cleanUrl.slice(1), 'index.html')
            : cleanUrl.slice(1);
        return path.join(rootDir, localPath);
    }

    const targetPath = cleanUrl.endsWith('/')
        ? path.join(cleanUrl, 'index.html')
        : cleanUrl;

    return path.resolve(path.dirname(sourceFile), targetPath);
}

function getAttribute(tag, name) {
    const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
    return match ? match[1] : null;
}

function getCanonical(html) {
    const match = html.match(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i)
        || html.match(/<link\b[^>]*href\s*=\s*["'][^"']+["'][^>]*rel\s*=\s*["']canonical["'][^>]*>/i);

    return match ? getAttribute(match[0], 'href') : null;
}

function parseSitemap() {
    const sitemapPath = path.join(rootDir, 'sitemap.xml');
    const sitemap = read(sitemapPath);
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
    const seen = new Set();

    for (const loc of locs) {
        if (seen.has(loc)) {
            report('duplicate_sitemap_loc', 'sitemap.xml', loc);
        }
        seen.add(loc);

        let parsed;
        try {
            parsed = new URL(loc);
        } catch {
            report('invalid_sitemap_url', 'sitemap.xml', loc);
            continue;
        }

        if (parsed.origin !== siteOrigin) {
            report('unexpected_sitemap_origin', 'sitemap.xml', loc);
            continue;
        }

        const localPath = localPathForSiteUrl(loc);
        const fullPath = path.join(rootDir, localPath);
        if (!fs.existsSync(fullPath)) {
            report('missing_sitemap_target', 'sitemap.xml', `${loc} -> ${localPath}`);
            continue;
        }

        if (localPath.endsWith('.html')) {
            const canonical = getCanonical(read(fullPath));
            if (!canonical) {
                report('missing_canonical_for_sitemap_page', localPath, loc);
            } else if (canonical !== loc) {
                report('sitemap_canonical_mismatch', localPath, `sitemap=${loc} canonical=${canonical}`);
            }
        }
    }

    return locs;
}

function auditJsonLd(file, html) {
    const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = scriptPattern.exec(html)) !== null) {
        const attrs = match[1] || '';
        if (!/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;

        const body = (match[2] || '').trim();
        if (!body) continue;

        try {
            JSON.parse(body);
        } catch (error) {
            report('invalid_json_ld', relative(file), error.message);
        }
    }
}

function auditCanonical(file, html) {
    const canonical = getCanonical(html);
    if (!canonical) return;

    let parsed;
    try {
        parsed = new URL(canonical);
    } catch {
        report('invalid_canonical_url', relative(file), canonical);
        return;
    }

    if (parsed.origin !== siteOrigin) {
        report('unexpected_canonical_origin', relative(file), canonical);
        return;
    }

    const localPath = localPathForSiteUrl(canonical);
    const fullPath = path.join(rootDir, localPath);
    if (!fs.existsSync(fullPath)) {
        report('missing_canonical_target', relative(file), `${canonical} -> ${localPath}`);
    }
}

function auditLocalLinks(file, html) {
    const attrPattern = /\s(?:href|src)\s*=\s*["']([^"']+)["']/gi;
    let match;

    while ((match = attrPattern.exec(html)) !== null) {
        const target = localTargetForAssetUrl(match[1], file);
        if (!target) continue;

        if (!fs.existsSync(target)) {
            report('missing_local_link_target', relative(file), `${match[1]} -> ${relative(target)}`);
        }
    }
}

parseSitemap();

for (const file of walkHtml()) {
    const html = read(file);
    auditJsonLd(file, html);
    auditCanonical(file, html);
    auditLocalLinks(file, html);
}

if (issues.length > 0) {
    console.error(`[site-audit] Found ${issues.length} issue(s):`);
    for (const issue of issues.slice(0, 100)) {
        console.error(`- ${issue.type}: ${issue.file}: ${issue.detail}`);
    }
    if (issues.length > 100) {
        console.error(`...and ${issues.length - 100} more.`);
    }
    process.exit(1);
}

console.log('[site-audit] OK: sitemap targets, canonical targets, JSON-LD and local links are valid.');
