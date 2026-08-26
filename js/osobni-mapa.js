(() => {
    const PRODUCT = {
        id: 'osobni_mapa_2026',
        type: 'personal_map',
        name: 'Osobní mapa na 12 měsíců',
        price: 299,
        currency: 'CZK'
    };
    const DRAFT_KEY = 'mh_personal_map_order_draft';
    const FLOW_KEY = 'mh_personal_map_order_flow_id';
    const LEGACY_DRAFT_KEY = 'mh_personal_map_last_order';
    const DRAFT_MAX_AGE_MS = 3 * 60 * 60 * 1000;
    const SIGN_LABELS = {
        beran: 'Beran',
        byk: 'Býk',
        blizenci: 'Blíženci',
        rak: 'Rak',
        lev: 'Lev',
        panna: 'Panna',
        vahy: 'Váhy',
        stir: 'Štír',
        strelec: 'Střelec',
        kozoroh: 'Kozoroh',
        vodnar: 'Vodnář',
        ryby: 'Ryby'
    };

    function getAttribution() {
        const params = new URLSearchParams(window.location.search);
        return {
            source: params.get('source') || 'personal_map_page',
            feature: params.get('feature') || PRODUCT.id
        };
    }

    function getBaseEventPayload(extra = {}) {
        const attribution = getAttribution();
        return {
            product_id: PRODUCT.id,
            product_type: PRODUCT.type,
            product_name: PRODUCT.name,
            price: PRODUCT.price,
            currency: PRODUCT.currency,
            source: attribution.source,
            feature: attribution.feature,
            order_flow_id: getOrderFlowId(),
            ...extra
        };
    }

    function getOrderFlowId() {
        try {
            const existing = window.sessionStorage?.getItem?.(FLOW_KEY);
            if (existing) return existing;
            const created = `pm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
            window.sessionStorage?.setItem?.(FLOW_KEY, created);
            return created;
        } catch {
            return null;
        }
    }

    function trackAnalytics(methodName, ...args) {
        const method = window.MH_ANALYTICS?.[methodName];
        if (typeof method !== 'function') {
            return false;
        }

        try {
            method.apply(window.MH_ANALYTICS, args);
            return true;
        } catch (error) {
            console.warn(`[Personal map analytics] ${methodName} failed:`, error?.message || error);
            return false;
        }
    }

    function trackEvent(eventName, payload = {}) {
        const eventPayload = getBaseEventPayload(payload);
        trackAnalytics('trackEvent', eventName, eventPayload);
        void trackFunnelEvent(eventName, eventPayload);
    }

    async function trackFunnelEvent(eventName, payload = {}) {
        if (![
            'one_time_product_viewed',
            'one_time_product_cta_clicked',
            'one_time_form_started',
            'one_time_form_submitted',
            'one_time_form_validation_failed',
            'one_time_checkout_failed'
        ].includes(eventName)) {
            return;
        }

        try {
            const csrfToken = await getCsrfToken();
            await fetch('/api/payment/funnel-event', {
                method: 'POST',
                credentials: 'include',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    eventName,
                    source: payload.source || getAttribution().source,
                    feature: PRODUCT.id,
                    planId: PRODUCT.id,
                    planType: PRODUCT.type,
                    metadata: {
                        product_id: PRODUCT.id,
                        product_type: PRODUCT.type,
                        product_name: PRODUCT.name,
                        price: PRODUCT.price,
                        currency: PRODUCT.currency,
                        ...payload
                    }
                })
            });
        } catch (error) {
            console.warn('[Personal map funnel] Could not record event:', error.message);
        }
    }

    function trackView() {
        trackEvent('one_time_product_viewed');
    }

    function initIcons() {
        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
    }

    async function hydrateProductPeriod() {
        const preview = document.getElementById('personalMapPeriodPreview');
        if (!preview) return;

        try {
            const response = await fetch('/api/osobni-mapa/product', {
                credentials: 'same-origin',
                cache: 'no-store'
            });
            if (!response.ok) return;

            const product = await response.json();
            if (product?.period?.months !== 12 || !product.period.label) return;

            const readablePeriod = product.period.label.replace(' - ', ' až ');
            preview.textContent = `Při dnešním nákupu: ${readablePeriod}. Přesně 12 navazujících měsíců, ne pouze do konce roku.`;
        } catch {
            // Static fallback copy remains visible when the product API is unavailable.
        }
    }

    function initStatusBanners() {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const sessionId = params.get('session_id') || null;
        const attribution = getAttribution();

        if (status === 'success') {
            clearOrderDraft();
            document.getElementById('bannerSuccess')?.classList.add('visible');
            document.getElementById('order')?.setAttribute('hidden', 'true');
            trackAnalytics('trackPaymentResult', 'success', {
                product_id: PRODUCT.id,
                product_type: PRODUCT.type,
                session_id: sessionId,
                source: attribution.source,
                feature: attribution.feature
            });
            trackAnalytics('trackPurchaseCompleted', PRODUCT.id, PRODUCT.price, PRODUCT.currency, {
                product_type: PRODUCT.type,
                product_name: PRODUCT.name,
                transaction_id: sessionId || undefined,
                source: attribution.source,
                feature: attribution.feature
            });
            trackEvent('one_time_success_upsell_viewed', {
                session_id: sessionId,
                upsell_feature: 'premium_membership',
                upsell_plan: 'pruvodce'
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (status === 'cancel') {
            document.getElementById('bannerCancel')?.classList.add('visible');
            trackAnalytics('trackPaymentResult', 'cancel', {
                product_id: PRODUCT.id,
                product_type: PRODUCT.type,
                source: attribution.source,
                feature: attribution.feature
            });
            trackEvent('one_time_checkout_cancel_viewed');
        }
    }

    function getCtaLocation(element, targetId) {
        if (element.dataset.ctaLocation) return element.dataset.ctaLocation;
        if (element.dataset.successUpsell !== undefined) return 'success_upsell';
        if (element.dataset.cancelRecovery !== undefined) return 'cancel_recovery';
        if (targetId) return `scroll_${targetId}`;
        return element.id || 'personal_map_page';
    }

    function initScrollButtons() {
        document.querySelectorAll('[data-scroll-target]').forEach((button) => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.scrollTarget;
                const target = document.getElementById(targetId);
                trackEvent('one_time_product_cta_clicked', {
                    cta_location: getCtaLocation(button, targetId),
                    target: targetId || null
                });

                if (button.dataset.cancelRecovery !== undefined) {
                    trackEvent('one_time_cancel_recovery_clicked', {
                        recovery_action: 'return_to_order'
                    });
                }

                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    function initPostCheckoutActions() {
        document.querySelectorAll('[data-success-upsell]').forEach((link) => {
            link.addEventListener('click', () => {
                trackEvent('one_time_success_upsell_clicked', {
                    upsell_feature: 'premium_membership',
                    upsell_plan: 'pruvodce',
                    destination: link.getAttribute('href')
                });
            });
        });

        document.querySelectorAll('a[data-cancel-recovery]').forEach((link) => {
            link.addEventListener('click', () => {
                trackEvent('one_time_cancel_recovery_clicked', {
                    recovery_action: 'tarot',
                    destination: link.getAttribute('href')
                });
            });
        });
    }

    async function getCsrfToken() {
        const response = await fetch('/api/csrf-token', { credentials: 'include' });
        if (!response.ok) {
            throw new Error('Nepodařilo se připravit bezpečnou platbu. Zkus to prosím znovu.');
        }
        const data = await response.json();
        return data.csrfToken;
    }

    function collectPayload(form) {
        const formData = new FormData(form);
        const attribution = getAttribution();
        return {
            name: String(formData.get('name') || '').trim(),
            email: String(formData.get('email') || '').trim(),
            birthDate: String(formData.get('birthDate') || ''),
            sign: String(formData.get('sign') || ''),
            focusArea: String(formData.get('focusArea') || ''),
            grammaticalGender: String(formData.get('grammaticalGender') || 'neutral'),
            focus: String(formData.get('focus') || '').trim(),
            source: attribution.source
        };
    }

    function calculateZodiacSign(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
        const [, monthValue, dayValue] = value.split('-').map(Number);
        const boundary = monthValue * 100 + dayValue;

        if (boundary >= 321 && boundary <= 419) return 'beran';
        if (boundary >= 420 && boundary <= 520) return 'byk';
        if (boundary >= 521 && boundary <= 620) return 'blizenci';
        if (boundary >= 621 && boundary <= 722) return 'rak';
        if (boundary >= 723 && boundary <= 822) return 'lev';
        if (boundary >= 823 && boundary <= 922) return 'panna';
        if (boundary >= 923 && boundary <= 1022) return 'vahy';
        if (boundary >= 1023 && boundary <= 1121) return 'stir';
        if (boundary >= 1122 && boundary <= 1221) return 'strelec';
        if (boundary >= 1222 || boundary <= 119) return 'kozoroh';
        if (boundary <= 218) return 'vodnar';
        return 'ryby';
    }

    function updateZodiacSign(birthDateInput, signInput, preview) {
        const sign = calculateZodiacSign(birthDateInput?.value || '');
        if (signInput) signInput.value = sign;
        if (!preview) return sign;

        if (sign) {
            preview.textContent = `Znamení jsme doplnili automaticky: ${SIGN_LABELS[sign]}.`;
            preview.dataset.ready = 'true';
        } else {
            preview.textContent = 'Znamení doplníme automaticky podle data.';
            delete preview.dataset.ready;
        }
        return sign;
    }

    function clearOrderDraft() {
        try {
            window.sessionStorage?.removeItem?.(DRAFT_KEY);
            window.sessionStorage?.removeItem?.(FLOW_KEY);
            window.localStorage?.removeItem?.(LEGACY_DRAFT_KEY);
        } catch {
            // Storage can be unavailable in privacy modes; checkout must still work.
        }
    }

    function saveOrderDraft(payload) {
        try {
            window.sessionStorage?.setItem?.(DRAFT_KEY, JSON.stringify({
                payload,
                createdAt: Date.now()
            }));
            // Previous versions stored the sensitive focus text persistently.
            window.localStorage?.removeItem?.(LEGACY_DRAFT_KEY);
        } catch {
            // Draft recovery is a convenience, never a checkout dependency.
        }
    }

    function restoreOrderDraft(form, birthDateInput, signInput, signPreview) {
        try {
            // Always remove the legacy persistent copy, even when no session draft exists.
            window.localStorage?.removeItem?.(LEGACY_DRAFT_KEY);
            const saved = JSON.parse(window.sessionStorage?.getItem?.(DRAFT_KEY) || 'null');
            if (!saved?.payload || Date.now() - Number(saved.createdAt || 0) > DRAFT_MAX_AGE_MS) {
                window.sessionStorage?.removeItem?.(DRAFT_KEY);
                return false;
            }

            ['name', 'email', 'birthDate', 'focusArea', 'grammaticalGender', 'focus'].forEach((fieldName) => {
                const field = form.elements.namedItem(fieldName);
                const value = saved.payload[fieldName];
                if (field && typeof value === 'string') field.value = value;
            });
            updateZodiacSign(birthDateInput, signInput, signPreview);
            const restoredMessage = document.getElementById('formRestored');
            if (restoredMessage) restoredMessage.hidden = false;
            return true;
        } catch {
            clearOrderDraft();
            return false;
        }
    }

    function applySuggestedFocusArea(form) {
        const focusArea = form.elements.namedItem('focusArea');
        if (!(focusArea instanceof HTMLSelectElement) || focusArea.value) return false;

        const suggestedValue = new URLSearchParams(window.location.search).get('focus_area');
        const isSupported = Array.from(focusArea.options).some((option) =>
            option.value === suggestedValue && !option.disabled
        );
        if (!isSupported) return false;

        focusArea.value = suggestedValue;
        return true;
    }

    function getSafeCheckoutUrl(value) {
        if (typeof value !== 'string' || !value.trim()) return null;
        try {
            const url = new URL(value, window.location.origin);
            const isSameOrigin = url.origin === window.location.origin;
            const isStripeCheckout = url.protocol === 'https:' && url.hostname === 'checkout.stripe.com';
            return isSameOrigin || isStripeCheckout ? url.href : null;
        } catch {
            return null;
        }
    }

    function getValidationReason(field) {
        if (field?.validity?.valueMissing) return 'value_missing';
        if (field?.validity?.typeMismatch) return 'type_mismatch';
        if (field?.validity?.tooShort) return 'too_short';
        if (field?.validity?.tooLong) return 'too_long';
        if (field?.validity?.rangeOverflow) return 'range_overflow';
        return 'invalid_value';
    }

    function initValidationTracking(form) {
        let validationAttemptActive = false;
        form.addEventListener('invalid', (event) => {
            const field = event.target;
            field?.setAttribute?.('aria-invalid', 'true');
            if (validationAttemptActive) return;

            validationAttemptActive = true;
            trackEvent('one_time_form_validation_failed', {
                field: field?.name || field?.id || 'unknown',
                reason: getValidationReason(field)
            });
            window.setTimeout(() => {
                validationAttemptActive = false;
            }, 0);
        }, true);

        form.addEventListener('input', (event) => {
            if (event.target?.matches?.('input, select, textarea')) {
                event.target.removeAttribute('aria-invalid');
            }
        });
    }

    function setButtonLoading(button, isLoading) {
        button.disabled = isLoading;
        button.innerHTML = isLoading
            ? '<span>Otevírám bezpečnou platbu…</span>'
            : '<i data-lucide="lock-keyhole" aria-hidden="true"></i><span>Pokračovat k platbě 299 Kč</span>';
        initIcons();
    }

    function showError(errorBox, message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
        errorBox.focus();
    }

    function hideError(errorBox) {
        errorBox.textContent = '';
        errorBox.hidden = true;
    }

    function initFormStartedTracking(form) {
        let tracked = false;

        form.addEventListener('focusin', (event) => {
            if (tracked) return;
            const field = event.target?.name || event.target?.id || 'unknown';
            tracked = true;
            trackEvent('one_time_form_started', { field });
        });
    }

    function initOrderForm() {
        const form = document.getElementById('personalMapForm');
        const submitButton = document.getElementById('submitBtn');
        const errorBox = document.getElementById('formError');
        const birthDate = document.getElementById('birthDate');
        const sign = document.getElementById('sign');
        const signPreview = document.getElementById('signPreview');

        if (!form || !submitButton || !errorBox) return;

        if (birthDate) {
            birthDate.max = new Date().toISOString().slice(0, 10);
            birthDate.addEventListener('change', () => updateZodiacSign(birthDate, sign, signPreview));
            birthDate.addEventListener('input', () => updateZodiacSign(birthDate, sign, signPreview));
        }

        initFormStartedTracking(form);
        initValidationTracking(form);
        const restoredDraft = restoreOrderDraft(form, birthDate, sign, signPreview);
        if (!restoredDraft) applySuggestedFocusArea(form);

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideError(errorBox);
            updateZodiacSign(birthDate, sign, signPreview);

            if (!form.checkValidity()) {
                trackEvent('one_time_form_validation_failed');
                form.reportValidity();
                return;
            }

            setButtonLoading(submitButton, true);

            try {
                const payload = collectPayload(form);
                trackEvent('one_time_form_submitted', {
                    focus_area: payload.focusArea,
                    grammatical_gender: payload.grammaticalGender
                });
                saveOrderDraft(payload);

                trackAnalytics('trackCheckoutStarted', PRODUCT.id, {
                    product_type: PRODUCT.type,
                    value: PRODUCT.price,
                    currency: PRODUCT.currency,
                    source: payload.source,
                    feature: PRODUCT.id
                });

                const csrfToken = await getCsrfToken();
                const response = await fetch('/api/osobni-mapa/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || 'Platbu se nepodařilo spustit. Zkus to prosím znovu.');
                }

                const checkoutUrl = getSafeCheckoutUrl(data.url);
                if (!checkoutUrl) {
                    throw new Error('Bezpečnou platební stránku se nepodařilo ověřit. Zkus to prosím znovu.');
                }
                window.location.href = checkoutUrl;
            } catch (error) {
                trackEvent('one_time_checkout_failed', {
                    error_message: error.message
                });
                showError(errorBox, error.message);
                setButtonLoading(submitButton, false);
            }
        });
    }

    function init() {
        initIcons();
        void hydrateProductPeriod();
        trackView();
        initStatusBanners();
        initScrollButtons();
        initPostCheckoutActions();
        initOrderForm();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
