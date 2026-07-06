import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    FEATURE_CATALOG,
    FEATURE_PLAN_MAP,
    PRODUCT_CATALOG,
    TRACKING_PAYLOAD_KEYS
} from '../server/config/growth-loop.js';
import { SUBSCRIPTION_PLANS } from '../server/config/constants.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const shouldWrite = args.has('--write');

const scanRoots = [
    rootDir,
    path.join(rootDir, 'blog'),
    path.join(rootDir, 'components'),
    path.join(rootDir, 'horoskop'),
    path.join(rootDir, 'jmena'),
    path.join(rootDir, 'partnerska-shoda'),
    path.join(rootDir, 'ritualy'),
    path.join(rootDir, 'slovnik'),
    path.join(rootDir, 'tarot-vyznam'),
    path.join(rootDir, 'js')
];

const ignoredDirs = new Set([
    '.git',
    '.claude',
    '.claire',
    '.pytest-tmp',
    'artifacts',
    'coverage',
    'dist',
    'docs',
    'node_modules',
    'playwright-report',
    'social-media-agent',
    'test-results',
    'tests',
    'tmp'
]);

const allowedExtensions = new Set(['.html', '.js']);
const knownFeatures = new Set([
    ...Object.keys(FEATURE_CATALOG),
    ...Object.keys(FEATURE_PLAN_MAP)
]);
const knownProducts = new Set(Object.keys(PRODUCT_CATALOG));
const knownPlans = new Set(Object.keys(SUBSCRIPTION_PLANS));

function toPosix(relativePath) {
    return relativePath.replace(/\\/g, '/');
}

function shouldSkipPath(filePath) {
    const relativePath = toPosix(path.relative(rootDir, filePath));
    const parts = relativePath.split('/');
    if (parts.some((part) => ignoredDirs.has(part))) return true;
    if (relativePath.startsWith('js/dist/') || relativePath.startsWith('js/vendor/')) return true;
    return false;
}

function collectFiles(dir, files = []) {
    if (!fs.existsSync(dir) || shouldSkipPath(dir)) return files;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (shouldSkipPath(fullPath)) continue;

        if (entry.isDirectory()) {
            if (dir === rootDir && !scanRoots.includes(fullPath)) continue;
            collectFiles(fullPath, files);
            continue;
        }

        if (entry.isFile() && allowedExtensions.has(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }

    return files;
}

function collectRootHtml() {
    return fs.readdirSync(rootDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
        .map((entry) => path.join(rootDir, entry.name));
}

function collectScanFiles() {
    const files = new Set(collectRootHtml());
    for (const dir of scanRoots.filter((dir) => dir !== rootDir)) {
        for (const file of collectFiles(dir)) files.add(file);
    }
    return [...files].sort((a, b) => a.localeCompare(b));
}

function cleanHtmlEntities(value) {
    return String(value || '')
        .replace(/&amp;/g, '&')
        .replace(/&#38;/g, '&')
        .trim();
}

function parseAttributes(tag) {
    const attrs = {};
    for (const match of tag.matchAll(/([:@a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        const [, rawName, doubleValue, singleValue, bareValue] = match;
        const name = rawName.toLowerCase();
        if (name === 'a') continue;
        attrs[name] = cleanHtmlEntities(doubleValue ?? singleValue ?? bareValue ?? '');
    }
    return attrs;
}

function safeUrl(href) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
    try {
        return new URL(cleanHtmlEntities(href), 'https://www.mystickahvezda.cz/');
    } catch {
        return null;
    }
}

function extractTextNear(source, index) {
    const slice = source.slice(index, Math.min(source.length, index + 500));
    return slice
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120);
}

function addFeature(features, feature, file, line) {
    if (!feature || feature.includes('$') || feature === 'null') return;
    features.push({ feature, file, line });
}

function lineForIndex(source, index) {
    return source.slice(0, index).split(/\r?\n/).length;
}

function extractFeatureReferences(source, file) {
    const references = [];
    const patterns = [
        /[?&](?:amp;)?feature=([a-z0-9_-]+)/g,
        /data-analytics-feature=["']([^"']+)["']/g,
        /searchParams\.set\(['"]feature['"],\s*['"]([a-z0-9_-]+)['"]\)/g,
        /(?:^|[^a-zA-Z0-9_])feature\s*[:=]\s*['"]([a-z0-9_-]+)['"]/g
    ];

    for (const pattern of patterns) {
        for (const match of source.matchAll(pattern)) {
            addFeature(references, match[1], file, lineForIndex(source, match.index || 0));
        }
    }

    return references;
}

function extractProductReferences(source, file) {
    const references = [];
    const patterns = [
        /[?&](?:amp;)?product(?:_id)?=([a-z0-9_-]+)/g,
        /data-analytics-product=["']([^"']+)["']/g,
        /data-product=["']([^"']+)["']/g
    ];

    for (const pattern of patterns) {
        for (const match of source.matchAll(pattern)) {
            references.push({
                product: match[1],
                file,
                line: lineForIndex(source, match.index || 0)
            });
        }
    }

    return references;
}

function getUrlContext(attrs) {
    const url = safeUrl(attrs.href);
    return {
        url,
        source: url?.searchParams.get('source') || null,
        feature: attrs['data-analytics-feature'] || url?.searchParams.get('feature') || null,
        productId: attrs['data-analytics-product'] || attrs['data-product'] || url?.searchParams.get('product_id') || url?.searchParams.get('product') || null,
        planId: attrs['data-plan'] || attrs['data-analytics-plan'] || url?.searchParams.get('plan') || null,
        intent: attrs['data-analytics-intent'] || url?.searchParams.get('intent') || null,
        cta: attrs['data-analytics-cta'] || null
    };
}

function isPaidIntent(attrs, context) {
    const pathName = context.url?.pathname || '';
    if (context.planId && context.planId !== 'poutnik') return true;
    if (pathName.endsWith('/cenik.html') && (context.source || context.feature || context.cta)) return true;
    if (pathName.endsWith('/prihlaseni.html') && context.planId) return true;
    return false;
}

function extractCtaInventory(source, file) {
    const items = [];

    for (const match of source.matchAll(/<a\b[\s\S]*?>/gi)) {
        const tag = match[0];
        const attrs = parseAttributes(tag);
        if (!attrs.href && !attrs['data-plan']) continue;

        const context = getUrlContext(attrs);
        if (!context.url) continue;

        items.push({
            file,
            line: lineForIndex(source, match.index || 0),
            href: attrs.href || null,
            text: extractTextNear(source, match.index || 0),
            cta: context.cta,
            source: context.source,
            feature: context.feature,
            productId: context.productId,
            planId: context.planId,
            intent: context.intent,
            paidIntent: isPaidIntent(attrs, context)
        });
    }

    return items;
}

function formatRef(ref, key = 'feature') {
    return `${toPosix(path.relative(rootDir, ref.file))}:${ref.line} (${ref[key]})`;
}

const files = collectScanFiles();
const featureRefs = [];
const productRefs = [];
const ctaInventory = [];

for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    featureRefs.push(...extractFeatureReferences(source, file));
    productRefs.push(...extractProductReferences(source, file));
    if (file.endsWith('.html')) ctaInventory.push(...extractCtaInventory(source, file));
}

const unknownFeatures = featureRefs
    .filter((ref) => !knownFeatures.has(ref.feature))
    .sort((a, b) => a.feature.localeCompare(b.feature) || a.file.localeCompare(b.file));
const unknownProducts = productRefs
    .filter((ref) => !knownProducts.has(ref.product))
    .sort((a, b) => a.product.localeCompare(b.product) || a.file.localeCompare(b.file));
const unknownPlans = ctaInventory
    .filter((item) => item.planId && !item.planId.includes('$') && !knownPlans.has(item.planId))
    .sort((a, b) => String(a.planId).localeCompare(String(b.planId)) || a.file.localeCompare(b.file));
const paidCtasMissingSource = ctaInventory
    .filter((item) => item.paidIntent && !item.source)
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

const paidCtas = ctaInventory.filter((item) => item.paidIntent);
const featureCounts = new Map();
for (const item of paidCtas) {
    const feature = item.feature || '(missing)';
    featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
}

const report = {
    generatedAt: new Date().toISOString(),
    scannedFiles: files.length,
    trackingPayloadKeys: TRACKING_PAYLOAD_KEYS,
    knownFeatures: knownFeatures.size,
    knownProducts: knownProducts.size,
    paidCtaCount: paidCtas.length,
    paidCtasMissingSource: paidCtasMissingSource.map((item) => ({
        file: toPosix(path.relative(rootDir, item.file)),
        line: item.line,
        href: item.href,
        text: item.text
    })),
    unknownFeatures: unknownFeatures.map((ref) => ({
        feature: ref.feature,
        file: toPosix(path.relative(rootDir, ref.file)),
        line: ref.line
    })),
    unknownProducts: unknownProducts.map((ref) => ({
        product: ref.product,
        file: toPosix(path.relative(rootDir, ref.file)),
        line: ref.line
    })),
    unknownPlans: unknownPlans.map((item) => ({
        planId: item.planId,
        file: toPosix(path.relative(rootDir, item.file)),
        line: item.line,
        href: item.href
    })),
    topPaidFeatures: [...featureCounts.entries()]
        .map(([feature, count]) => ({ feature, count }))
        .sort((a, b) => b.count - a.count || a.feature.localeCompare(b.feature))
        .slice(0, 20),
    paidCtas: paidCtas.map((item) => ({
        file: toPosix(path.relative(rootDir, item.file)),
        line: item.line,
        href: item.href,
        text: item.text,
        source: item.source,
        feature: item.feature,
        productId: item.productId,
        planId: item.planId,
        intent: item.intent
    }))
};

if (shouldWrite) {
    const outDir = path.join(rootDir, 'tmp');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
        path.join(outDir, 'growth-loop-cta-inventory.json'),
        `${JSON.stringify(report, null, 2)}\n`
    );
}

console.log(`[growth-loop-audit] scanned ${report.scannedFiles} files`);
console.log(`[growth-loop-audit] known features: ${report.knownFeatures}; known products: ${report.knownProducts}`);
console.log(`[growth-loop-audit] paid CTAs: ${report.paidCtaCount}`);
console.log('[growth-loop-audit] top paid features:');
for (const row of report.topPaidFeatures.slice(0, 8)) {
    console.log(`  - ${row.feature}: ${row.count}`);
}
if (shouldWrite) {
    console.log('[growth-loop-audit] wrote tmp/growth-loop-cta-inventory.json');
}

if (unknownFeatures.length || unknownProducts.length || unknownPlans.length || paidCtasMissingSource.length) {
    console.error('[growth-loop-audit] Growth-loop contract violations found.');
    if (unknownFeatures.length) {
        console.error(`Unknown features:\n${unknownFeatures.slice(0, 30).map((ref) => `  - ${formatRef(ref)}`).join('\n')}`);
    }
    if (unknownProducts.length) {
        console.error(`Unknown products:\n${unknownProducts.slice(0, 30).map((ref) => `  - ${formatRef(ref, 'product')}`).join('\n')}`);
    }
    if (unknownPlans.length) {
        console.error(`Unknown plans:\n${unknownPlans.slice(0, 30).map((item) => `  - ${toPosix(path.relative(rootDir, item.file))}:${item.line} (${item.planId})`).join('\n')}`);
    }
    if (paidCtasMissingSource.length) {
        console.error(`Paid CTAs missing source:\n${paidCtasMissingSource.slice(0, 30).map((item) => `  - ${toPosix(path.relative(rootDir, item.file))}:${item.line} ${item.href}`).join('\n')}`);
    }
    process.exitCode = 1;
}
