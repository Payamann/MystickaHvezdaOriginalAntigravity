(function () {
    const banner = document.getElementById('freemium-banner');

    function render() {
        if (!banner) return;

        if (window.Auth?.isPremium?.()) {
            banner.hidden = true;
            banner.classList.remove('mh-block-visible');
            return;
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