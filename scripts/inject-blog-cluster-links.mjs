#!/usr/bin/env node
/**
 * Injects a static, crawlable "Prozkoumej k tématu" block into each blog
 * post, linking to tool hubs and the newer programmatic clusters
 * (jmena / snar / numerologie / andelske-karty / tarot-vyznam) relevant
 * to the post's category. Static <a> links flow authority from the
 * established, already-indexed blog posts into the fresh cluster pages
 * — unlike the JS-rendered related-posts widget.
 *
 * Usage: node scripts/inject-blog-cluster-links.mjs [--check]
 * Idempotent: re-running replaces the block between the markers.
 * Check mode reports stale generated blocks without writing any files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { symbolMarkup } from './lib/ui-symbols.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const START = '<!-- BLOG-CLUSTER-LINKS:START -->';
const END = '<!-- BLOG-CLUSTER-LINKS:END -->';

// Curated, relevance-matched targets per category. Each link uses a
// root-relative href + source attribution. Targets are verified to exist
// before injection, so a renamed page never produces a broken link.
const CATEGORY_LINKS = {
    'Numerologie': [
        ['/kalkulacka-cisla-osudu.html', 'Spočítat číslo životní cesty zdarma'],
        ['/numerologie/zivotni-cislo-11.html', '1️⃣1️⃣ Mistrovské číslo 11'],
        ['/numerologie/zivotni-cislo-7.html', '7️⃣ Životní číslo 7'],
        ['/partnerska-numerologie.html', '❤️ Partnerská numerologie']
    ],
    'Tarot': [
        ['/tarot-ano-ne.html', '🃏 Tarot ANO / NE zdarma'],
        ['/tarot-vyznam-karet.html', '🎴 Významy všech 78 karet'],
        ['/tarot-karta-dne.html', '🌟 Tarot karta dne'],
        ['/tarot.html', '🔮 Tarotové výklady']
    ],
    'Snář': [
        ['/snar.html', '🌙 Snář — výklad snů'],
        ['/snar/voda.html', '💧 Sen o vodě'],
        ['/snar/letani.html', '🕊️ Sen o létání'],
        ['/snar/zuby.html', '🦷 Sen o zubech']
    ],
    'Astrologie': [
        ['/horoskopy.html', '⭐ Denní horoskop'],
        ['/natalni-karta.html', '🌌 Natální karta'],
        ['/horoskop/', '♈ Znamení zvěrokruhu'],
        ['/lunace.html', '🌙 Lunární kalendář']
    ],
    'Spiritualita': [
        ['/andelske-karty.html', '🕊️ Andělská karta dne'],
        ['/andelske-karty/archangel-michael.html', '⚔️ Archanděl Michael'],
        ['/mentor.html', '🌟 Hvězdný průvodce'],
        ['/kristalova-koule.html', '🔮 Křišťálová koule']
    ],
    'Šamanismus': [
        ['/shamansko-kolo.html', '🪶 Šamanské kolo'],
        ['/runy.html', 'ᚠ Runy'],
        ['/mentor.html', '🌟 Hvězdný průvodce']
    ],
    'Lunární Magie': [
        ['/lunace.html', '🌙 Lunární kalendář'],
        ['/andelske-karty.html', '🕊️ Andělská karta dne'],
        ['/horoskopy.html', '⭐ Denní horoskop']
    ],
    'Vztahy': [
        ['/partnerska-shoda.html', '❤️ Partnerská shoda'],
        ['/partnerska-numerologie.html', '🔢 Partnerská numerologie'],
        ['/tarot-laska.html', '💕 Tarot lásky']
    ],
    'Kompatibilita': [
        ['/partnerska-shoda.html', '❤️ Partnerská shoda'],
        ['/partnerska-numerologie.html', '🔢 Partnerská numerologie'],
        ['/horoskop/', '♈ Znamení zvěrokruhu']
    ],
    'Věštění': [
        ['/kristalova-koule.html', '🔮 Křišťálová koule'],
        ['/tarot-ano-ne.html', '🃏 Tarot ANO / NE'],
        ['/runy.html', 'ᚠ Runy']
    ]
};

// A few recently refreshed articles have a narrower, editorially verified
// relationship than their broad category suggests. Keep those links precise
// and avoid adding the generic category block when the article already has a
// relevant in-content tool callout.
const POST_LINK_OVERRIDES = new Map([
    ['5-znaku-ze-potkavate-svou-spriznenou-dusi', {
        linkIndent: 12,
        links: [
            ['/partnerska-shoda.html', 'Partnerská shoda'],
            ['/blog/co-je-synastrie-jak-funguje-partnerska-astrologie.html', 'Co je synastrie'],
            ['/blog/attachment-styly-vzorce-ve-vztazich.html', 'Vztahové vzorce']
        ]
    }],
    ['skryty-kod-biorytmu-energeticke-cykly', {
        title: 'Související čtení',
        linkIndent: 12,
        links: [['/blog/biorytmy-proc-se-vam-nedari.html', 'Jak si vést krátký deník vlastní energie']]
    }],
    ['biorytmy-proc-se-vam-nedari', {
        title: 'Související čtení',
        linkIndent: 12,
        endGap: 1,
        links: [['/blog/skryty-kod-biorytmu-energeticke-cykly.html', 'Jak funguje matematický model biorytmů']]
    }]
]);

const POSTS_WITH_RELEVANT_IN_CONTENT_CALLOUT = new Set([
    'co-je-aura-jak-ji-videt-cist-cistit'
]);

// Keep small related links aligned with the local UI symbol set. These
// illustrations are decorative; the link text remains its accessible name.
const SYMBOL_BY_TARGET = new Map([
    ['/blog/co-je-synastrie-jak-funguje-partnerska-astrologie.html', 'book'],
    ['/blog/attachment-styly-vzorce-ve-vztazich.html', 'book'],
    ['/kalkulacka-cisla-osudu.html', 'numbers'],
    ['/numerologie/zivotni-cislo-11.html', 'numbers'],
    ['/numerologie/zivotni-cislo-7.html', 'numbers'],
    ['/partnerska-numerologie.html', 'numbers'],
    ['/tarot-ano-ne.html', 'tarot'],
    ['/tarot-vyznam-karet.html', 'tarot'],
    ['/tarot-karta-dne.html', 'tarot'],
    ['/tarot.html', 'tarot'],
    ['/tarot-laska.html', 'tarot'],
    ['/snar.html', 'dream'],
    ['/snar/voda.html', 'wave'],
    ['/snar/letani.html', 'bird'],
    ['/snar/zuby.html', 'tooth'],
    ['/horoskopy.html', 'star'],
    ['/natalni-karta.html', 'chart'],
    ['/horoskop/', 'star'],
    ['/lunace.html', 'dream'],
    ['/andelske-karty.html', 'angel'],
    ['/andelske-karty/archangel-michael.html', 'angel'],
    ['/mentor.html', 'compass'],
    ['/kristalova-koule.html', 'crystal'],
    ['/shamansko-kolo.html', 'cycle'],
    ['/runy.html', 'rune'],
    ['/partnerska-shoda.html', 'partner']
]);

const DECORATIVE_LABEL_PREFIXES = [
    '1️⃣1️⃣', '7️⃣', '🕊️', '⚔️', '🪶', '🌌', '🌟', '⭐', '🌙',
    '🔮', '🃏', '🎴', '💧', '🦷', '❤️', '💕', '🔢', '♈', 'ᚠ'
];

function labelWithoutDecorativePrefix(label) {
    const prefix = DECORATIVE_LABEL_PREFIXES.find((candidate) => label.startsWith(candidate));
    return prefix ? label.slice(prefix.length).trimStart() : label;
}

function targetExists(href) {
    // Directory hub like /horoskop/ → index.html
    const rel = href.endsWith('/') ? `${href}index.html` : href;
    return fs.existsSync(path.join(ROOT, rel.replace(/^\//, '')));
}

function buildBlock(links, { title = 'Prozkoumej k tématu', linkIndent = 20, endGap = 0 } = {}) {
    const chips = links
        .filter(([href]) => targetExists(href))
        .map(([href, label]) => {
            const src = `${href}${href.includes('?') ? '&' : '?'}source=blog_cluster_link`;
            const symbol = SYMBOL_BY_TARGET.get(href);
            const visibleLabel = symbol
                ? `${symbolMarkup(symbol, true)}${labelWithoutDecorativePrefix(label)}`
                : label;
            return `<a href="${src}" class="related-chip">${visibleLabel}</a>`;
        })
        .join(`\n${' '.repeat(linkIndent)}`);

    return `${START}
    <aside class="blog-cluster-links" aria-labelledby="blog-cluster-links-title">
        <h3 id="blog-cluster-links-title">${title}</h3>
        <div class="related-links">
${' '.repeat(linkIndent)}${chips}
        </div>
    </aside>${'\n'.repeat(endGap)}
    ${END}`;
}

function main() {
    const checkOnly = process.argv.includes('--check');
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'blog-index.json'), 'utf8'));
    const posts = Array.isArray(data) ? data : (data.posts || []);

    const changedFiles = [];
    let unchanged = 0;
    let skipped = 0;
    for (const post of posts) {
        const override = POST_LINK_OVERRIDES.get(post.slug);
        if (!override && POSTS_WITH_RELEVANT_IN_CONTENT_CALLOUT.has(post.slug)) { skipped++; continue; }
        const links = override?.links || CATEGORY_LINKS[post.category];
        if (!links) { skipped++; continue; }

        const file = path.join(ROOT, 'blog', `${post.slug}.html`);
        if (!fs.existsSync(file)) { skipped++; continue; }

        const originalHtml = fs.readFileSync(file, 'utf8');
        let html = originalHtml;
        const block = buildBlock(links, override);

        if (html.includes(START) && html.includes(END)) {
            html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
        } else {
            // Inject just before the footer placeholder (falls back to the
            // related-posts widget or </body> anchor).
            const anchors = ['<!-- RELATED POSTS WIDGET -->', '<div id="related-posts-section"', '<div id="footer-placeholder">', '</body>'];
            const anchor = anchors.find((a) => html.includes(a));
            if (!anchor) { skipped++; continue; }
            html = html.replace(anchor, `${block}\n\n    ${anchor}`);
        }

        if (html === originalHtml) {
            unchanged++;
            continue;
        }

        changedFiles.push(path.relative(ROOT, file));
        if (checkOnly && changedFiles.length <= 3) {
            const currentLines = originalHtml.split(/\r?\n/);
            const expectedLines = html.split(/\r?\n/);
            const maxLines = Math.max(currentLines.length, expectedLines.length);
            let shown = 0;
            for (let index = 0; index < maxLines && shown < 5; index++) {
                if (currentLines[index] !== expectedLines[index]) {
                    const current = currentLines[index] === undefined ? '(missing)' : currentLines[index].trim().slice(0, 160) || '(blank)';
                    const expected = expectedLines[index] === undefined ? '(missing)' : expectedLines[index].trim().slice(0, 160) || '(blank)';
                    console.log(`[blog-cluster-links] ${path.relative(ROOT, file)} line ${index + 1}: current=${current} | expected=${expected}`);
                    shown++;
                }
            }
        }
        if (!checkOnly) fs.writeFileSync(file, html, 'utf8');
    }

    if (checkOnly) {
        console.log(`[blog-cluster-links] ${changedFiles.length} posts need updates; ${unchanged} current; ${skipped} skipped.`);
        if (changedFiles.length) {
            changedFiles.slice(0, 30).forEach((file) => console.log(`- ${file}`));
            process.exitCode = 1;
        }
        return;
    }

    console.log(`[blog-cluster-links] Updated ${changedFiles.length} posts; ${unchanged} current; ${skipped} skipped.`);
}

main();
