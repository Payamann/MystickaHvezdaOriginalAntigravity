(function () {
    'use strict';

    var SUB_KEY = 'mh_horoscope_subscribed';

    /**
     * Pošle `horoscope_bridge_viewed` jednou, až je most opravdu vidět.
     * Sdílené pro všechny plochy, takže jejich konverze jdou porovnat mezi sebou
     * (dřív mělo vlastní měření zobrazení jen tarot ano/ne).
     */
    function trackBridgeView(element, track) {
        if (!element) return;

        var fired = false;
        function fire() {
            if (fired) return;
            fired = true;
            track('horoscope_bridge_viewed');
        }

        if (typeof IntersectionObserver !== 'function') {
            fire(); // starší prohlížeč — radši nadhodnotit než neměřit vůbec
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i += 1) {
                if (entries[i].isIntersecting) {
                    fire();
                    observer.disconnect();
                    return;
                }
            }
        }, { threshold: 0.5 });

        observer.observe(element);
    }

    function init() {
        var btn = document.getElementById('horoscope-subscribe-btn');
        var subscribedMsg = document.getElementById('horoscope-subscribed-msg');

        if (!btn) return;

        // Původní popisek tlačítka — jednotlivé stránky mají vlastní znění
        // (např. most na tarot ano/ne), takže se nesmí resetovat natvrdo.
        var originalLabel = btn.textContent.trim();

        // Zdroj pro měření: která plocha odběr přinesla
        var host = btn.closest('[data-analytics-source]');
        var source = (host && host.getAttribute('data-analytics-source')) || 'horoscope_hub';

        function track(event, extra) {
            var payload = { source: source, page_path: window.location.pathname };
            if (extra) {
                for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) payload[k] = extra[k]; }
            }
            if (window.MH_ANALYTICS && window.MH_ANALYTICS.trackAction) {
                window.MH_ANALYTICS.trackAction(event, payload);
            }
        }

        // If already subscribed, show success state
        if (localStorage.getItem(SUB_KEY)) {
            showSubscribed();
        }

        // Bez tohohle nejde spočítat konverze plochy — `submitted` sám o sobě
        // neřekne, z kolika zobrazení vzešel. Měří se skutečné spatření
        // (IntersectionObserver), ne pouhá přítomnost v DOM: na tarot ano/ne je
        // most schovaný ve výsledku, takže by jinak počítal i lidi, co ho nikdy neviděli.
        trackBridgeView(host || btn, track);

        btn.addEventListener('click', async function () {
            var email = document.getElementById('horoscope-email-input').value.trim();
            var sign = document.getElementById('horoscope-sign-select').value;

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('Zadejte platnou emailovou adresu.');
                track('horoscope_subscribe_invalid', { reason: 'email' });
                return;
            }
            if (!sign) {
                alert('Vyberte své znamení zvěrokruhu.');
                track('horoscope_subscribe_invalid', { reason: 'sign' });
                return;
            }

            track('horoscope_subscribe_submitted', { zodiac_sign: sign });

            btn.disabled = true;
            btn.textContent = 'Přihlašuji...';

            try {
                var base = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || '/api';

                var csrfRes = await fetch(base + '/csrf-token', { credentials: 'include' });
                var csrfData = await csrfRes.json();
                var csrfToken = csrfData.csrfToken || csrfData.token || '';

                var res = await fetch(base + '/subscribe/horoscope', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                    body: JSON.stringify({ email: email, zodiac_sign: sign })
                });
                var data = await res.json();

                if (res.ok && data.success) {
                    localStorage.setItem(SUB_KEY, sign);
                    showSubscribed();
                    track('horoscope_subscribe_completed', { zodiac_sign: sign });
                    if (window.Auth && window.Auth.showToast) {
                        window.Auth.showToast('Hotovo!', 'Potvrzení přijde na tvůj email.', 'success');
                    }
                } else {
                    alert(data.error || 'Chyba při přihlašování. Zkuste to znovu.');
                    track('horoscope_subscribe_failed', { reason: 'api' });
                    btn.disabled = false;
                    btn.textContent = originalLabel;
                }
            } catch (e) {
                alert('Chyba připojení. Zkuste to prosím znovu.');
                track('horoscope_subscribe_failed', { reason: 'network' });
                btn.disabled = false;
                btn.textContent = originalLabel;
            }
        });

        function showSubscribed() {
            if (btn) { btn.hidden = true; }
            if (subscribedMsg) {
                subscribedMsg.hidden = false;
                subscribedMsg.classList.add('mh-block-visible');
            }
            var emailInput = document.getElementById('horoscope-email-input');
            var signSelect = document.getElementById('horoscope-sign-select');
            if (emailInput) emailInput.hidden = true;
            if (signSelect) signSelect.hidden = true;
        }

        // Pre-fill sign from personalization
        window.addEventListener('personalization:ready', function () {
            if (localStorage.getItem(SUB_KEY)) return;
            var sign = window.MH_PERSONALIZATION && window.MH_PERSONALIZATION.getSign && window.MH_PERSONALIZATION.getSign();
            var signMap = { beran: 'Beran', byk: 'Býk', blizenci: 'Blíženci', rak: 'Rak', lev: 'Lev', panna: 'Panna', vahy: 'Váhy', stir: 'Štír', strelec: 'Střelec', kozoroh: 'Kozoroh', vodnar: 'Vodnář', ryby: 'Ryby' };
            var sel = document.getElementById('horoscope-sign-select');
            if (sign && signMap[sign] && sel) sel.value = signMap[sign];
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
