/**
 * Mystická Hvězda – Newsletter Exit-Intent Popup
 * Triggers: cursor exit OR 45 seconds on page
 * Respects: localStorage dismissal for 7 days
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'mh_newsletter_dismissed';
    const SESSION_KEY = 'mh_newsletter_popup_shown';
    const EXIT_INTENT_STORAGE_KEY = 'mh_exit_shown';
    const DISMISS_DAYS = 7;
    const SKIP_PATHS = ['/prihlaseni', '/onboarding', '/profil'];
    let triggered = false;

    function shouldShow() {
        if (SKIP_PATHS.some((path) => window.location.pathname.includes(path))) return false;
        if (sessionStorage.getItem(EXIT_INTENT_STORAGE_KEY)) return false;
        if (sessionStorage.getItem(SESSION_KEY)) return false;
        if (document.getElementById('exit-intent-modal')) return false;
        if (document.querySelector('.paywall-overlay')) return false;
        if (document.getElementById('mh-newsletter-popup') || document.getElementById('mh-popup-overlay')) return false;

        const val = localStorage.getItem(STORAGE_KEY);
        if (!val) return true;
        const dismissedAt = parseInt(val, 10);
        const daysPassed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
        return daysPassed >= DISMISS_DAYS;
    }

    function dismiss() {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        const popup = document.getElementById('mh-newsletter-popup');
        if (popup) {
            popup.classList.add('is-closing');
            setTimeout(() => popup.remove(), 400);
        }
        const overlay = document.getElementById('mh-popup-overlay');
        if (overlay) {
            overlay.classList.add('is-closing');
            setTimeout(() => overlay.remove(), 400);
        }
    }

    function buildRegisterUrl(email) {
        const authUrl = new URL('/prihlaseni.html', window.location.origin);
        authUrl.searchParams.set('mode', 'register');
        authUrl.searchParams.set('redirect', '/horoskopy.html');
        authUrl.searchParams.set('source', 'newsletter_popup');
        authUrl.searchParams.set('feature', 'daily_guidance');
        authUrl.searchParams.set('email', email);
        return `${authUrl.pathname}${authUrl.search}`;
    }

    function showRegisterCta(messageElement, email) {
        const link = document.createElement('a');
        link.className = 'mh-popup-register-link';
        link.href = buildRegisterUrl(email);
        link.textContent = 'Vytvořit účet zdarma';
        link.addEventListener('click', () => {
            window.MH_ANALYTICS?.trackCTA?.('newsletter_popup_register_cta', {
                destination: link.getAttribute('href') || '/prihlaseni.html',
                source: 'newsletter_popup',
                feature: 'daily_guidance'
            });
        });

        messageElement.append(document.createElement('br'), link);
    }

    async function subscribe(email) {
        const btn = document.getElementById('mh-popup-submit');
        const msg = document.getElementById('mh-popup-msg');
        btn.disabled = true;
        btn.textContent = 'Přihlašuji...';

        try {
            const BASE = window.API_CONFIG?.BASE_URL || '/api';

            // Fetch CSRF token first (required for all POST requests)
            const csrfRes = await fetch(`${BASE}/csrf-token`, { credentials: 'include' });
            const csrfData = await csrfRes.json();
            const csrfToken = csrfData.csrfToken || csrfData.token || '';

            const res = await fetch(`${BASE}/newsletter/subscribe`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                body: JSON.stringify({ email, source: 'web_popup' })
            });
            const data = await res.json();
            if (data.success) {
                msg.textContent = '🌟 Skvělé! Brzy vám přijde první hvězdná zpráva.';
                msg.className = 'mh-popup-msg mh-popup-msg--success';
                showRegisterCta(msg, email);
                btn.textContent = 'Odběr aktivní';
                window.MH_ANALYTICS?.trackEvent?.('newsletter_popup_subscribed', {
                    source: 'web_popup'
                });
                setTimeout(dismiss, 10000);
            } else {
                msg.textContent = data.error || 'Chyba. Zkuste to znovu.';
                msg.className = 'mh-popup-msg mh-popup-msg--error';
                btn.disabled = false;
                btn.textContent = 'Odebírat zdarma';
            }
        } catch {
            msg.textContent = 'Chyba připojení. Zkuste to znovu.';
            msg.className = 'mh-popup-msg mh-popup-msg--error';
            btn.disabled = false;
            btn.textContent = 'Odebírat zdarma';
        }
    }

    function createPopup() {
        if (triggered || !shouldShow()) return;
        triggered = true;
        sessionStorage.setItem(SESSION_KEY, '1');

        // Overlay
        const overlay = document.createElement('div');
        overlay.id = 'mh-popup-overlay';
        overlay.className = 'mh-popup-overlay';
        overlay.addEventListener('click', dismiss);

        // Popup
        const popup = document.createElement('div');
        popup.id = 'mh-newsletter-popup';
        popup.className = 'mh-newsletter-popup';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-label', 'Přihlásit se k odběru');

        const signEmoji = (() => {
            const emojis = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
            const m = new Date().getMonth();
            return emojis[m] || '⭐';
        })();

        popup.innerHTML = `
            <button id="mh-popup-close" class="mh-popup-close" aria-label="Zavřít">×</button>

            <div class="mh-popup-icon">${signEmoji} 🌙</div>
            <h2 class="mh-popup-title">
                Hvězdy vám píší každý den
            </h2>
            <p class="mh-popup-text">
                Dostávejte denní horoskop, výklad Měsíce a esoterické tipy přímo do vašeho emailu. Zcela zdarma.
            </p>

            <div class="mh-popup-form">
                <input id="mh-popup-email" type="email" placeholder="váš@email.cz"
                    class="mh-popup-email"
                />
                <button id="mh-popup-submit" class="mh-popup-submit">
                    Odebírat zdarma ✨
                </button>
            </div>
            <div id="mh-popup-msg" class="mh-popup-msg"></div>
            <p class="mh-popup-fineprint">
                Žádný spam. Odhlásit se můžete kdykoli jedním kliknutím.
            </p>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('is-visible');
                popup.classList.add('is-visible');
            });
        });

        // Events
        document.getElementById('mh-popup-close').addEventListener('click', dismiss);
        document.getElementById('mh-popup-submit').addEventListener('click', () => {
            const email = document.getElementById('mh-popup-email').value.trim();
            if (!email || !email.includes('@')) {
                document.getElementById('mh-popup-msg').textContent = 'Zadejte prosím platný e-mail.';
                document.getElementById('mh-popup-msg').className = 'mh-popup-msg mh-popup-msg--error';
                return;
            }
            subscribe(email);
        });
        document.getElementById('mh-popup-email').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('mh-popup-submit').click();
        });

        // Avoid viewport jumps when the popup appears during browsing.
        if (!window.matchMedia('(pointer: coarse)').matches) {
            popup.querySelector('#mh-popup-email').focus({ preventScroll: true });
        }
    }

    function init() {
        if (!shouldShow()) return;

        // Exit intent – mouse leaves top of viewport
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0) createPopup();
        }, { passive: true });

        // Timed trigger – 45 seconds
        setTimeout(createPopup, 45000);

        // Do not interrupt reading with a scroll-triggered popup.
    }

    // Init after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
