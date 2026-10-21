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
    const FLOW_CREATED_AT_KEY = 'mh_personal_map_order_flow_created_at';
    const FLOW_SUBMITTED_KEY = 'mh_personal_map_order_flow_submitted';
    const LEGACY_DRAFT_KEY = 'mh_personal_map_last_order';
    const DRAFT_MAX_AGE_MS = 3 * 60 * 60 * 1000;
    const FLOW_MAX_AGE_MS = 25 * 60 * 60 * 1000;
    let volatileOrderFlowId = null;
    let volatileOrderFlowCreatedAt = 0;
    let volatileOrderFlowSubmitted = false;

    function getPragueDateKey(date = new Date()) {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Prague',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(date);
        const value = type => parts.find(part => part.type === type).value;
        return `${value('year')}-${value('month')}-${value('day')}`;
    }
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
        const now = Date.now();
        if (volatileOrderFlowId
            && (!volatileOrderFlowSubmitted || (now - volatileOrderFlowCreatedAt >= 0 && now - volatileOrderFlowCreatedAt <= FLOW_MAX_AGE_MS))) {
            return volatileOrderFlowId;
        }
        if (volatileOrderFlowId) clearOrderFlowId();

        try {
            const existing = window.sessionStorage?.getItem?.(FLOW_KEY);
            if (/^pm_[a-zA-Z0-9_-]{12,100}$/.test(existing || '')) {
                const submitted = window.sessionStorage?.getItem?.(FLOW_SUBMITTED_KEY) === '1';
                const createdAt = Number(window.sessionStorage?.getItem?.(FLOW_CREATED_AT_KEY));
                const age = now - createdAt;
                if (!submitted || (Number.isFinite(createdAt) && age >= 0 && age <= FLOW_MAX_AGE_MS)) {
                    volatileOrderFlowId = existing;
                    volatileOrderFlowCreatedAt = Number.isFinite(createdAt) ? createdAt : now;
                    volatileOrderFlowSubmitted = submitted;
                    return existing;
                }
            }
        } catch {
            // Keep a stable in-memory id when storage is blocked by privacy settings.
        }

        const uuid = window.crypto?.randomUUID?.().replace(/-/g, '');
        const created = `pm_${uuid || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`}`;
        volatileOrderFlowId = created;
        volatileOrderFlowCreatedAt = now;
        volatileOrderFlowSubmitted = false;
        try {
            window.sessionStorage?.setItem?.(FLOW_KEY, created);
            window.sessionStorage?.setItem?.(FLOW_CREATED_AT_KEY, String(now));
            window.sessionStorage?.removeItem?.(FLOW_SUBMITTED_KEY);
        } catch { /* Checkout still works when session storage is unavailable. */ }
        return created;
    }

    function markOrderFlowSubmitted() {
        const flowId = getOrderFlowId();
        if (volatileOrderFlowSubmitted) return flowId;

        volatileOrderFlowCreatedAt = Date.now();
        volatileOrderFlowSubmitted = true;
        try {
            window.sessionStorage?.setItem?.(FLOW_CREATED_AT_KEY, String(volatileOrderFlowCreatedAt));
            window.sessionStorage?.setItem?.(FLOW_SUBMITTED_KEY, '1');
        } catch { /* The in-memory flow stays stable for retries in this tab. */ }
        return flowId;
    }

    function clearOrderFlowId() {
        volatileOrderFlowId = null;
        volatileOrderFlowCreatedAt = 0;
        volatileOrderFlowSubmitted = false;
        try {
            window.sessionStorage?.removeItem?.(FLOW_KEY);
            window.sessionStorage?.removeItem?.(FLOW_CREATED_AT_KEY);
            window.sessionStorage?.removeItem?.(FLOW_SUBMITTED_KEY);
        } catch { /* Storage is optional. */ }
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

    let verifyingPayment = false;
    let verifiedPayment = false;
    async function initStatusBanners() {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const sessionId = params.get('session_id') || null;
        const attribution = getAttribution();

        if (status === 'success') {
            if (verifyingPayment || verifiedPayment) return;
            verifyingPayment = true;
            const notice = document.getElementById('bannerVerification');
            const retry = document.getElementById('pdf-verification-retry');
            notice?.classList.add('visible');
            document.getElementById('order')?.setAttribute('hidden', 'true');
            if (retry) { retry.hidden = true; retry.onclick = initStatusBanners; }
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 6000);
            let result = null;
            try {
                if (sessionId && /^cs_[A-Za-z0-9_]{3,200}$/.test(sessionId)) {
                    const response = await fetch(`/api/osobni-mapa/checkout-result?session_id=${encodeURIComponent(sessionId)}`, {
                        credentials: 'include', cache: 'no-store', signal: controller.signal
                    });
                    const body = response.ok ? await response.json() : null;
                    if (body?.success) result = body.result;
                }
            } catch { /* Never infer payment success from a failed lookup. */ }
            finally { clearTimeout(timer); verifyingPayment = false; }
            if (result?.status !== 'paid' || result.product_id !== PRODUCT.id || !result.transaction_id
                || !Number.isFinite(result.value) || result.value <= 0 || result.currency !== 'CZK') {
                const message = document.getElementById('pdf-verification-message');
                if (message) message.textContent = 'Platbu zatím nemůžeme potvrdit. Neplať znovu: ověř stav později nebo napiš na support@mystickahvezda.cz. PDF se po potvrzené platbě doručuje e-mailem i bez této stránky.';
                if (retry) retry.hidden = false;
                return;
            }
            verifiedPayment = true;
            notice?.classList.remove('visible');
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
            trackAnalytics('trackPurchaseCompleted', PRODUCT.id, result.value, result.currency, {
                verified: true,
                product_type: PRODUCT.type,
                product_name: PRODUCT.name,
                transaction_id: result.transaction_id,
                source: attribution.source,
                feature: attribution.feature
            });
            trackEvent('one_time_success_upsell_viewed', {
                session_id: sessionId,
                upsell_feature: 'premium_membership',
                upsell_plan: 'pruvodce'
            });
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
                    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
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
            source: attribution.source,
            flowId: getOrderFlowId()
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
        clearOrderFlowId();
        try {
            window.sessionStorage?.removeItem?.(DRAFT_KEY);
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
            const rawDraft = window.sessionStorage?.getItem?.(DRAFT_KEY);
            if (!rawDraft) return false;
            const saved = JSON.parse(rawDraft);
            const createdAt = Number(saved?.createdAt);
            const draftAge = Date.now() - createdAt;
            if (!saved?.payload || !Number.isFinite(createdAt) || draftAge < 0 || draftAge > DRAFT_MAX_AGE_MS) {
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

        const refreshBirthDateMaximum = () => {
            if (birthDate) birthDate.max = getPragueDateKey();
        };
        if (birthDate) {
            refreshBirthDateMaximum();
            birthDate.addEventListener('change', () => updateZodiacSign(birthDate, sign, signPreview));
            birthDate.addEventListener('input', () => updateZodiacSign(birthDate, sign, signPreview));
            birthDate.addEventListener('change', refreshBirthDateMaximum);
            form.addEventListener('focusin', refreshBirthDateMaximum);
            form.addEventListener('pointerdown', refreshBirthDateMaximum);
            form.addEventListener('keydown', refreshBirthDateMaximum);
            window.addEventListener('focus', refreshBirthDateMaximum);
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') refreshBirthDateMaximum();
            });
        }

        initFormStartedTracking(form);
        initValidationTracking(form);
        const restoredDraft = restoreOrderDraft(form, birthDate, sign, signPreview);
        if (!restoredDraft) applySuggestedFocusArea(form);
        let checkoutInProgress = false;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            refreshBirthDateMaximum();
            if (checkoutInProgress) return;
            hideError(errorBox);
            updateZodiacSign(birthDate, sign, signPreview);

            if (!form.checkValidity()) {
                trackEvent('one_time_form_validation_failed');
                form.reportValidity();
                return;
            }

            markOrderFlowSubmitted();
            const payload = collectPayload(form);
            checkoutInProgress = true;
            form.setAttribute('aria-busy', 'true');
            const formControls = Array.from(form.querySelectorAll('input, select, textarea, button'));
            const previousDisabledStates = formControls.map((control) => control.disabled);
            formControls.forEach((control) => { control.disabled = true; });
            setButtonLoading(submitButton, true);

            try {
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
                    const checkoutError = new Error(data.error || 'Platbu se nepodařilo spustit. Zkus to prosím znovu.');
                    checkoutError.status = response.status;
                    checkoutError.code = data.code;
                    throw checkoutError;
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
                if (error.status === 409 && error.code === 'checkout_session_expired') {
                    clearOrderFlowId();
                }
                showError(errorBox, error.message);
                checkoutInProgress = false;
                form.removeAttribute('aria-busy');
                setButtonLoading(submitButton, false);
                formControls.forEach((control, index) => {
                    control.disabled = previousDisabledStates[index];
                });
                if (error.status === 409 && error.code === 'personal_map_flow_conflict') {
                    submitButton.disabled = true;
                }
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
