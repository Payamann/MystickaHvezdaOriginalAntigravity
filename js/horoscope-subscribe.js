(function () {
    'use strict';

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
        var emailInput = document.getElementById('horoscope-email-input');
        var signSelect = document.getElementById('horoscope-sign-select');
        var errorMessage = null;

        if (!btn) return;

        // Původní popisek tlačítka — jednotlivé stránky mají vlastní znění
        // (např. most na tarot ano/ne), takže se nesmí resetovat natvrdo.
        var originalLabel = btn.textContent.trim();
        var currentLabel = originalLabel;

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

        function ensureErrorMessage() {
            if (errorMessage) return errorMessage;
            errorMessage = document.createElement('p');
            errorMessage.id = 'horoscope-subscribe-error';
            errorMessage.className = 'form-error-summary';
            errorMessage.setAttribute('role', 'alert');
            errorMessage.setAttribute('aria-live', 'assertive');
            errorMessage.hidden = true;
            if (subscribedMsg && subscribedMsg.parentNode) {
                subscribedMsg.parentNode.insertBefore(errorMessage, subscribedMsg);
            } else {
                btn.insertAdjacentElement('afterend', errorMessage);
            }
            return errorMessage;
        }

        function clearFieldError(field) {
            if (!field) return;
            field.removeAttribute('aria-invalid');
            var describedBy = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (id) {
                return id && id !== 'horoscope-subscribe-error';
            });
            if (describedBy.length) field.setAttribute('aria-describedby', describedBy.join(' '));
            else field.removeAttribute('aria-describedby');
        }

        function clearError() {
            if (errorMessage) {
                errorMessage.hidden = true;
                errorMessage.textContent = '';
            }
            clearFieldError(emailInput);
            clearFieldError(signSelect);
        }

        function showError(message, field) {
            var node = ensureErrorMessage();
            node.textContent = message;
            node.hidden = false;
            clearFieldError(emailInput);
            clearFieldError(signSelect);
            if (field) {
                field.setAttribute('aria-invalid', 'true');
                var describedBy = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
                if (describedBy.indexOf(node.id) === -1) describedBy.push(node.id);
                field.setAttribute('aria-describedby', describedBy.join(' '));
                field.focus();
            }
        }

        if (emailInput) {
            emailInput.addEventListener('input', clearError);
            // Form is shared inside several legacy div-based bridges. Preserve
            // Enter-to-submit behavior without restructuring every page.
            emailInput.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter' || event.isComposing) return;
                event.preventDefault();
                btn.click();
            });
        }
        if (signSelect) signSelect.addEventListener('change', clearError);

        // Bez tohohle nejde spočítat konverze plochy — `submitted` sám o sobě
        // neřekne, z kolika zobrazení vzešel. Měří se skutečné spatření
        // (IntersectionObserver), ne pouhá přítomnost v DOM: na tarot ano/ne je
        // most schovaný ve výsledku, takže by jinak počítal i lidi, co ho nikdy neviděli.
        trackBridgeView(host || btn, track);

        btn.addEventListener('click', async function () {
            clearError();
            var email = emailInput.value.trim();
            var sign = signSelect.value;

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showError('Zadej platnou e-mailovou adresu.', emailInput);
                track('horoscope_subscribe_invalid', { reason: 'email' });
                return;
            }
            if (!sign) {
                showError('Vyber své znamení zvěrokruhu.', signSelect);
                track('horoscope_subscribe_invalid', { reason: 'sign' });
                return;
            }

            track('horoscope_subscribe_submitted', { zodiac_sign: sign, updating: isEditingSign });

            btn.disabled = true;
            btn.setAttribute('aria-busy', 'true');
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
                    showSubscribed();
                    track('horoscope_subscribe_completed', { zodiac_sign: sign, updating: isEditingSign });
                    isEditingSign = false;
                    currentLabel = originalLabel;
                    if (window.Auth && window.Auth.showToast) {
                        window.Auth.showToast('Hotovo!', 'Odběr jsme přijali.', 'success');
                    }
                } else {
                    showError(data.error || 'Odběr se nepodařilo uložit. Zkus to prosím znovu.');
                    track('horoscope_subscribe_failed', { reason: 'api' });
                    btn.disabled = false;
                    btn.removeAttribute('aria-busy');
                    btn.textContent = currentLabel;
                }
            } catch (e) {
                showError('Připojení se nezdařilo. Zkus to znovu; zadané údaje zůstaly zachované.');
                track('horoscope_subscribe_failed', { reason: 'network' });
                btn.disabled = false;
                btn.removeAttribute('aria-busy');
                btn.textContent = currentLabel;
            }
        });

        var isEditingSign = false;
        var editSignButton = null;

        function showSubscribed() {
            clearError();
            if (btn) {
                btn.hidden = true;
                btn.removeAttribute('aria-busy');
            }
            if (subscribedMsg) {
                var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                icon.classList.add('mh-symbol', 'mh-symbol--inline');
                icon.setAttribute('viewBox', '0 0 48 48');
                icon.setAttribute('fill', 'none');
                icon.setAttribute('stroke', 'currentColor');
                icon.setAttribute('stroke-width', '1.8');
                icon.setAttribute('aria-hidden', 'true');
                icon.setAttribute('focusable', 'false');
                var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                use.setAttribute('href', '/img/icons/mh-symbols.svg#check');
                icon.appendChild(use);
                var messageText = document.createElement('span');
                messageText.textContent = 'Odběr denního horoskopu jsme přijali pro vybrané znamení.';
                subscribedMsg.replaceChildren(icon, messageText);
                subscribedMsg.setAttribute('role', 'status');
                subscribedMsg.setAttribute('aria-live', 'polite');
                subscribedMsg.hidden = false;
                subscribedMsg.classList.add('mh-block-visible');
            }
            if (emailInput) emailInput.hidden = true;
            if (signSelect) signSelect.hidden = true;

            if (!editSignButton && subscribedMsg) {
                editSignButton = document.createElement('button');
                editSignButton.type = 'button';
                editSignButton.className = 'btn btn--secondary u-w-full mh-email-bridge__btn';
                editSignButton.textContent = 'Změnit znamení';
                editSignButton.addEventListener('click', function () {
                    if (subscribedMsg) {
                        subscribedMsg.hidden = true;
                        subscribedMsg.classList.remove('mh-block-visible');
                    }
                    editSignButton.hidden = true;
                    if (signSelect) signSelect.hidden = false;
                    btn.disabled = false;
                    btn.hidden = false;
                    btn.removeAttribute('aria-busy');
                    currentLabel = 'Uložit znamení';
                    btn.textContent = currentLabel;
                    isEditingSign = true;
                    if (signSelect) signSelect.focus();
                });
                subscribedMsg.insertAdjacentElement('afterend', editSignButton);
            }
            if (editSignButton) {
                editSignButton.hidden = false;
                editSignButton.focus();
            }
        }

        // Pre-fill sign from personalization
        window.addEventListener('personalization:ready', function () {
            if (isEditingSign || (editSignButton && !editSignButton.hidden)) return;
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
