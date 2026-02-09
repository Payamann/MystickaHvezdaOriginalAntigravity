/**
 * Mystická Hvězda - Profile Page Entry Point
 *
 * Split into logical modules for maintainability:
 *   - profile/dashboard.js  — Init, stats, tabs, user display
 *   - profile/history.js    — Reading history, favorites, modal
 *   - profile/settings.js   — Settings form and password changes
 *   - profile/biorhythms.js — Biorhythm chart (Chart.js)
 *   - profile/journal.js    — Manifestation journal
 *
 * Each module exposes its functions to window.* for inline onclick compatibility.
 * This file is the entry point loaded by profil.html.
 */

// Load profile modules dynamically
(function loadProfileModules() {
    const modules = [
        'js/profile/dashboard.js',
        'js/profile/history.js',
        'js/profile/settings.js',
        'js/profile/biorhythms.js',
        'js/profile/journal.js'
    ];

    let loaded = 0;

    modules.forEach(src => {
        const script = document.createElement('script');
        script.src = src + '?v=8';
        script.onload = () => {
            loaded++;
            if (loaded === modules.length) {
                // All modules loaded — initialize profile
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        initProfile();
                        document.addEventListener('auth:changed', () => initProfile());
                    });
                } else {
                    initProfile();
                    document.addEventListener('auth:changed', () => initProfile());
                }
            }
        };
        script.onerror = () => {
            console.error(`Failed to load profile module: ${src}`);
        };
        document.head.appendChild(script);
    });
})();
