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

function responsiveImageAttrs(image, sizes) {
    const source = String(image ?? '').replace(/^(?:\.\.\/|\/+)/, '');
    if (!source.startsWith('img/')) return '';

    let candidateWidths;
    let originalWidth;
    let base = source.replace(/\.webp$/i, '');
    if (source.startsWith('img/tarot-v2/')) {
        candidateWidths = [240, 360, 480];
        originalWidth = 600;
    } else if (source.startsWith('img/atlas/tools-v1/')) {
        candidateWidths = [480, 800];
        originalWidth = 1200;
    } else if (source.startsWith('img/atlas/social-v1/')) {
        candidateWidths = [480, 800];
        originalWidth = 1080;
    } else if (source.startsWith('img/atlas/editorial-v1/')) {
        const widthMatch = base.match(/-(480|800|960|1200)$/);
        if (!widthMatch) return '';
        originalWidth = Number(widthMatch[1]);
        base = base.replace(/-(480|800|960|1200)$/, '');
        candidateWidths = [480, 800, 960];
    } else {
        return '';
    }

    const candidates = candidateWidths
        .filter((width) => width < originalWidth && fs.existsSync(path.join(ROOT, `${base}-${width}.webp`)))
        .map((width) => `${base}-${width}.webp ${width}w`);
    if (!candidates.length) return '';
    candidates.push(`${source} ${originalWidth}w`);
    return ` srcset="${escapeHtml(candidates.join(', '))}" sizes="${escapeHtml(sizes)}"`;
}

function replaceRegion(source, marker, content) {
    const start = `<!-- ${marker}:START -->`;
    const end = `<!-- ${marker}:END -->`;
    const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
    if (!pattern.test(source)) throw new Error(`Missing marker region ${marker}`);
    return source.replace(pattern, `${start}\n${content}\n                    ${end}`);
}

function renderFeaturedPost(post) {
    const imagePath = post.featured_image || 'img/atlas/social-v1/09-granatove-jablko.webp';
    const image = escapeHtml(imagePath);
    const imageAttrs = responsiveImageAttrs(imagePath, '(max-width: 720px) 88vw, 640px');
    return `                    <a href="blog/${escapeHtml(post.slug)}.html" class="featured-post">
                        <div class="featured-post__image-wrapper">
                            <img src="${image}"${imageAttrs} alt="" role="presentation" class="featured-post__image" width="640" height="360" loading="eager" fetchpriority="high">
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
        const imagePath = post.featured_image || 'img/atlas/social-v1/09-granatove-jablko.webp';
        const image = escapeHtml(imagePath);
        const imageAttrs = responsiveImageAttrs(imagePath, '(max-width: 720px) 88vw, 320px');
        return `                    <a href="blog/${escapeHtml(post.slug)}.html" class="blog-card">
                        <div class="blog-card-image-wrapper">
                            <img src="${image}"${imageAttrs} alt="" role="presentation" class="blog-card-image" width="480" height="270" loading="lazy">
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
    return replaceRegion(withFeatured, 'STATIC-BLOG-LINKS', renderBlogCards(blogPosts.slice(1, 8)));
});
const dictionaryChanged = updateFile('slovnik.html', (source) => (
    replaceRegion(source, 'STATIC-DICTIONARY-LINKS', renderDictionaryCards(dictionaryTerms))
));

console.log(`[static-hubs] ${CHECK_ONLY ? 'checked' : 'rendered'} blog=${blogPosts.length} dictionary=${dictionaryTerms.length} changed=${blogChanged || dictionaryChanged}`);
