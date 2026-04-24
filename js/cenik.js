const monthlyPrices = {
    pruvodce: '199 Kč',
    osviceni: '499 Kč',
    'vip-majestrat': '999 Kč'
};

const STRIPE_URLS = {
    pruvodce: 'https://buy.stripe.com/14A7sKfqRdNg2BJeTTc7u02',
    osviceni: 'https://buy.stripe.com/dRm6oG1A18sW9077rrc7u01',
    'vip-majestrat': 'https://buy.stripe.com/bJebJ0ceF4cG6RZ5jjc7u00'
};

function setPrices() {
    const suffix = '/měsíc';

    document.querySelectorAll('[data-price-plan]').forEach((element) => {
        const plan = element.dataset.pricePlan;
        if (!monthlyPrices[plan]) return;

        const amountEl = element.querySelector('.price-amount');
        const suffixEl = element.querySelector('.price-suffix');

        if (amountEl) amountEl.textContent = monthlyPrices[plan];
        if (suffixEl) suffixEl.textContent = suffix;
    });
}

function startCheckout(planId, source = 'pricing_page') {
    window.MH_ANALYTICS?.trackCheckoutStarted?.(planId, {
        source
    });

    const url = STRIPE_URLS[planId];
    if (url) {
        window.location.href = url;
    }
}

function sanitizeRedirectUrl(url) {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.delete('payment');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function showPaymentReturnState() {
    const params = new URLSearchParams(window.location.search);
    const paymentState = params.get('payment');

    if (!paymentState) {
        return;
    }

    if (paymentState === 'cancel') {
        window.MH_ANALYTICS?.trackPaymentResult?.('cancel', {
            source: 'pricing_page_return'
        });
        window.Auth?.showToast?.(
            'Platba byla zrušena',
            'Platbu jste nedokončili. Ceník zůstává otevřený, takže můžete pokračovat kdykoliv.',
            'info'
        );
    }

    history.replaceState({}, document.title, sanitizeRedirectUrl(window.location.href));
}

document.addEventListener('DOMContentLoaded', () => {
    setPrices();
    showPaymentReturnState();
    window.MH_ANALYTICS?.trackPricingViewed?.(sessionStorage.getItem('pending_plan'), {
        source: 'pricing_page'
    });

    const toggleMonthly = document.getElementById('toggle-monthly');
    const toggleYearly = document.getElementById('toggle-yearly');

    toggleMonthly?.addEventListener('click', () => setPrices());

    if (toggleYearly) {
        toggleYearly.style.opacity = '0.4';
        toggleYearly.style.cursor = 'not-allowed';
        toggleYearly.title = 'Roční plány připravujeme';
        toggleYearly.addEventListener('click', (event) => event.preventDefault());
    }

    document.querySelectorAll('.plan-checkout-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const planId = button.dataset.plan;
            if (!planId) return;
            const isLoggedIn = !!window.Auth?.isLoggedIn?.();

            window.MH_ANALYTICS?.trackCTA?.('pricing_plan_cta', {
                label: button.textContent?.trim() || 'checkout',
                plan_id: planId,
                requires_auth: !isLoggedIn,
                destination: isLoggedIn ? 'stripe_checkout' : '/prihlaseni.html?mode=register&redirect=/cenik.html'
            });

            const auth = window.Auth;
            if (!auth || !auth.isLoggedIn()) {
                sessionStorage.setItem('pending_plan', planId);
                window.location.href = '/prihlaseni.html?mode=register&redirect=/cenik.html';
                return;
            }

            startCheckout(planId);
        });
    });

    const pending = sessionStorage.getItem('pending_plan');
    if (!pending) return;

    const triggerPendingCheckout = () => {
        if (window.Auth?.isLoggedIn()) {
            sessionStorage.removeItem('pending_plan');
            startCheckout(pending, 'pending_plan_resume');
        }
    };

    if (window.Auth) {
        triggerPendingCheckout();
    } else {
        document.addEventListener('auth:changed', triggerPendingCheckout, { once: true });
    }
});
