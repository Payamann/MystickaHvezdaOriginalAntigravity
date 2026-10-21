const ANNUAL_HOROSCOPE_PRODUCT = {
    id: 'rocni_horoskop_2026',
    type: 'annual_horoscope',
    name: 'Mini Roční horoskop na míru 2026',
    price: 199,
    currency: 'CZK'
};
let annualVerificationInProgress = false;
let verifiedAnnualPurchaseSessionId = null;

function getAnnualContext() {
    const params = new URLSearchParams(window.location.search);
    return {
        source: params.get('source') || 'annual_horoscope_page',
        feature: params.get('feature') || ANNUAL_HOROSCOPE_PRODUCT.id
    };
}

function getAnnualEventPayload(extra = {}) {
    const context = getAnnualContext();
    return {
        product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
        product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
        product_name: ANNUAL_HOROSCOPE_PRODUCT.name,
        price: ANNUAL_HOROSCOPE_PRODUCT.price,
        currency: ANNUAL_HOROSCOPE_PRODUCT.currency,
        source: context.source,
        feature: context.feature,
        ...extra
    };
}

function trackAnnualAnalytics(methodName, ...args) {
    const method = window.MH_ANALYTICS?.[methodName];
    if (typeof method !== 'function') {
        return false;
    }

    try {
        method.apply(window.MH_ANALYTICS, args);
        return true;
    } catch (error) {
        console.warn(`[Annual horoscope analytics] ${methodName} failed:`, error?.message || error);
        return false;
    }
}

function trackAnnualEvent(eventName, payload = {}) {
    const eventPayload = getAnnualEventPayload(payload);
    trackAnnualAnalytics('trackEvent', eventName, eventPayload);
    void trackAnnualFunnelEvent(eventName, eventPayload);
}

async function trackAnnualFunnelEvent(eventName, payload = {}) {
    if (![
        'one_time_product_cta_clicked',
        'one_time_form_started',
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
                source: payload.source || getAnnualContext().source,
                feature: ANNUAL_HOROSCOPE_PRODUCT.id,
                planId: ANNUAL_HOROSCOPE_PRODUCT.id,
                planType: ANNUAL_HOROSCOPE_PRODUCT.type,
                metadata: {
                    product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
                    product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
                    product_name: ANNUAL_HOROSCOPE_PRODUCT.name,
                    price: ANNUAL_HOROSCOPE_PRODUCT.price,
                    currency: ANNUAL_HOROSCOPE_PRODUCT.currency,
                    ...payload
                }
            })
        });
    } catch (error) {
        console.warn('[Annual horoscope funnel] Could not record event:', error.message);
    }
}

function trackAnnualProductView() {
    trackAnnualEvent('one_time_product_viewed');
}

function showAnnualPaymentVerificationMessage(title, message, { retry = false } = {}) {
    const banner = document.getElementById('bannerVerification');
    const titleElement = document.getElementById('verificationTitle');
    const messageElement = document.getElementById('verificationMessage');
    const retryButton = document.getElementById('retryVerification');
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (retryButton) retryButton.hidden = !retry;
    banner?.classList.add('visible');
}

async function verifyAnnualPayment(sessionId) {
    if (annualVerificationInProgress || !sessionId) return;
    annualVerificationInProgress = true;
    const retryButton = document.getElementById('retryVerification');
    if (retryButton) {
        retryButton.disabled = true;
        retryButton.textContent = 'Ověřujeme…';
    }
    showAnnualPaymentVerificationMessage('Ověřujeme platbu', 'Stav objednávky kontrolujeme přímo u Stripe. Do potvrzení prosím nevytvářej další platbu.');

    try {
        const url = new URL('/api/rocni-horoskop/checkout-result', window.location.origin);
        url.searchParams.set('session_id', sessionId);
        const response = await fetch(url.toString(), { credentials: 'same-origin', cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success !== true) throw new Error(data.error || 'Platbu se nepodařilo ověřit.');

        const result = data.result || {};
        if (result.product_id !== ANNUAL_HOROSCOPE_PRODUCT.id) throw new Error('Tato objednávka nepatří k ročnímu horoskopu.');

        if (result.status === 'paid') {
            document.getElementById('bannerVerification')?.classList.remove('visible');
            document.getElementById('bannerSuccess')?.classList.add('visible');
            trackAnnualAnalytics('trackPaymentResult', 'success', {
                product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
                product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
                transaction_id: result.transaction_id || undefined,
                source: getAnnualContext().source,
                feature: getAnnualContext().feature
            });
            if (verifiedAnnualPurchaseSessionId !== sessionId) {
                verifiedAnnualPurchaseSessionId = sessionId;
                trackAnnualAnalytics(
                    'trackPurchaseCompleted',
                    ANNUAL_HOROSCOPE_PRODUCT.id,
                    result.value,
                    result.currency,
                    {
                        product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
                        product_name: ANNUAL_HOROSCOPE_PRODUCT.name,
                        transaction_id: result.transaction_id || undefined,
                        source: getAnnualContext().source,
                        feature: getAnnualContext().feature
                    }
                );
            }
            return;
        }

        if (result.status === 'pending') {
            showAnnualPaymentVerificationMessage(
                'Platba se ještě potvrzuje',
                'Stripe zatím nepotvrdil dokončení platby. Za chvíli můžeš stav ověřit znovu; novou objednávku nezakládej.',
                { retry: true }
            );
            return;
        }

        showAnnualPaymentVerificationMessage(
            'Platbu se nepodařilo potvrdit',
            'Stripe zatím nepotvrdil zaplacenou objednávku. Pokud jsi platbu dokončil, napiš nám přes Kontakt a stav ověříme.',
            { retry: true }
        );
    } catch (error) {
        showAnnualPaymentVerificationMessage(
            'Platbu teď nemůžeme ověřit',
            'Stav objednávky se nepodařilo načíst. Pokud jsi platbu dokončil, zkus ověření za chvíli znovu.',
            { retry: true }
        );
    } finally {
        annualVerificationInProgress = false;
        if (retryButton) {
            retryButton.disabled = false;
            retryButton.textContent = 'Ověřit znovu';
        }
    }
}

function handleAnnualPaymentStatus() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const sessionId = params.get('session_id') || null;
    const context = getAnnualContext();

    if (status === 'success') {
        document.querySelectorAll(
            '.hero, .trust-strip, .annual-product-bridge, .sections-row, .sample-section, .form-section, .faq-section'
        ).forEach((section) => {
            section.hidden = true;
        });
        const retryButton = document.getElementById('retryVerification');
        retryButton?.addEventListener('click', () => { void verifyAnnualPayment(sessionId); });
        if (sessionId) {
            void verifyAnnualPayment(sessionId);
        } else {
            showAnnualPaymentVerificationMessage(
                'Platbu se nepodařilo ověřit',
                'Chybí identifikátor objednávky. Pokud jsi platbu dokončil, napiš nám přes Kontakt.'
            );
        }
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    } else if (status === 'cancel') {
        document.getElementById('bannerCancel')?.classList.add('visible');
        trackAnnualAnalytics('trackPaymentResult', 'cancel', {
            product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
            product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
            source: context.source,
            feature: context.feature
        });
    }
}

function getAnnualCtaLocation(button) {
    return button.dataset.ctaLocation || button.className || 'annual_horoscope_page';
}

function bindAnnualScrollButtons() {
    document.querySelectorAll('[data-scroll-target]').forEach((button) => {
        button.addEventListener('click', () => {
            const target = document.getElementById(button.dataset.scrollTarget);
            trackAnnualEvent('one_time_product_cta_clicked', {
                cta_location: getAnnualCtaLocation(button),
                target: button.dataset.scrollTarget || null
            });
            if (!target) return;

            const navBottom = document.querySelector('.site-nav')?.getBoundingClientRect().bottom || 0;
            const targetTop = target.getBoundingClientRect().top + window.scrollY;
            const offset = Math.max(88, navBottom + 16);
            window.scrollTo({
                top: Math.max(0, targetTop - offset),
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
        });
    });
}

function getOrderBody() {
    return {
        name: document.getElementById('name')?.value.trim() || '',
        birthDate: document.getElementById('birthDate')?.value || '',
        sign: document.getElementById('sign')?.value || '',
        email: document.getElementById('email')?.value.trim() || ''
    };
}

function bindAnnualUpgradeLinks() {
    document.querySelectorAll('[data-annual-upgrade]').forEach((link) => {
        link.addEventListener('click', () => {
            trackAnnualAnalytics('trackCTA', 'annual_horoscope_success_upgrade', {
                product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
                destination: link.getAttribute('href') || '/cenik.html',
                source: 'annual_horoscope_success',
                feature: 'premium_membership',
                plan_id: 'pruvodce'
            });
        });
    });
}

async function getCsrfToken() {
    const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
    const { csrfToken } = await csrfRes.json();
    return csrfToken;
}

function resetAnnualSubmitButton(button) {
    button.disabled = false;
    button.textContent = 'Pokračovat k platbě (199 Kč) →';
}

function bindAnnualOrderForm() {
    const form = document.getElementById('orderForm');
    const button = document.getElementById('submitBtn');
    const errorElement = document.getElementById('formError');

    if (!form || !button || !errorElement) return;

    let formStartedTracked = false;
    form.addEventListener('focusin', (event) => {
        if (formStartedTracked) return;
        formStartedTracked = true;
        trackAnnualEvent('one_time_form_started', {
            field: event.target?.name || event.target?.id || 'unknown'
        });
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        button.disabled = true;
        button.textContent = 'Přesměrovávám na platbu...';
        errorElement.hidden = true;
        errorElement.classList.remove('visible');

        if (!form.checkValidity()) {
            trackAnnualEvent('one_time_form_validation_failed', {
                validation_source: 'browser'
            });
            form.reportValidity();
            resetAnnualSubmitButton(button);
            return;
        }

        try {
            trackAnnualAnalytics('trackCheckoutStarted', ANNUAL_HOROSCOPE_PRODUCT.id, {
                product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
                value: ANNUAL_HOROSCOPE_PRODUCT.price,
                currency: ANNUAL_HOROSCOPE_PRODUCT.currency,
                source: getAnnualContext().source,
                feature: getAnnualContext().feature
            });

            const csrfToken = await getCsrfToken();
            const res = await fetch('/api/rocni-horoskop/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                credentials: 'include',
                body: JSON.stringify({
                    ...getOrderBody(),
                    source: getAnnualContext().source
                })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Něco se pokazilo. Zkuste to prosím znovu.');
            }

            window.location.href = data.url;
        } catch (err) {
            trackAnnualAnalytics('trackEvent', 'one_time_checkout_failed', {
                product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
                error_message: err.message,
                source: getAnnualContext().source,
                feature: getAnnualContext().feature
            });
            void trackAnnualFunnelEvent('one_time_checkout_failed', {
                ...getAnnualEventPayload(),
                error_message: err.message
            });
            errorElement.textContent = err.message;
            errorElement.hidden = false;
            errorElement.classList.add('visible');
            resetAnnualSubmitButton(button);
        }
    });
}

function initAnnualHoroscopePage() {
    if (new URLSearchParams(window.location.search).get('status') !== 'success') {
        trackAnnualProductView();
    }
    handleAnnualPaymentStatus();
    bindAnnualScrollButtons();
    bindAnnualUpgradeLinks();
    bindAnnualOrderForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnualHoroscopePage);
} else {
    initAnnualHoroscopePage();
}
