export function initPaymentButtons() {
    const buyButtons = document.querySelectorAll('a[data-plan]');

    buyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const planId = btn.getAttribute('data-plan');

            if (planId === 'poutnik') {
                if (!window.Auth?.isLoggedIn()) {
                    const authUrl = new URL('/prihlaseni.html', window.location.origin);
                    authUrl.searchParams.set('mode', 'register');
                    authUrl.searchParams.set('redirect', '/horoskopy.html');
                    authUrl.searchParams.set('source', 'homepage_pricing_free_cta');
                    authUrl.searchParams.set('feature', 'daily_guidance');
                    window.location.href = `${authUrl.pathname}${authUrl.search}`;
                } else {
                    window.location.href = '/horoskopy.html';
                }
                return;
            }

            handlePaymentClick(planId, btn, {
                source: 'homepage_pricing_preview',
                feature: getHomepagePricingFeature(planId),
                redirect: '/cenik.html',
                authMode: 'register'
            });
        });
    });
}

function getHomepagePricingFeature(planId) {
    if (planId === 'osviceni') return 'astrocartography';
    if (planId === 'vip-majestrat') return 'vip_membership';
    return 'premium_membership';
}

function buildCheckoutMetadata(context = {}) {
    const source = context.source || 'homepage_pricing_preview';
    const feature = context.feature || null;
    const metadata = context.metadata && typeof context.metadata === 'object' && !Array.isArray(context.metadata)
        ? { ...context.metadata }
        : {};

    if (source && !metadata.entry_source) metadata.entry_source = source;
    if (feature && !metadata.entry_feature) metadata.entry_feature = feature;

    return metadata;
}

async function handlePaymentClick(planId, btn, context = {}) {
    const source = context.source || 'homepage_pricing_preview';
    const feature = context.feature || null;
    const metadata = buildCheckoutMetadata({ ...context, source, feature });

    // Check if user is logged in
    if (!window.Auth || !window.Auth.isLoggedIn()) {
        window.Auth?.showToast?.('Přihlášení vyžadováno', 'Pro nákup předplatného se prosím nejdříve přihlaste.', 'info');
        if (window.Auth?.startPlanCheckout) {
            window.Auth.startPlanCheckout(planId, {
                ...context,
                source,
                feature,
                metadata,
                redirect: context.redirect || '/cenik.html'
            });
            return;
        }

        const authUrl = new URL('/prihlaseni.html', window.location.origin);
        authUrl.searchParams.set('mode', context.authMode || 'register');
        authUrl.searchParams.set('redirect', context.redirect || '/cenik.html');
        authUrl.searchParams.set('plan', planId);
        authUrl.searchParams.set('source', source);
        if (feature) authUrl.searchParams.set('feature', feature);
        if (metadata.entry_source) authUrl.searchParams.set('entry_source', metadata.entry_source);
        if (metadata.entry_feature) authUrl.searchParams.set('entry_feature', metadata.entry_feature);
        window.location.href = `${authUrl.pathname}${authUrl.search}`;
        return;
    }

    const originalText = btn.innerHTML;

    try {
        // Loading state
        btn.disabled = true;
        btn.classList.add('payment-button--loading');
        btn.innerHTML = '<span class="loading-spinner loading-spinner--payment"></span> Přesměrování...';

        const baseUrl = window.API_CONFIG?.BASE_URL || '/api';
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;

        const response = await fetch(`${baseUrl}/payment/create-checkout-session`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({
                planId,
                source,
                feature,
                metadata
            })
        });

        if (!response.ok) {
            let errorMsg = 'Nepodařilo se vytvořit platební relaci';
            try { errorMsg = (await response.json()).error || errorMsg; } catch {}
            throw new Error(errorMsg);
        }

        const result = await response.json();

        if (result.url) {
            // Redirect to Stripe Checkout
            window.location.href = result.url;
        } else {
            throw new Error(result.error || 'Nepodařilo se vytvořit platební relaci');
        }

    } catch (error) {
        console.error('Payment Error:', error);
        window.Auth?.showToast?.('Chyba platby', error.message, 'error');

        // Reset button
        btn.disabled = false;
        btn.classList.remove('payment-button--loading');
        btn.innerHTML = originalText;
    }
}

