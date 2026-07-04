/**
 * Mystická Hvězda – PWA install prompt
 * Captures beforeinstallprompt and offers installation on a repeat visit.
 * Reuses the push-banner styling so no interruptive UI is shown on the
 * first visit, while the cookie banner is open, or alongside the push banner.
 */
(function () {
    'use strict';

    const VISIT_KEY = 'mh_pwa_visits';
    const STATE_KEY = 'mh_pwa_install';
    const DISMISS_COOLDOWN_DAYS = 30;

    let deferredPrompt = null;

    function isStandalone() {
        return window.matchMedia?.('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    }

    function track(eventName, extra = {}) {
        window.MH_ANALYTICS?.trackAction?.(eventName, {
            source: 'pwa_install_banner',
            page: window.location.pathname,
            ...extra
        });
    }

    function readState() {
        try {
            return JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
        } catch {
            return null;
        }
    }

    function writeState(state) {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    }

    function isSnoozed() {
        const state = readState();
        if (!state) return false;
        if (state.status === 'installed' || state.status === 'accepted') return true;
        if (state.status === 'dismissed' && state.at) {
            const ageDays = (Date.now() - state.at) / (1000 * 60 * 60 * 24);
            return ageDays < DISMISS_COOLDOWN_DAYS;
        }
        return false;
    }

    function incrementVisit() {
        const count = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) + 1;
        localStorage.setItem(VISIT_KEY, count);
        return count;
    }

    async function promptInstall(banner) {
        banner.remove();
        if (!deferredPrompt) return;

        const promptEvent = deferredPrompt;
        deferredPrompt = null;

        try {
            promptEvent.prompt();
            const choice = await promptEvent.userChoice;
            if (choice?.outcome === 'accepted') {
                writeState({ status: 'accepted', at: Date.now() });
                track('pwa_install_accepted');
            } else {
                writeState({ status: 'dismissed', at: Date.now() });
                track('pwa_install_declined');
            }
        } catch (error) {
            console.warn('[PWA] Install prompt failed:', error.message);
        }
    }

    function showInstallBanner() {
        // Never stack on top of the push banner.
        if (document.getElementById('mh-push-banner') || document.getElementById('mh-pwa-banner')) return;
        if (!deferredPrompt || isSnoozed() || isStandalone()) return;

        const banner = document.createElement('div');
        banner.id = 'mh-pwa-banner';
        banner.className = 'mh-push-banner';
        banner.innerHTML = `
            <div class="mh-push-banner__icon">🌙</div>
            <div class="mh-push-banner__body">
                <div class="mh-push-banner__title">Mystická Hvězda jako aplikace?</div>
                <div class="mh-push-banner__copy">Rychlý přístup z plochy – bez stahování</div>
            </div>
            <div class="mh-push-banner__actions">
                <button id="mh-pwa-yes" class="mh-push-banner__primary">Přidat</button>
                <button id="mh-pwa-no" class="mh-push-banner__secondary">Ne</button>
            </div>
        `;

        document.body.appendChild(banner);
        track('pwa_install_prompt_shown');

        document.getElementById('mh-pwa-yes').addEventListener('click', () => promptInstall(banner));
        document.getElementById('mh-pwa-no').addEventListener('click', () => {
            writeState({ status: 'dismissed', at: Date.now() });
            track('pwa_install_prompt_dismissed');
            banner.remove();
        });

        setTimeout(() => banner.remove(), 12000);
    }

    function scheduleBanner() {
        // Wait for cookie consent so two interruptive banners never overlap,
        // then give the push banner (5s after consent) room before ours.
        const consent = localStorage.getItem('cookieConsent');
        if (consent) {
            setTimeout(showInstallBanner, 9000);
        } else {
            const waitForConsent = setInterval(() => {
                if (localStorage.getItem('cookieConsent')) {
                    clearInterval(waitForConsent);
                    setTimeout(showInstallBanner, 9000);
                }
            }, 500);
        }
    }

    function init() {
        if (isStandalone() || isSnoozed()) return;

        const visits = incrementVisit();

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            deferredPrompt = event;
            if (visits >= 2) scheduleBanner();
        });

        window.addEventListener('appinstalled', () => {
            writeState({ status: 'installed', at: Date.now() });
            deferredPrompt = null;
            track('pwa_installed');
            document.getElementById('mh-pwa-banner')?.remove();
        });
    }

    init();
})();
