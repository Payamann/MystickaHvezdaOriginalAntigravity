import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function replaceRegion(source, marker, content) {
    const start = `<!-- ${marker}:START -->`;
    const end = `<!-- ${marker}:END -->`;
    const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
    if (!pattern.test(source)) throw new Error(`Missing marker region ${marker}`);
    return source.replace(pattern, `${start}\n${content}\n                    ${end}`);
}

function renderFeaturedPost(post) {
    const image = escapeHtml(post.featured_image || 'img/hero-3d.webp');
    return `                    <a href="blog/${escapeHtml(post.slug)}.html" class="featured-post">
                        <div class="featured-post__image-wrapper">
                            <img src="${image}" alt="" role="presentation" class="featured-post__image" width="640" height="360" loading="eager" fetchpriority="high">
                        </div>
                        <div class="featured-post__content">
                            <div class="featured-post__meta"><span>${escapeHtml(post.category || 'Článek')}</span></div>
                            <h2 class="featured-post__title">${escapeHtml(post.title)}</h2>
                            <p class="featured-post__desc">${escapeHtml(post.short_description)}</p>
                            <span class="btn-read-more">Číst článek <span aria-hidden="true">›</span></span>
                        </div>
                    </a>`;
}

function renderBlogCards(posts) {
    return posts.map((post) => {
        const image = escapeHtml(post.featured_image || 'img/hero-3d.webp');
        return `                    <a href="blog/${escapeHtml(post.slug)}.html" class="blog-card">
                        <div class="blog-card-image-wrapper">
                            <img src="${image}" alt="" role="presentation" class="blog-card-image" width="480" height="270" loading="lazy">
                        </div>
                        <div class="blog-card-content">
                            <div class="blog-meta-small">${escapeHtml(post.category || 'Článek')}</div>
                            <div class="blog-title">${escapeHtml(post.title)}</div>
                            <div class="blog-desc">${escapeHtml(post.short_description)}</div>
                        </div>
                    </a>`;
    }).join('\n');
}

function renderDictionaryCards(terms) {
    return terms.map((term) => `                    <a href="slovnik/${escapeHtml(term.slug)}.html" class="term-card">
                        <div class="term-category">${escapeHtml(term.category || 'Obecné')}</div>
                        <div class="term-title">${escapeHtml(term.title)}</div>
                        <div class="term-desc">${escapeHtml(term.short_description)}</div>
                    </a>`).join('\n');
}

function updateFile(relativePath, transform) {
    const filePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(filePath, 'utf8');
    const next = transform(source);
    if (source === next) return false;
    if (CHECK_ONLY) throw new Error(`${relativePath} static hub content is stale`);
    fs.writeFileSync(filePath, next, 'utf8');
    return true;
}

const blogPosts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'blog-index.json'), 'utf8'));
const dictionaryTerms = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dictionary-index.json'), 'utf8'));
if (!blogPosts.length || !dictionaryTerms.length) throw new Error('Hub data must not be empty');

const blogChanged = updateFile('blog.html', (source) => {
    const withFeatured = replaceRegion(source, 'STATIC-BLOG-FEATURED', renderFeaturedPost(blogPosts[0]));
    return replaceRegion(withFeatured, 'STATIC-BLOG-LINKS', renderBlogCards(blogPosts.slice(1)));
});
const dictionaryChanged = updateFile('slovnik.html', (source) => (
    replaceRegion(source, 'STATIC-DICTIONARY-LINKS', renderDictionaryCards(dictionaryTerms))
));

console.log(`[static-hubs] ${CHECK_ONLY ? 'checked' : 'rendered'} blog=${blogPosts.length} dictionary=${dictionaryTerms.length} changed=${blogChanged || dictionaryChanged}`);
