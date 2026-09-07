/**
 * Mystická Hvězda – Push Notifications Client
 * Permission is requested only from the subscription button.
 */
(function () {
    'use strict';

    const SUB_KEY = 'mh_push_subscribed';

    // Only proceed if Push API supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function getVapidPublicKey() {
        if (window.API_CONFIG?.VAPID_PUBLIC_KEY) return window.API_CONFIG.VAPID_PUBLIC_KEY;
        if (typeof window.initConfig === 'function') {
            await window.initConfig();
        }
        return window.API_CONFIG?.VAPID_PUBLIC_KEY || window.VAPID_PUBLIC_KEY || null;
    }

    async function subscribeToPush() {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                localStorage.setItem(SUB_KEY, 'denied');
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = await getVapidPublicKey();
            if (!vapidPublicKey) {
                return false;
            }

            let subscription;
            try {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });
            } catch {
                // VAPID not configured yet – just record intent
                return false;
            }

            // Send subscription to server
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

            if (!response.ok) return false;
            localStorage.setItem(SUB_KEY, 'active');
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
                await fetch(`${BASE}/push/unsubscribe`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                    },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
                await subscription.unsubscribe();
            }

            localStorage.removeItem(SUB_KEY);
            return true;
        } catch (error) {
            console.warn('[Push] Unsubscribe failed:', error);
            localStorage.removeItem(SUB_KEY);
            return false;
        }
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
    }

    function init() {

        
        // Handle manual button if exists
        const subBtn = document.getElementById('subscribe-push-btn');
        if (subBtn) {
            subBtn.hidden = false;
            // Check status for button text
            const status = localStorage.getItem(SUB_KEY);
            if (status === 'active') {
                subBtn.innerHTML = '🔕 Zrušit odběr horoskopu';
                subBtn.classList.add('btn--active');
            }
            
            subBtn.addEventListener('click', async () => {
                const currentStatus = localStorage.getItem(SUB_KEY);
                if (currentStatus === 'active') {
                    await unsubscribeFromPush();
                    subBtn.innerHTML = '🔔 Odebírat denní horoskop';
                    subBtn.classList.remove('btn--active');
                    if (window.Auth?.showToast) window.Auth.showToast('Info', 'Odběr horoskopu byl zrušen.', 'info');
                } else {
                    const ok = await subscribeToPush();
                    if (ok) {
                        subBtn.innerHTML = '🔕 Zrušit odběr horoskopu';
                        subBtn.classList.add('btn--active');
                        if (window.Auth?.showToast) window.Auth.showToast('Úspěch', 'Odběr horoskopu byl aktivován.', 'success');
                    } else {
                        subBtn.textContent = 'Nepodařilo se zapnout — zkusit znovu';
                    }
                }
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
