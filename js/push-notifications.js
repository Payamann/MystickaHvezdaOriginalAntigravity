/**
 * Mystická Hvězda – Push Notifications Client
 * Permission is requested only from the subscription button.
 */
(function () {
    'use strict';

    const SUB_KEY = 'mh_push_subscribed';
    const COPY = {
        cs: {
            subscribe: 'Odebírat denní horoskop',
            unsubscribe: 'Zrušit odběr horoskopu',
            subscribing: 'Zapínám odběr…',
            unsubscribing: 'Ruším odběr…',
            subscribeError: 'Nepodařilo se zapnout — zkusit znovu',
            unsubscribeError: 'Nepodařilo se zrušit — zkusit znovu',
            permissionDenied: 'Oznámení jsou v prohlížeči zakázaná. Povol je v nastavení webu.',
            permissionCta: 'Povolit oznámení v prohlížeči',
            subscribed: 'Odběr horoskopu byl aktivován.',
            unsubscribed: 'Odběr horoskopu byl zrušen.',
            success: 'Hotovo',
            info: 'Informace'
        },
        sk: {
            subscribe: 'Odberať denný horoskop',
            unsubscribe: 'Zrušiť odber horoskopu',
            subscribing: 'Zapínam odber…',
            unsubscribing: 'Ruším odber…',
            subscribeError: 'Odber sa nepodarilo zapnúť — skús to znova',
            unsubscribeError: 'Odber sa nepodarilo zrušiť — skús to znova',
            permissionDenied: 'Upozornenia sú v prehliadači zakázané. Povoľ ich v nastaveniach stránky.',
            permissionCta: 'Povoliť upozornenia v prehliadači',
            subscribed: 'Odber horoskopu bol aktivovaný.',
            unsubscribed: 'Odber horoskopu bol zrušený.',
            success: 'Hotovo',
            info: 'Informácia'
        },
        pl: {
            subscribe: 'Subskrybuj horoskop dzienny',
            unsubscribe: 'Anuluj subskrypcję horoskopu',
            subscribing: 'Włączam subskrypcję…',
            unsubscribing: 'Anuluję subskrypcję…',
            subscribeError: 'Nie udało się włączyć — spróbuj ponownie',
            unsubscribeError: 'Nie udało się anulować — spróbuj ponownie',
            permissionDenied: 'Powiadomienia są zablokowane w przeglądarce. Włącz je w ustawieniach strony.',
            permissionCta: 'Włącz powiadomienia w przeglądarce',
            subscribed: 'Subskrypcja horoskopu została włączona.',
            unsubscribed: 'Subskrypcja horoskopu została anulowana.',
            success: 'Gotowe',
            info: 'Informacja'
        }
    };
    let isPushSubscribed = false;

    // Only proceed if Push API supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
        const hideSubscribeButton = () => {
            document.querySelectorAll('#subscribe-push-btn').forEach((button) => {
                button.hidden = true;
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideSubscribeButton, { once: true });
        } else {
            hideSubscribeButton();
        }
        return;
    }

    function getCopy() {
        const language = document.documentElement.lang?.slice(0, 2).toLowerCase();
        return COPY[language] || COPY.cs;
    }

    function setButtonState(button, state) {
        const copy = getCopy();
        const states = {
            subscribe: { icon: 'bell', label: copy.subscribe },
            unsubscribe: { icon: 'bell-off', label: copy.unsubscribe },
            subscribing: { icon: 'hourglass', label: copy.subscribing },
            unsubscribing: { icon: 'hourglass', label: copy.unsubscribing },
            subscribeError: { icon: 'error', label: copy.subscribeError },
            unsubscribeError: { icon: 'error', label: copy.unsubscribeError },
            permissionDenied: { icon: 'error', label: copy.permissionCta }
        };
        const selected = states[state];
        if (!selected) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'mh-symbol mh-symbol--inline');
        svg.setAttribute('viewBox', '0 0 48 48');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', `/img/icons/mh-symbols.svg#${selected.icon}`);
        svg.appendChild(use);

        const label = document.createElement('span');
        label.textContent = selected.label;
        button.replaceChildren(svg, label);
    }

    function setStoredSubscriptionStatus(active) {
        try {
            if (active) localStorage.setItem(SUB_KEY, 'active');
            else localStorage.removeItem(SUB_KEY);
        } catch (error) {
            console.warn('[Push] Subscription status could not be stored:', error);
        }
    }

    async function getVapidPublicKey() {
        if (window.API_CONFIG?.VAPID_PUBLIC_KEY) return window.API_CONFIG.VAPID_PUBLIC_KEY;
        if (typeof window.initConfig === 'function') {
            await window.initConfig();
        }
        return window.API_CONFIG?.VAPID_PUBLIC_KEY || window.VAPID_PUBLIC_KEY || null;
    }

    async function subscribeToPush() {
        try {
            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    try { localStorage.setItem(SUB_KEY, 'denied'); } catch { /* Storage is optional. */ }
                    return false;
                }
            }

            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                const vapidPublicKey = await getVapidPublicKey();
                if (!vapidPublicKey) return false;

                try {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                    });
                } catch (error) {
                    console.warn('[Push] Browser subscription failed:', error);
                    return false;
                }
            }

            const BASE = window.API_CONFIG?.BASE_URL || '/api';
            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            const response = await fetch(`${BASE}/push/subscribe`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                },
                body: JSON.stringify({ subscription })
            });
            const data = await response.json().catch(() => null);

            if (!response.ok || data?.success !== true) {
                return false;
            }

            setStoredSubscriptionStatus(true);
            return true;
        } catch (error) {
            console.warn('[Push] Subscription failed:', error);
            return false;
        }
    }

    async function unsubscribeFromPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                const BASE = window.API_CONFIG?.BASE_URL || '/api';
                const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
                const response = await fetch(`${BASE}/push/unsubscribe`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                    },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
                const data = await response.json().catch(() => null);
                if (!response.ok || data?.success !== true) return false;

                const unsubscribed = await subscription.unsubscribe();
                if (!unsubscribed) return false;
            }

            setStoredSubscriptionStatus(false);
            return true;
        } catch (error) {
            console.warn('[Push] Unsubscribe failed:', error);
            return false;
        }
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
    }

    async function syncPushSubscriptionStatus() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            isPushSubscribed = Boolean(subscription);
            setStoredSubscriptionStatus(isPushSubscribed);
        } catch (error) {
            console.warn('[Push] Browser subscription status could not be read:', error);
            try {
                isPushSubscribed = localStorage.getItem(SUB_KEY) === 'active';
            } catch {
                isPushSubscribed = false;
            }
        }
    }

    async function init() {
        // Handle manual button if exists
        const subBtn = document.getElementById('subscribe-push-btn');
        if (subBtn) {
            // Keep the control hidden until the browser's actual subscription
            // is known, so a stale localStorage value cannot offer the wrong action.
            subBtn.disabled = true;
            subBtn.setAttribute('aria-busy', 'true');

            const statusRegion = document.createElement('span');
            statusRegion.className = 'sr-only';
            statusRegion.setAttribute('role', 'status');
            statusRegion.setAttribute('aria-live', 'polite');
            statusRegion.setAttribute('aria-atomic', 'true');
            subBtn.insertAdjacentElement('afterend', statusRegion);

            await syncPushSubscriptionStatus();
            setButtonState(subBtn, isPushSubscribed ? 'unsubscribe' : 'subscribe');
            subBtn.classList.toggle('btn--active', isPushSubscribed);
            subBtn.hidden = false;
            subBtn.disabled = false;
            subBtn.removeAttribute('aria-busy');

            subBtn.addEventListener('click', async () => {
                if (subBtn.disabled) return;

                const action = isPushSubscribed ? 'unsubscribe' : 'subscribe';
                const copy = getCopy();
                subBtn.disabled = true;
                subBtn.setAttribute('aria-busy', 'true');
                statusRegion.textContent = action === 'subscribe' ? copy.subscribing : copy.unsubscribing;
                setButtonState(subBtn, action === 'subscribe' ? 'subscribing' : 'unsubscribing');

                let ok = false;
                try {
                    ok = action === 'subscribe' ? await subscribeToPush() : await unsubscribeFromPush();
                } finally {
                    subBtn.disabled = false;
                    subBtn.removeAttribute('aria-busy');
                }

                if (ok) {
                    isPushSubscribed = action === 'subscribe';
                    subBtn.classList.toggle('btn--active', isPushSubscribed);
                    setButtonState(subBtn, isPushSubscribed ? 'unsubscribe' : 'subscribe');
                    statusRegion.textContent = isPushSubscribed ? copy.subscribed : copy.unsubscribed;
                    if (window.Auth?.showToast) {
                        const title = isPushSubscribed ? copy.success : copy.info;
                        const message = isPushSubscribed ? copy.subscribed : copy.unsubscribed;
                        window.Auth.showToast(title, message, isPushSubscribed ? 'success' : 'info');
                    }
                    return;
                }

                const errorMessage = action === 'subscribe' && Notification.permission === 'denied'
                    ? copy.permissionDenied
                    : action === 'subscribe' ? copy.subscribeError : copy.unsubscribeError;
                const errorState = errorMessage === copy.permissionDenied
                    ? 'permissionDenied'
                    : action === 'subscribe' ? 'subscribeError' : 'unsubscribeError';
                setButtonState(subBtn, errorState);
                statusRegion.textContent = errorMessage;
            });
        }

    }

    // Bind the user-initiated subscription control.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
