import { symbolMarkup } from '../../scripts/lib/ui-symbols.mjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DICTIONARY_TERMS from '../data/dictionary-terms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../');

const TEMPLATE_PATH = path.join(ROOT, 'templates/dictionary-term.html');
const OUTPUT_DIR = path.join(ROOT, 'slovnik');
const INDEX_PATH = path.join(ROOT, 'data/dictionary-index.json');
const SITEMAP_ENTRIES_PATH = path.join(ROOT, 'data/dictionary-sitemap.json');
const STYLESHEET_PATH = path.join(ROOT, 'css/pages/dictionary-term.css');
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const dictionaryStyles = `
.dictionary-header { padding: 4rem 0 2rem; text-align: center; }
.dictionary-badge { display: inline-block; background: rgba(91, 132, 151, 0.12); color: #d0b17c; padding: 0.5rem 1rem; border-radius: 50px; font-size: 0.9rem; margin-bottom: 1rem; border: 1px solid rgba(208, 177, 124, 0.3); }
.dictionary-content { max-width: 800px; margin: 0 auto; background: rgba(16, 38, 56, 0.94); border: 1px solid rgba(255, 255, 255, 0.1); padding: 3rem; border-radius: 20px; backdrop-filter: blur(10px); line-height: 1.8; color: var(--color-text-light); font-size: 1.1rem; }
.dictionary-content h2, .dictionary-content h3 { color: var(--color-mystic-gold); margin-top: 2rem; margin-bottom: 1rem; }
.dictionary-content p { margin-bottom: 1.5rem; }
.dictionary-content ul, .dictionary-content ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
.dictionary-content li { margin-bottom: 0.5rem; }
.related-features { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.1); }
.related-features h3 { text-align: center; margin-bottom: 1.5rem; }
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
.feature-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 1.5rem; border-radius: 12px; text-align: center; transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease; text-decoration: none; color: #e9e3d7; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.feature-card:hover { transform: translateY(-5px); border-color: #bd9b65; background: #153149; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.18); }
.feature-icon { font-size: 2.5rem; }
.feature-title { font-weight: 600; color: var(--color-mystic-gold); }
.breadcrumb { margin-bottom: 2rem; font-size: 0.9rem; color: var(--color-text-mutated); }
.breadcrumb a { color: var(--color-mystic-gold); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.dictionary-heading-container { max-width: 800px; margin: 0 auto; text-align: left; }
.dictionary-title { text-align: left; font-size: 2.5rem; margin: 0.5rem 0 0; }
.dictionary-section { padding-top: 0; }
.dictionary-related-terms { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.08); }
.dictionary-related-terms-title { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: var(--color-text-mutated); margin-bottom: 1rem; }
.dictionary-related-term { display: inline-block; margin: 0.3rem; padding: 0.5rem 1rem; background: rgba(208,177,124,0.08); border: 1px solid rgba(208,177,124,0.3); border-radius: 4px; color: #d0b17c; text-decoration: none; font-size: 0.9rem; transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease; }
.dictionary-related-term:hover { background: rgba(208,177,124,0.16); }
.dictionary-blog-link { margin-top: 2rem; padding: 1.5rem; background: rgba(91,132,151,0.12); border-left: 3px solid #bd9b65; border-radius: 0 4px 4px 0; }
.dictionary-blog-link-copy { margin: 0; font-size: 0.9rem; color: var(--color-text-mutated); }
.dictionary-blog-link-copy strong { color: #e9e3d7; }
.dictionary-blog-link-copy a { color: #d0b17c; text-decoration: underline; }
@media (max-width: 768px) { .dictionary-content { padding: 1.5rem; } }
`;

function validateInput() {
    if (!Array.isArray(DICTIONARY_TERMS) || DICTIONARY_TERMS.length === 0) {
        throw new Error('Dictionary source must contain at least one term. No output was written.');
    }
    if (!fs.existsSync(TEMPLATE_PATH)) {
        throw new Error(`Dictionary template was not found: ${TEMPLATE_PATH}. No output was written.`);
    }

    const slugs = new Set();
    for (const [index, term] of DICTIONARY_TERMS.entries()) {
        const label = `Dictionary term at index ${index}`;
        if (!term || typeof term !== 'object' || Array.isArray(term)) {
            throw new Error(`${label} must be an object. No output was written.`);
        }
        if (typeof term.slug !== 'string' || !SLUG_PATTERN.test(term.slug)) {
            throw new Error(`${label} has an invalid slug. No output was written.`);
        }
        if (slugs.has(term.slug)) {
            throw new Error(`Duplicate dictionary slug: ${term.slug}. No output was written.`);
        }
        if (['title', 'category', 'short_description', 'content_html'].some(key => typeof term[key] !== 'string' || !term[key].trim())) {
            throw new Error(`${label} is missing a required text field. No output was written.`);
        }
        slugs.add(term.slug);
    }
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

function buildRelatedTermsHtml(term, allTerms) {
    if (!term.related_slugs || term.related_slugs.length === 0) return '';
    const related = term.related_slugs
        .map(slug => allTerms.find(t => t.slug === slug))
        .filter(Boolean);
    if (related.length === 0) return '';
    const items = related.map(r => `
        <a href="${r.slug}.html" class="dictionary-related-term">
            ${r.title}
        </a>`).join('');
    return `<div class="dictionary-related-terms">
        <p class="dictionary-related-terms-title">${symbolMarkup('book',true)} Související pojmy</p>
        <div>${items}</div>
    </div>`;
}

function buildRelatedBlogHtml(term) {
    if (!term.linked_blog_slug) return '';
    return `<div class="dictionary-blog-link">
        <p class="dictionary-blog-link-copy">${symbolMarkup('book',true)} <strong>Čtěte v blogu:</strong> <a href="../blog/${term.linked_blog_slug}.html">Přejít na článek →</a></p>
    </div>`;
}

function buildGeneratedFiles(template) {
    const sitemapEntries = [];
    const index = [];
    const generatedFiles = new Map();
    const inlineStyles = new Set();
    for (const term of DICTIONARY_TERMS) {
        for (const match of term.content_html.matchAll(/\sstyle="([^"]*)"/g)) inlineStyles.add(match[1].trim());
    }
    const inlineStyleClass = style => `dictionary-content-style-${crypto.createHash('sha1').update(style).digest('hex').slice(0, 10)}`;
    const extractedCss = [...inlineStyles].sort().map(style => `.${inlineStyleClass(style)} { ${style} }`).join('\n');
    const css = `${dictionaryStyles}\n\n/* Preserved source content styling, moved out of generated HTML. */\n${extractedCss}\n`;

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

        const contentHtml = term.content_html.replace(/<([a-z][\w:-]*)([^>]*)>/gi, (tag, name, attributes) => {
            const styleMatch = attributes.match(/\sstyle="([^"]*)"/i);
            if (!styleMatch) return tag;
            const styleClass = inlineStyleClass(styleMatch[1].trim());
            let cleanAttributes = attributes.replace(styleMatch[0], '');
            const classMatch = cleanAttributes.match(/\sclass="([^"]*)"/i);
            if (classMatch) {
                cleanAttributes = cleanAttributes.replace(classMatch[0], ` class="${classMatch[1]} ${styleClass}"`);
            } else {
                cleanAttributes += ` class="${styleClass}"`;
            }
            return `<${name}${cleanAttributes}>`;
        });
        const fullContentHtml = contentHtml + relatedBlogHtml + relatedTermsHtml;

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
            .replace(/\{\{TITLE\}\}/g, term.title)
            .replace(/\{\{SLUG\}\}/g, term.slug)
            .replace(/\{\{DESCRIPTION\}\}/g, term.short_description)
            .replace(/\{\{CATEGORY\}\}/g, term.category)
            .replace(/\{\{CONTENT_HTML\}\}/g, fullContentHtml)
            .replace(/\{\{RELATED_FEATURES_HTML\}\}/g, relatedFeaturesHtml)
            .replace(/\{\{SCHEMA_JSON\}\}/g, schema);

        html = html.replace(/[ \t]+(?=\r?$)/gm, '');

        const outPath = path.join(OUTPUT_DIR, `${term.slug}.html`);
        generatedFiles.set(outPath, html);

        sitemapEntries.push({ url: `/slovnik/${term.slug}.html`, changefreq: 'monthly', priority: '0.6' });
        index.push({
            slug: term.slug,
            title: term.title,
            category: term.category,
            short_description: term.short_description
        });
    }

    generatedFiles.set(INDEX_PATH, JSON.stringify(index, null, 2));
    generatedFiles.set(SITEMAP_ENTRIES_PATH, JSON.stringify(sitemapEntries, null, 2));
    generatedFiles.set(STYLESHEET_PATH, css);
    return generatedFiles;
}

function normalizeLineEndings(value) {
    return value.replace(/\r\n?/g, '\n');
}

function generate() {
    validateInput();
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const generatedFiles = buildGeneratedFiles(template);
    const checkOnly = process.argv.includes('--check');
    const changedFiles = [];

    for (const [filePath, expected] of generatedFiles) {
        const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
        if (current !== null && normalizeLineEndings(current) === normalizeLineEndings(expected)) continue;

        changedFiles.push(filePath);
        if (checkOnly) continue;

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, expected, 'utf8');
        console.log(`✅ Vygenerováno: ${path.relative(ROOT, filePath).replace(/\\/g, '/')}`);
    }

    if (checkOnly) {
        if (changedFiles.length) {
            for (const filePath of changedFiles) {
                console.error(`❌ Zastaralý nebo chybějící výstup: ${path.relative(ROOT, filePath).replace(/\\/g, '/')}`);
            }
            console.error(`Slovník není synchronizovaný: ${changedFiles.length} z ${generatedFiles.size} souborů se liší.`);
            process.exitCode = 1;
            return;
        }
        console.log(`✅ Slovník je synchronizovaný: ${generatedFiles.size} souborů, bez zápisu.`);
        return;
    }

    console.log(`\n🎉 Slovník úspěšně vygenerován! (${DICTIONARY_TERMS.length} pojmů)`);
}

generate();
