
(function() {

    const today = new Date().toISOString().split('T')[0];

    const DAILY_LIMIT = 1;

    function getUsedToday() {
        try {
            const saved = JSON.parse(localStorage.getItem('runeDaily') || 'null');
            return saved?.date === today && saved?.runeData ? 1 : 0;
        } catch {
            return 0;
        }
    }

    const remaining = Math.max(0, DAILY_LIMIT - getUsedToday());



    const banner = document.getElementById('freemium-banner');

    const countEl = document.getElementById('freemium-count');



    // Zobrazit jen nepřihlášeným nebo free uživatelům

    document.addEventListener('DOMContentLoaded', () => {

        const auth = window.Auth;

        if (!auth || !auth.isPremium?.()) {

            if (countEl) countEl.textContent = remaining + ' / ' + DAILY_LIMIT;

            if (banner) {
                banner.hidden = false;
                banner.classList.add('mh-block-visible');
            }

        }

    });

})();
