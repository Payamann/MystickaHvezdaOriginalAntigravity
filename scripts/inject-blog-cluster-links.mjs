#!/usr/bin/env node
/**
 * Injects a static, crawlable "Prozkoumej k tématu" block into each blog
 * post, linking to tool hubs and the newer programmatic clusters
 * (jmena / snar / numerologie / andelske-karty / tarot-vyznam) relevant
 * to the post's category. Static <a> links flow authority from the
 * established, already-indexed blog posts into the fresh cluster pages
 * — unlike the JS-rendered related-posts widget.
 *
 * Usage: node scripts/inject-blog-cluster-links.mjs
 * Idempotent: re-running replaces the block between the markers.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const START = '<!-- BLOG-CLUSTER-LINKS:START -->';
const END = '<!-- BLOG-CLUSTER-LINKS:END -->';

// Curated, relevance-matched targets per category. Each link uses a
// root-relative href + source attribution. Targets are verified to exist
// before injection, so a renamed page never produces a broken link.
const CATEGORY_LINKS = {
    'Numerologie': [
        ['/kalkulacka-cisla-osudu.html', '✨ Spočítat číslo osudu zdarma'],
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

function targetExists(href) {
    // Directory hub like /horoskop/ → index.html
    const rel = href.endsWith('/') ? `${href}index.html` : href;
    return fs.existsSync(path.join(ROOT, rel.replace(/^\//, '')));
}

function buildBlock(links) {
    const chips = links
        .filter(([href]) => targetExists(href))
        .map(([href, label]) => {
            const src = `${href}${href.includes('?') ? '&' : '?'}source=blog_cluster_link`;
            return `<a href="${src}" class="related-chip">${label}</a>`;
        })
        .join('\n                    ');

    return `${START}
    <aside class="blog-cluster-links" aria-labelledby="blog-cluster-links-title">
        <h3 id="blog-cluster-links-title">Prozkoumej k tématu</h3>
        <div class="related-links">
                    ${chips}
        </div>
    </aside>
    ${END}`;
}

function main() {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'blog-index.json'), 'utf8'));
    const posts = Array.isArray(data) ? data : (data.posts || []);

    let updated = 0, skipped = 0;
    for (const post of posts) {
        const links = CATEGORY_LINKS[post.category];
        if (!links) { skipped++; continue; }

        const file = path.join(ROOT, 'blog', `${post.slug}.html`);
        if (!fs.existsSync(file)) { skipped++; continue; }

        let html = fs.readFileSync(file, 'utf8');
        const block = buildBlock(links);

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

        fs.writeFileSync(file, html, 'utf8');
        updated++;
    }

    console.log(`[blog-cluster-links] Injected into ${updated} posts, skipped ${skipped}.`);
}

main();
