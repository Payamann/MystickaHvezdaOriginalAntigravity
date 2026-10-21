(function () {
    const banner = document.getElementById('freemium-banner');
    const bannerText = document.getElementById('freemium-banner-text');

    function render() {
        if (!banner) return;

        const auth = window.Auth;
        if (auth?.isPremium?.()) {
            banner.hidden = true;
            banner.classList.remove('mh-block-visible');
            return;
        }

        if (bannerText) {
            bannerText.textContent = auth?.isLoggedIn?.()
                ? 'Bezplatný účet nabízí až 3 otázky denně.'
                : 'První otázka je zdarma bez registrace; bezplatný účet nabízí až 3 otázky denně.';
        }

        banner.hidden = false;
        banner.classList.add('mh-block-visible');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render, { once: true });
    } else {
        render();
    }
    window.addEventListener('auth:changed', render);
})();