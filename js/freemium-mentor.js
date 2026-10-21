(function () {
    const banner = document.getElementById('freemium-banner');
    const copy = document.getElementById('freemium-copy');

    function render() {
        if (!banner) return;

        const auth = window.Auth;
        if (auth?.isPremium?.()) {
            banner.hidden = true;
            banner.classList.remove('mh-block-visible');
            return;
        }

        if (copy) {
            copy.textContent = auth?.isLoggedIn?.()
                ? 'Bezplatný účet má limit 3 zprávy denně.'
                : 'Po registraci můžeš poslat až 3 zprávy denně zdarma.';
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