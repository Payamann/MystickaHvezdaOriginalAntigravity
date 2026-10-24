const PREVIEW_BASE = 'https://www.mystickahvezda.cz/img/search-preview/';

const ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
    ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“'
};

function decodeHtml(value) {
    return value
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function readAttributes(tag) {
    return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map((match) => [match[1].toLowerCase(), match[3]]));
}

function replaceMeta(source, key, value, kind = 'property') {
    const escaped = value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let found = false;
    source = source.replace(/<meta\b[^>]*>/gi, (tag) => {
        const attributes = readAttributes(tag);
        if ((attributes[kind] || '').toLowerCase() !== key.toLowerCase()) return tag;
        found = true;
        const content = /\bcontent\s*=\s*(["']).*?\1/i;
        if (content.test(tag)) return tag.replace(content, (match) => {
            const quote = match.match(/=\s*(["'])/)[1];
            return `content=${quote}${escaped}${quote}`;
        });
        return tag.slice(0, -1) + ` content="${escaped}">`;
    });
    if (!found) {
        const newline = source.includes('\r\n') ? '\r\n' : '\n';
        const insertion = `<meta ${kind}="${key}" content="${escaped}">${newline}`;
        source = source.replace(/<\/head\s*>/i, `${insertion}</head>`);
    }
    return source;
}

function previewCategory(relativePath) {
    const path = relativePath.replaceAll('\\', '/');
    if (path.startsWith('jmena/')) return 'names';
    if (path === 'snar.html' || path.startsWith('snar/')) return 'dreams';
    if (path.startsWith('slovnik/')) return 'dictionary';
    if (path.startsWith('numerologie/')) return 'numerology';
    if (path === 'andelske-karty.html' || path.startsWith('andelske-karty/')) return 'angels';
    if (path.startsWith('horoskop/')) return 'horoscopes';
    if (path.startsWith('tarot-vyznam/')) return 'tarot-card';
    return null;
}

function addFavicons(html, relativePath) {
    if (html.includes('rel="icon"')) return html;
    const normalized = relativePath.replaceAll('\\', '/');
    const depth = normalized.split('/').length - 1;
    const prefix = '../'.repeat(depth);
    const block = `  <link rel="icon" type="image/svg+xml" href="/img/icons/mh-favicon.svg">\n  <link rel="apple-touch-icon" href="${prefix}img/icon-192.webp">`;
    const charset = /<meta\s+charset\b[^>]*>/i.exec(html);
    if (charset) return html.slice(0, charset.index + charset[0].length) + `\n${block}` + html.slice(charset.index + charset[0].length);
    return html.replace(/<head>/i, (tag) => `${tag}\n${block}`);
}

export function prepareGeneratedPage(html, relativePath) {
    const category = previewCategory(relativePath);
    if (!category) return html;
    html = addFavicons(html, relativePath);

    const titleMatch = /<title\b[^>]*>(.*?)<\/title\s*>/is.exec(html);
    const alt = titleMatch
        ? decodeHtml(titleMatch[1].replace(/<[^>]+>/g, '')).split(/\s+/).filter(Boolean).join(' ')
        : 'Mystická Hvězda';
    const image = `${PREVIEW_BASE}${category}.webp`;
    html = replaceMeta(html, 'og:image', image);
    html = replaceMeta(html, 'og:image:width', '1200');
    html = replaceMeta(html, 'og:image:height', '630');
    html = replaceMeta(html, 'twitter:card', 'summary_large_image', 'name');
    html = replaceMeta(html, 'twitter:image', image, 'name');
    html = replaceMeta(html, 'og:image:alt', alt);
    html = replaceMeta(html, 'twitter:image:alt', alt, 'name');
    const newline = html.includes('\r\n') ? '\r\n' : '\n';
    return html.replace(/(?:\r?\n){3,}/g, `${newline}${newline}`);
}
