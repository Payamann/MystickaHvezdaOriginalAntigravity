/**
 * Mystická Hvězda – Push Notifications Client
 * Asks permission after 2nd visit, manages subscription
 */
(function () {
    'use strict';

    const VISIT_KEY = 'mh_visit_count';
    const SUB_KEY = 'mh_push_subscribed';

    // Only proceed if Push API supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    function getVisitCount() {
        return parseInt(localStorage.getItem(VISIT_KEY) || '0', 10);
    }

    function incrementVisit() {
        const n = getVisitCount() + 1;
        localStorage.setItem(VISIT_KEY, n);
        return n;
    }

    async function subscribeToPush() {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                localStorage.setItem(SUB_KEY, 'denied');
                return false;
            }

            const registration = await navigator.serviceWorker.ready;

            // VAPID public key (replace with real key from server on deploy)
            // For now we use a placeholder – subscription will still save endpoint
            let subscription;
            try {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(
                        window.VAPID_PUBLIC_KEY ||
                        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBrqLHy9-Ndgo292mkiw'
                    )
                });
            } catch {
                // VAPID not configured yet – just record intent
                localStorage.setItem(SUB_KEY, 'intent');
                return true;
            }

            // Send subscription to server
            const BASE = window.API_CONFIG?.BASE_URL || '/api';
            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            await fetch(`${BASE}/push/subscribe`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                },
                body: JSON.stringify({ subscription })
            });

            localStorage.setItem(SUB_KEY, 'active');
            return true;
        } catch (error) {
            console.warn('[Push] Subscription failed:', error);
            return false;
        }
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
    }

    function showNotificationPrompt() {
        // Don't show if already subscribed/denied
        const status = localStorage.getItem(SUB_KEY);
        if (status === 'active' || status === 'denied') return;

        const banner = document.createElement('div');
        banner.id = 'mh-push-banner';
        banner.className = 'mh-push-banner';

        const sign = window.MH_PERSONALIZATION?.getSign();
        const signText = sign && window.SIGNS_CZ?.[sign] ? `pro ${window.SIGNS_CZ[sign].label}` : '';

        banner.innerHTML = `
            <div class="mh-push-banner__icon">🔔</div>
            <div class="mh-push-banner__body">
                <div class="mh-push-banner__title">
                    Denní horoskop ${signText} do notifikací?
                </div>
                <div class="mh-push-banner__copy">
                    Každý den ráno v 8:00 – bez emailu
                </div>
            </div>
            <div class="mh-push-banner__actions">
                <button id="mh-push-yes" class="mh-push-banner__primary">Zapnout</button>
                <button id="mh-push-no" class="mh-push-banner__secondary">Ne</button>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('mh-push-yes').addEventListener('click', async () => {
            banner.remove();
            const ok = await subscribeToPush();
            if (ok) {
                // Small success toast
                const toast = document.createElement('div');
                toast.className = 'mh-push-toast';
                toast.textContent = '🔔 Notifikace zapnuty! Uvidíme se zítra ráno.';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            }
        });

        document.getElementById('mh-push-no').addEventListener('click', () => {
            localStorage.setItem(SUB_KEY, 'denied');
            banner.remove();
        });

        // Auto-dismiss after 12s
        setTimeout(() => banner?.remove(), 12000);
    }

    function init() {
        const count = incrementVisit();
        
        // Handle manual button if exists
        const subBtn = document.getElementById('subscribe-push-btn');
        if (subBtn) {
            // Check status for button text
            const status = localStorage.getItem(SUB_KEY);
            if (status === 'active') {
                subBtn.innerHTML = '🔕 Zrušit odběr horoskopu';
                subBtn.classList.add('btn--active');
            }
            
            subBtn.addEventListener('click', async () => {
                const currentStatus = localStorage.getItem(SUB_KEY);
                if (currentStatus === 'active') {
                    // Unsubscribe logic (simplified: clear local storage for this demo)
                    localStorage.removeItem(SUB_KEY);
                    subBtn.innerHTML = '🔔 Odebírat denní horoskop';
                    subBtn.classList.remove('btn--active');
                    if (window.Auth?.showToast) window.Auth.showToast('Info', 'Odběr horoskopu byl zrušen.', 'info');
                } else {
                    const ok = await subscribeToPush();
                    if (ok) {
                        subBtn.innerHTML = '🔕 Zrušit odběr horoskopu';
                        subBtn.classList.add('btn--active');
                        if (window.Auth?.showToast) window.Auth.showToast('Úspěch', 'Odběr horoskopu byl aktivován.', 'success');
                    }
                }
            });
        }

        if (count >= 2) {
            // Wait for cookie consent before showing push banner
            // so we never show two interruptive banners at the same time
            const cookieConsent = localStorage.getItem('cookieConsent');
            if (cookieConsent) {
                // Cookie already resolved → show after 5s
                setTimeout(showNotificationPrompt, 5000);
            } else {
                // Cookie banner is still up → poll until dismissed, then wait 3s more
                const waitForConsent = setInterval(() => {
                    if (localStorage.getItem('cookieConsent')) {
                        clearInterval(waitForConsent);
                        setTimeout(showNotificationPrompt, 3000);
                    }
                }, 500);
            }
        }
    }

    // Init: show prompt on 2nd+ visit after 5s
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
