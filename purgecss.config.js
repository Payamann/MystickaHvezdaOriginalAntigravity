/**
 * PurgeCSS configuration for Mystická Hvězda
 *
 * Scans all HTML and JS files to find used CSS classes.
 * Safelist protects classes added dynamically via JS at runtime.
 *
 * Run: npx purgecss --config purgecss.config.js
 * This replaces css/style.v2.css with a purged copy, then re-minify with:
 *   npx cleancss -o css/style.v2.min.css css/style.v2.purged.css
 */
export default {
    content: [
        // All HTML files (static pages)
        './**/*.html',
        // All frontend JS files
        './js/**/*.js',
        // Exclude worktrees and node_modules
        '!./.claude/**',
        '!./node_modules/**',
        '!./server/**',
    ],
    css: ['./css/style.v2.css'],
    output: './css/',
    // Rename output to style.v2.purged.css to avoid overwriting source
    // Note: PurgeCSS preserves original filename in output dir,
    // so the output file will be css/style.v2.css — rename manually after.
    safelist: {
        // Exact class names added dynamically via classList.add / toggle
        standard: [
            'active',
            'animate-in',
            'blur-content',
            'btn--active',
            'btn--glass',
            'btn--primary',
            'btn--processing',
            'calculating',
            'card-hover',
            'closing',
            'done',
            'fade-in',
            'featured',
            'flipped',
            'hidden',
            'is-flipped',
            'is-premium',
            'open',
            'personalized-greeting--visible',
            'premium-locked',
            'scrolled',
            'shake',
            'shake-input',
            'shaking',
            'show',
            'shuffling',
            'visible',
            'zodiac-card--highlighted',
        ],
        // Pattern-based: catch classes constructed via template literals or string concatenation
        greedy: [
            // State prefixes
            /^is-/,
            /^has-/,
            /^no-/,
            // Animation & transition classes
            /^animate/,
            /^fade/,
            /^slide/,
            /^pulse/,
            /^spin/,
            // Modal, overlay, popup
            /^modal/,
            /^overlay/,
            /^popup/,
            /^toast/,
            // Navigation
            /^nav-/,
            /^menu-/,
            /^tab-/,
            /^breadcrumb/,
            // Status / state
            /^error/,
            /^success/,
            /^warning/,
            /^info-/,
            /^loading/,
            /^disabled/,
            /^selected/,
            /^checked/,
            // Zodiac / astrology domain
            /^zodiac-/,
            /^horoscope-/,
            /^tarot-/,
            /^rune-/,
            /^oracle-/,
            /^natal-/,
            /^chart-/,
            /^planet-/,
            /^moon-/,
            /^star-/,
            /^cosmic-/,
            /^mystic-/,
            /^angel-/,
            // UI components
            /^card-/,
            /^btn-/,
            /^icon-/,
            /^badge-/,
            /^tag-/,
            /^chip-/,
            /^avatar-/,
            /^hero-/,
            /^section-/,
            /^page-/,
            /^sidebar-/,
            /^footer-/,
            /^header-/,
            // Responsive / theme
            /^mobile-/,
            /^desktop-/,
            /^dark-/,
            /^light-/,
            // Miscellaneous dynamic patterns
            /^premium/,
            /^free-/,
            /^locked/,
            /^unlocked/,
            /^tooltip/,
            /^dropdown/,
            /^accordion/,
            /^collapse/,
            /^expand/,
        ],
        // Preserve all pseudo-class and keyframe variations
        deep: [/^body/, /^html/, /^:root/],
    },
};
