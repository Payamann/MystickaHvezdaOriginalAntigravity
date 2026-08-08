import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const skippedDirs = new Set([
    '.git', '.agents', '.claude', '.claire', 'coverage', 'docs', 'node_modules',
    'playwright-report', 'social-media-agent', 'templates', 'test-results', 'tmp', 'tmp_email_previews'
]);

function walkHtml(dir = rootDir, output = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !skippedDirs.has(entry.name)) walkHtml(fullPath, output);
        if (entry.isFile() && entry.name.endsWith('.html')) output.push(fullPath);
    }
    return output;
}

function relative(file) {
    return path.relative(rootDir, file).replace(/\\/g, '/');
}

function visitStructuredData(value, file) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
        value.forEach((item) => visitStructuredData(item, file));
        return;
    }

    if (value['@type'] === 'BlogPosting') {
        const authors = Array.isArray(value.author) ? value.author : [value.author];
        for (const author of authors.filter(Boolean)) {
            if (
                author['@type'] !== 'Organization'
                || author.name !== 'Mystická Hvězda'
                || author.url !== 'https://www.mystickahvezda.cz/#organization'
            ) {
                failures.push(`${relative(file)}: BlogPosting must use the canonical Mystická Hvězda Organization author.`);
            }
        }

        const images = Array.isArray(value.image) ? value.image : [value.image];
        for (const image of images.filter((item) => typeof item === 'string')) {
            let parsed;
            try {
                parsed = new URL(image);
            } catch {
                failures.push(`${relative(file)}: BlogPosting image is not an absolute URL: ${image}`);
                continue;
            }
            if (parsed.hostname !== 'www.mystickahvezda.cz') {
                failures.push(`${relative(file)}: BlogPosting image has unexpected host: ${parsed.hostname}`);
            }
        }
    }

    Object.values(value).forEach((item) => visitStructuredData(item, file));
}

for (const file of walkHtml()) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = relative(file);

    if (/https:\/\/www\.mystickahvezda(?=[/\"'])/i.test(html)) {
        failures.push(`${rel}: URL is missing the .cz public suffix.`);
    }

    for (const metaMatch of html.matchAll(/<meta\b[\s\S]*?>/gi)) {
        const tag = metaMatch[0];
        if (!/(?:name|property)=[\"'](?:description|og:description)[\"']/i.test(tag)) continue;
        const contentMatch = tag.match(/content\s*=\s*([\"'])([\s\S]*)\1\s*\/?>\s*$/i);
        if (!contentMatch || contentMatch[2].includes(contentMatch[1])) {
            failures.push(`${rel}: description meta tag has an invalid or unescaped content attribute.`);
        }
    }

    for (const match of html.matchAll(/<script\b[^>]*type=[\"']application\/ld\+json[\"'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
            visitStructuredData(JSON.parse(match[1]), file);
        } catch (error) {
            failures.push(`${rel}: invalid JSON-LD (${error.message}).`);
        }
    }
}

if (failures.length > 0) {
    console.error('[seo-semantics] Failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
}

console.log('[seo-semantics] OK: critical metadata, structured-data origins and brand authorship are valid.');
