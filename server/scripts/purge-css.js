/**
 * PurgeCSS runner script
 * Usage: node server/scripts/purge-css.js
 *
 * Purges unused CSS from style.v2.css, outputs style.v2.purged.css
 * Then minify: npx cleancss -o css/style.v2.min.css css/style.v2.purged.css
 */
import { PurgeCSS } from 'purgecss';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../').replace(/\\/g, '/');

// Collect content files (forward slashes for cross-platform compat)
const htmlFiles = [];
const jsFiles = [];

for await (const f of glob(`${ROOT}/**/*.html`, { ignore: [
    `${ROOT}/.claude/**`,
    `${ROOT}/node_modules/**`,
]})) {
    htmlFiles.push(f.replace(/\\/g, '/'));
}

for await (const f of glob(`${ROOT}/js/**/*.js`, { ignore: [`${ROOT}/node_modules/**`] })) {
    jsFiles.push(f.replace(/\\/g, '/'));
}

console.log(`📋 Content files: ${htmlFiles.length} HTML, ${jsFiles.length} JS`);

// Read CSS as raw to avoid Windows path issues with PurgeCSS
const cssSource = readFileSync(`${ROOT}/css/style.v2.css`, 'utf8');

const result = await new PurgeCSS().purge({
    content: [...htmlFiles, ...jsFiles],
    css: [{ raw: cssSource }],
    safelist: {
        standard: [
            'active', 'animate-in', 'blur-content', 'btn--active', 'btn--glass',
            'btn--primary', 'btn--processing', 'calculating', 'card-hover', 'closing',
            'done', 'fade-in', 'featured', 'flipped', 'hidden', 'is-flipped',
            'is-premium', 'open', 'personalized-greeting--visible', 'premium-locked',
            'scrolled', 'shake', 'shake-input', 'shaking', 'show', 'shuffling',
            'visible', 'zodiac-card--highlighted',
        ],
        greedy: [
            /^is-/, /^has-/, /^no-/,
            /^animate/, /^fade/, /^slide/, /^pulse/, /^spin/,
            /^modal/, /^overlay/, /^popup/, /^toast/,
            /^nav-/, /^menu-/, /^tab-/,
            /^error/, /^success/, /^warning/, /^loading/, /^disabled/,
            /^selected/, /^checked/,
            /^zodiac-/, /^horoscope-/, /^tarot-/, /^rune-/, /^oracle-/,
            /^natal-/, /^chart-/, /^planet-/, /^moon-/, /^star-/, /^cosmic-/,
            /^mystic-/, /^angel-/,
            /^card-/, /^btn-/, /^icon-/, /^badge-/, /^hero-/, /^section-/, /^page-/,
            /^premium/, /^locked/, /^unlocked/, /^tooltip/, /^dropdown/,
        ],
    },
    variables: true, // Keep CSS custom properties
    keyframes: true, // Keep @keyframes referenced by kept animations
    fontFace: true,  // Keep @font-face rules
});

const [purged] = result;
const outPath = `${ROOT}/css/style.v2.purged.css`;
writeFileSync(outPath, purged.css, 'utf8');

const originalSize = readFileSync(`${ROOT}/css/style.v2.css`, 'utf8').length;
const purgedSize = purged.css.length;
const reduction = ((originalSize - purgedSize) / originalSize * 100).toFixed(1);

console.log(`\n✅ PurgeCSS complete`);
console.log(`   Original: ${(originalSize / 1024).toFixed(1)} KB`);
console.log(`   Purged:   ${(purgedSize / 1024).toFixed(1)} KB`);
console.log(`   Saved:    ${((originalSize - purgedSize) / 1024).toFixed(1)} KB (${reduction}%)`);
console.log(`\n📁 Output: css/style.v2.purged.css`);
console.log(`\nNext step — minify:`);
console.log(`  npx cleancss -o css/style.v2.min.css css/style.v2.purged.css`);
