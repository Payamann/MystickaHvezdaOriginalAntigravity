/** Installation is offered only through the profile settings button. */
(function () {
    'use strict';
    let deferredPrompt = null;
    const getButton = () => document.getElementById('install-app-btn');
    const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
    function refresh() {
        const button = getButton();
        if (button) button.hidden = !deferredPrompt || standalone();
    }
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredPrompt = event;
        refresh();
    });
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        refresh();
    });
    function init() {
        refresh();
        getButton()?.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            const prompt = deferredPrompt;
            deferredPrompt = null;
            refresh();
            try {
                await prompt.prompt();
                await prompt.userChoice;
            } catch (error) {
                console.warn('[PWA] Installation unavailable:', error.message);
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
