const ANNUAL_HOROSCOPE_PRODUCT = {
    id: 'rocni_horoskop_2026',
    type: 'annual_horoscope',
    name: 'Roční horoskop na míru 2026',
    price: 199,
    currency: 'CZK'
};

function trackAnnualProductView() {
    window.MH_ANALYTICS?.trackEvent?.('one_time_product_viewed', {
        product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
        product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
        price: ANNUAL_HOROSCOPE_PRODUCT.price,
        currency: ANNUAL_HOROSCOPE_PRODUCT.currency
    });
}

function handleAnnualPaymentStatus() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const sessionId = params.get('session_id') || null;

    if (status === 'success') {
        document.getElementById('bannerSuccess')?.classList.add('visible');

        const formSection = document.getElementById('form');
        const sampleSection = document.querySelector('.sample-section');
        if (formSection) formSection.hidden = true;
        if (sampleSection) sampleSection.hidden = true;

        window.MH_ANALYTICS?.trackPaymentResult?.('success', {
            product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
            product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
            session_id: sessionId
        });
        window.MH_ANALYTICS?.trackPurchaseCompleted?.(
            ANNUAL_HOROSCOPE_PRODUCT.id,
            ANNUAL_HOROSCOPE_PRODUCT.price,
            ANNUAL_HOROSCOPE_PRODUCT.currency,
            {
                product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
                product_name: ANNUAL_HOROSCOPE_PRODUCT.name,
                transaction_id: sessionId || undefined,
                source: 'annual_horoscope_success'
            }
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (status === 'cancel') {
        document.getElementById('bannerCancel')?.classList.add('visible');
        window.MH_ANALYTICS?.trackPaymentResult?.('cancel', {
            product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
            product_type: ANNUAL_HOROSCOPE_PRODUCT.type
        });
    }
}

function bindAnnualScrollButtons() {
    document.querySelectorAll('[data-scroll-target]').forEach((button) => {
        button.addEventListener('click', () => {
            const target = document.getElementById(button.dataset.scrollTarget);
            target?.scrollIntoView({ behavior: 'smooth' });
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

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        button.disabled = true;
        button.textContent = 'Přesměrovávám na platbu...';
        errorElement.hidden = true;
        errorElement.classList.remove('visible');

        try {
            window.MH_ANALYTICS?.trackCheckoutStarted?.(ANNUAL_HOROSCOPE_PRODUCT.id, {
                product_type: ANNUAL_HOROSCOPE_PRODUCT.type,
                value: ANNUAL_HOROSCOPE_PRODUCT.price,
                currency: ANNUAL_HOROSCOPE_PRODUCT.currency
            });

            const csrfToken = await getCsrfToken();
            const res = await fetch('/api/rocni-horoskop/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                credentials: 'include',
                body: JSON.stringify(getOrderBody())
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Něco se pokazilo. Zkuste to prosím znovu.');
            }

            window.location.href = data.url;
        } catch (err) {
            window.MH_ANALYTICS?.trackEvent?.('one_time_checkout_failed', {
                product_id: ANNUAL_HOROSCOPE_PRODUCT.id,
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
    trackAnnualProductView();
    handleAnnualPaymentStatus();
    bindAnnualScrollButtons();
    bindAnnualOrderForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnualHoroscopePage);
} else {
    initAnnualHoroscopePage();
}
