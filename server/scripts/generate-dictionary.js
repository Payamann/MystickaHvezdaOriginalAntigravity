import { symbolMarkup } from '../../scripts/lib/ui-symbols.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DICTIONARY_TERMS from '../data/dictionary-terms.js';
import { atlasShell } from '../../scripts/atlas-shell.mjs';
import { refreshCssAssetReferences } from '../../scripts/lib/release-css-versions.mjs';
import { prepareGeneratedPage } from '../../scripts/lib/generated-page-metadata.mjs';
import { refreshRuntimeAssetReferences } from '../../scripts/lib/release-runtime-versions.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../');

const TEMPLATE_PATH = path.join(ROOT, 'templates/dictionary-term.html');
const OUTPUT_DIR = path.join(ROOT, 'slovnik');
const INDEX_PATH = path.join(ROOT, 'data/dictionary-index.json');
const SITEMAP_ENTRIES_PATH = path.join(ROOT, 'data/dictionary-sitemap.json');
const CHECK_ONLY = process.argv.includes('--check');
const checkDrift = [];
let checkExample = null;

function writeGenerated(filePath, content) {
    content = refreshCssAssetReferences(content);
    content = refreshRuntimeAssetReferences(content);
    if (CHECK_ONLY) {
        const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
        if (current !== content) {
            checkDrift.push(path.relative(ROOT, filePath));
            if (!checkExample && current !== null) {
                const before = current.split(/\r?\n/);
                const after = content.split(/\r?\n/);
                const index = before.findIndex((line, i) => line !== after[i]);
                const sameNonblank = before.filter((line) => line.trim()).join('\n') === after.filter((line) => line.trim()).join('\n');
                checkExample = `${path.relative(ROOT, filePath)} around line ${index + 1}: current=${before.slice(index, index + 4).map((line) => line.trim()).join(' | ')} | expected=${after.slice(index, index + 4).map((line) => line.trim()).join(' | ')}; nonblank-lines-match=${sameNonblank}, line-counts=${before.length}/${after.length}`;
            }
        }
        return;
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

function categoryToFeature(category) {
    const map = {
        'Astrologie': { icon: symbolMarkup('chart'), link: '../natalni-karta.html', label: 'Natální Karta' },
        'Tarot': { icon: symbolMarkup('tarot'), link: '../tarot.html', label: 'Tarot výklad' },
        'Numerologie': { icon: symbolMarkup('numbers'), link: '../numerologie.html', label: 'Numerologie' },
        'Runosloví': { icon: symbolMarkup('rune'), link: '../runy.html', label: 'Výklad Run' },
        'Energie': { icon: symbolMarkup('energy'), link: '../mentor.html', label: 'Průvodce' },
        'Spiritualita': { icon: symbolMarkup('star'), link: '../horoskopy.html', label: 'Horoskopy' },
        'Snář': { icon: symbolMarkup('dream'), link: '../snar.html', label: 'Snář' },
    };
    return map[category] || { icon: symbolMarkup('star'), link: '../index.html', label: 'Mystická Hvězda' };
}

function escapeTemplateValue(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildRelatedTermsHtml(term, allTerms) {
    if (!term.related_slugs || term.related_slugs.length === 0) return '';
    const related = term.related_slugs
        .map(slug => allTerms.find(t => t.slug === slug))
        .filter(Boolean);
    if (related.length === 0) return '';
    const items = related.map(r => `
        <a href="${r.slug}.html" style="display:inline-block; margin: 0.3rem; padding: 0.5rem 1rem; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); border-radius: 50px; color: #d4af37; text-decoration: none; font-size: 0.9rem; transition: all 0.2s ease;">
            ${r.title}
        </a>`).join('');
    return `<div style="margin-top:3rem; padding-top:2rem; border-top: 1px solid rgba(255,255,255,0.08);">
        <p style="font-size:0.85rem; text-transform:uppercase; letter-spacing:1px; color:var(--color-text-mutated); margin-bottom:1rem;">${symbolMarkup('book',true)} Související pojmy</p>
        <div>${items}</div>
    </div>`;
}

function buildRelatedBlogHtml(term) {
    if (!term.linked_blog_slug) return '';
    return `<div style="margin-top:2rem; padding: 1.5rem; background: rgba(155,89,182,0.08); border-left: 3px solid var(--color-primary); border-radius:0 12px 12px 0;">
        <p style="margin:0; font-size:0.9rem; color:var(--color-text-mutated);">${symbolMarkup('book',true)} <strong style="color:white;">Čtěte v blogu:</strong> <a href="../blog/${term.linked_blog_slug}.html" style="color:var(--color-primary); text-decoration:underline;">Přejít na článek →</a></p>
    </div>`;
}

function applyDictionaryStylesheet(html, slug) {
    // Atlas migration extracted this template's page-specific rules into a
    // checked-in stylesheet for each term; keep that same canonical output.
    const withoutInlineStyles = html.replace(/\s*<style>[^]*?<\/style>/i, '');
    return withoutInlineStyles.replace(
        '    <script src="/js/dist/analytics-init.js" defer></script>',
        `    <script src="/js/dist/analytics-init.js" defer></script>\n    <link rel="stylesheet" href="../css/pages/slovnik-${slug}.css">`
    );
}

function applyDictionaryRuntimeShell(html) {
    return html.replace(/<header\b[^>]*class="header"[^>]*>[\s\S]*?<\/header>/i,
        '<div id="header-placeholder"></div>')
        .replace('../js/main.js', '../js/dist/main.js');
}

function applyDictionaryInlineStyleClasses(html, slug) {
    const cssPath = path.join(ROOT, 'css', 'pages', `slovnik-${slug}.css`);
    const stylesheet = fs.readFileSync(cssPath, 'utf8');
    const migratedRules = [...stylesheet.matchAll(/\.mh-inline-([\da-f]+)\s*\{([^}]*)\}/gi)]
        .map(([, classId, declarations]) => ({ className: `mh-inline-${classId}`, declarations: new Map(
            declarations.split(';').map((entry) => /^\s*([^:]+):\s*(.*?)\s*$/.exec(entry)).filter(Boolean)
                .map(([, property, value]) => [property.trim().toLowerCase(), value.trim().toLowerCase()])
        ) }));
    return html.replace(/<([a-z][\w:-]*)\b[^>]*>/gi, (tag) => {
        const styleMatch = /\sstyle="([^"]*)"/i.exec(tag);
        if (!styleMatch) return tag;
        const inline = new Map(styleMatch[1].split(';').map((entry) => /^\s*([^:]+):\s*(.*?)\s*$/.exec(entry)).filter(Boolean)
            .map(([, property, value]) => [property.trim().toLowerCase(), value.trim().toLowerCase()]));
        const match = migratedRules.find((rule) => [...inline].filter(([property]) => property !== 'transition')
            .every(([property, value]) => rule.declarations.get(property) === value));
        if (!match) return tag;
        const className = `${match.className}${styleMatch[1].startsWith('margin-top:2rem;') ? ' atlas-dictionary-callout' : ''}`;
        let next = tag.replace(styleMatch[0], '');
        const classMatch = /\sclass="([^"]*)"/i.exec(next);
        if (classMatch) return next.replace(classMatch[0], ` class="${classMatch[1]} ${className}"`);
        return next.replace(/>$/, ` class="${className}">`);
    });
}

function generate() {
    if (!CHECK_ONLY && !fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const sitemapEntries = [];
    const index = [];

    for (const term of DICTIONARY_TERMS) {
        const feature = categoryToFeature(term.category);
        const relatedTermsHtml = buildRelatedTermsHtml(term, DICTIONARY_TERMS);
        const relatedBlogHtml = buildRelatedBlogHtml(term);

        const relatedFeaturesHtml = `
            <a href="${feature.link}" class="feature-card">
                <div class="feature-icon">${feature.icon}</div>
                <div class="feature-title">${feature.label}</div>
            </a>
            <a href="../blog.html" class="feature-card">
                <div class="feature-icon">${symbolMarkup('pen')}</div>
                <div class="feature-title">Blog</div>
            </a>
            <a href="../slovnik.html" class="feature-card">
                <div class="feature-icon">${symbolMarkup('book')}</div>
                <div class="feature-title">Celý Slovník</div>
            </a>`;

        const fullContentHtml = term.content_html + relatedBlogHtml + relatedTermsHtml;

        const schema = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            "name": term.title,
            "description": term.short_description,
            "inDefinedTermSet": {
                "@type": "DefinedTermSet",
                "name": "Ezoterický Slovník – Mystická Hvězda",
                "url": "https://www.mystickahvezda.cz/slovnik.html"
            }
        }, null, 2);

        let html = template
            .replace(/\{\{TITLE\}\}/g, escapeTemplateValue(term.title))
            .replace(/\{\{SLUG\}\}/g, term.slug)
            .replace(/\{\{DESCRIPTION\}\}/g, escapeTemplateValue(term.short_description))
            .replace(/\{\{CATEGORY\}\}/g, term.category)
            .replace(/\{\{CONTENT_HTML\}\}/g, fullContentHtml)
            .replace(/\{\{RELATED_FEATURES_HTML\}\}/g, relatedFeaturesHtml)
            .replace(/\{\{SCHEMA_JSON\}\}/g, schema);

        const outPath = path.join(OUTPUT_DIR, `${term.slug}.html`);
        writeGenerated(
            outPath,
            atlasShell(
                prepareGeneratedPage(applyDictionaryInlineStyleClasses(applyDictionaryRuntimeShell(applyDictionaryStylesheet(html, term.slug)), term.slug), `slovnik/${term.slug}.html`),
                'atlas-content-page atlas-content-detail',
                'atlas-content.css'
            )
        );
        if (!CHECK_ONLY) console.log(`✅ Vygenerováno: /slovnik/${term.slug}.html`);

        sitemapEntries.push({ url: `/slovnik/${term.slug}.html`, changefreq: 'monthly', priority: '0.6' });
        index.push({
            slug: term.slug,
            title: term.title,
            category: term.category,
            short_description: term.short_description
        });
    }

    writeGenerated(INDEX_PATH, JSON.stringify(index, null, 2));
    writeGenerated(SITEMAP_ENTRIES_PATH, JSON.stringify(sitemapEntries, null, 2));
    if (CHECK_ONLY && checkDrift.length) {
        console.error(`[dictionary] Check failed: ${checkDrift.length} generated file(s) differ: ${checkDrift.slice(0, 20).join(', ')}. Example: ${checkExample}`);
        process.exitCode = 1;
    } else if (CHECK_ONLY) {
        console.log(`[dictionary] Check passed: ${DICTIONARY_TERMS.length} terms and indexes current; no files written.`);
    } else {
        console.log(`\n📂 Slovníkový index uložen: data/dictionary-index.json`);
        console.log(`🗺️  Sitemap data uložena: data/dictionary-sitemap.json`);
        console.log(`\n🎉 Slovník úspěšně vygenerován! (${DICTIONARY_TERMS.length} pojmů)`);
    }
}

generate();
