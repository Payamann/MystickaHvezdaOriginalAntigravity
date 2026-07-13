(function () {
    // Freemium banner na křišťálové kouli. Zobrazuje zbývající free otázky.
    // Anonymní: 1 otázka zdarma, pak registrace. Přihlášený free: 3 / den.
    // (Skutečné vynucení limitu je server-side v server/routes/oracle.js.)
    const banner = document.getElementById('freemium-banner');
    const countEl = document.getElementById('freemium-count');
    const bannerText = document.getElementById('freemium-banner-text');

    function render() {
        const auth = window.Auth;

        // Premium users: no freemium banner.
        if (auth && auth.isPremium && auth.isPremium()) {
            if (banner) banner.hidden = true;
            return;
        }

        const loggedIn = Boolean(auth && auth.isLoggedIn && auth.isLoggedIn());
        const dailyLimit = loggedIn ? 3 : 1;
        const storageKey = 'mh_daily_crystal_' + new Date().toDateString();
        const used = parseInt(localStorage.getItem(storageKey) || '0', 10) || 0;
        const remaining = Math.max(0, dailyLimit - used);

        if (loggedIn) {
            if (countEl) countEl.textContent = remaining + ' / ' + dailyLimit;
        } else if (bannerText) {
            bannerText.textContent = remaining > 0
                ? 'První otázka je zdarma — pak stačí registrace zdarma'
                : 'Zaregistruj se zdarma a ptej se dál';
        }

        if (banner) {
            banner.hidden = false;
            banner.classList.add('mh-block-visible');
        }
    }

    document.addEventListener('DOMContentLoaded', render);
    // Auth se může doinicializovat až po DOMContentLoaded — přerenderovat.
    window.addEventListener('auth:changed', render);
})();
