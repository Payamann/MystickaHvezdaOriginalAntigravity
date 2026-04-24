const monthlyPrices = {
    pruvodce: '199 Kč',
    osviceni: '499 Kč',
    'vip-majestrat': '999 Kč'
};

const PLAN_META = {
    pruvodce: {
        name: 'Hvězdný Průvodce',
        headline: 'Nejrychlejší cesta k plným výkladům a každodennímu vedení.',
        recommendedFor: 'Většina lidí začíná tady.'
    },
    osviceni: {
        name: 'Osvícení',
        headline: 'Pro chvíli, kdy chceš jít víc do hloubky a odemknout pokročilé nástroje.',
        recommendedFor: 'Doporučeno pro astrokartografii a hlubší analýzy.'
    },
    'vip-majestrat': {
        name: 'VIP Majestrát',
        headline: 'Nejvyšší hloubka, priorita a osobní péče.',
        recommendedFor: 'Pro nejnáročnější uživatele.'
    }
};

const FEATURE_PLAN_MAP = {
    astrocartography: 'osviceni',
    synastry: 'pruvodce',
    partnerska_detail: 'pruvodce',
    natalni_interpretace: 'pruvodce',
    numerologie_vyklad: 'pruvodce',
    rituals: 'pruvodce',
    mentor: 'pruvodce'
};

function updatePricingCopy() {
    const heroTitle = document.querySelector('.section--hero .hero__title');
    const heroSubtitle = document.querySelector('.section--hero .hero__subtitle');
    const heroTrustBadge = document.querySelector('.hero__trust-badge');
    const pricingCards = document.querySelectorAll('.card--pricing');
    const premiumReasonsBadge = Array.from(document.querySelectorAll('.section__badge'))
        .find((badge) => badge.textContent?.includes('Proč lidé'));
    const premiumReasonsTitle = premiumReasonsBadge?.closest('.section__header')?.querySelector('.section__title');

    if (heroTitle) {
        heroTitle.innerHTML = 'Začněte zdarma. <span class="text-gradient">Až ucítíte hodnotu, odemkněte Hvězdného Průvodce.</span>';
    }

    if (heroSubtitle) {
        heroSubtitle.textContent = 'Bezplatný účet vám ukáže, jak Mystická Hvězda funguje. Hvězdný Průvodce za 199 Kč měsíčně odemkne plné výklady, osobní vhledy a každodenní vedení bez limitu pro lidi, kteří se chtějí vracet pravidelně.';
    }

    if (heroTrustBadge) {
        heroTrustBadge.innerHTML = '<span>12 000+ aktivních uživatelů</span><span>|</span><span>Účet zdarma bez karty</span><span>|</span><span>Zrušíte kdykoliv</span>';
    }

    const freeCard = pricingCards[0];
    const guideCard = pricingCards[1];

    if (freeCard) {
        const freeDescription = freeCard.querySelector('.card__text');
        const freeFeatures = freeCard.querySelectorAll('.card__features li');
        const freeCta = freeCard.querySelector('.btn');

        if (freeDescription) freeDescription.textContent = 'Pro první seznámení bez závazku';
        if (freeFeatures[2]) freeFeatures[2].textContent = 'Vyzkoušejte si, co vám sedne nejvíc';
        if (freeCta) freeCta.textContent = 'Začít zdarma';
    }

    if (guideCard) {
        const guideDescription = guideCard.querySelector('.card__text');
        const guideFeatures = guideCard.querySelectorAll('.card__features li');
        const guideCta = guideCard.querySelector('.plan-checkout-btn');

        if (guideDescription) guideDescription.textContent = 'Pro většinu lidí, kteří chtějí z webu udělat každodenní oporu';
        if (guideFeatures[0]) guideFeatures[0].textContent = 'Neomezené výklady a každodenní vedení bez čekání';
        if (guideFeatures[1]) guideFeatures[1].textContent = 'Plný rozbor natální karty a numerologie';
        if (guideFeatures[2]) guideFeatures[2].textContent = 'Partnerská shoda, minulý život a plné horoskopy';
        if (guideFeatures[3]) guideFeatures[3].textContent = 'Nejrychlejší cesta k tomu, aby vám web dával hodnotu každý den';
        if (guideCta) guideCta.textContent = 'Odemknout Hvězdného Průvodce';
    }

    if (premiumReasonsTitle) {
        premiumReasonsTitle.textContent = 'Neplatíte za další ikonky. Platíte za hlubší odpovědi a pravidelný návrat k tomu, co vám pomáhá.';
    }
}

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

function sanitizeRedirectUrl(url) {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.delete('payment');
    parsed.searchParams.delete('plan');
    parsed.searchParams.delete('source');
    parsed.searchParams.delete('feature');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function resolveCheckoutContext() {
    const params = new URLSearchParams(window.location.search);
    const pendingContext = window.Auth?.getPendingCheckoutContext?.() || {};
    const feature = params.get('feature') || pendingContext.feature || null;
    const explicitPlan = params.get('plan') || pendingContext.planId || null;
    const source = params.get('source') || pendingContext.source || 'pricing_page';
    const recommendedPlan = explicitPlan || FEATURE_PLAN_MAP[feature] || 'pruvodce';

    return {
        feature,
        source,
        recommendedPlan
    };
}

function showPaymentReturnState(context) {
    const params = new URLSearchParams(window.location.search);
    const paymentState = params.get('payment');

    if (!paymentState) {
        return;
    }

    if (paymentState === 'cancel') {
        window.MH_ANALYTICS?.trackPaymentResult?.('cancel', {
            source: context.source || 'pricing_page_return',
            feature: context.feature || null
        });
        window.Auth?.showToast?.(
            'Platba byla zrušena',
            'Platbu jste nedokončili. Ceník zůstává otevřený, takže můžete pokračovat kdykoliv.',
            'info'
        );
    }

    history.replaceState({}, document.title, sanitizeRedirectUrl(window.location.href));
}

function renderRecommendationBanner(context) {
    const heroSubtitle = document.querySelector('.section--hero .hero__subtitle');
    if (!heroSubtitle) return;

    const planMeta = PLAN_META[context.recommendedPlan];
    if (!planMeta) return;

    const existing = document.getElementById('pricing-plan-recommendation');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'pricing-plan-recommendation';
    banner.style.cssText = 'max-width:760px;margin:1.25rem auto 0;padding:1rem 1.1rem;border-radius:18px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);text-align:left;';
    banner.innerHTML = `
        <div style="font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-mystic-gold);margin-bottom:0.45rem;">Doporučený další krok</div>
        <strong style="display:block;color:#fff;font-size:1rem;margin-bottom:0.35rem;">${planMeta.name}</strong>
        <p style="margin:0;color:rgba(255,255,255,0.78);line-height:1.6;">${planMeta.headline} ${planMeta.recommendedFor}</p>
    `;

    heroSubtitle.insertAdjacentElement('afterend', banner);
}

function highlightRecommendedPlan(planId) {
    if (!planId) return;

    document.querySelectorAll('.card--pricing').forEach((card) => {
        card.classList.remove('pricing-card--recommended');
        card.style.boxShadow = '';
    });

    const button = document.querySelector(`.plan-checkout-btn[data-plan="${planId}"]`);
    const card = button?.closest('.card--pricing');
    if (!card) return;

    card.classList.add('pricing-card--recommended');
    card.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.45), 0 18px 50px rgba(0,0,0,0.35)';
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function bindCheckoutButtons(context) {
    document.querySelectorAll('.plan-checkout-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const planId = button.dataset.plan;
            if (!planId) return;

            const isLoggedIn = !!window.Auth?.isLoggedIn?.();
            const checkoutContext = {
                source: context.source || 'pricing_page',
                feature: context.feature || null,
                redirect: '/cenik.html',
                authMode: 'register'
            };

            window.MH_ANALYTICS?.trackCTA?.('pricing_plan_cta', {
                label: button.textContent?.trim() || 'checkout',
                plan_id: planId,
                requires_auth: !isLoggedIn,
                destination: isLoggedIn ? 'stripe_checkout_session' : '/prihlaseni.html',
                source: checkoutContext.source,
                feature: checkoutContext.feature
            });

            window.Auth?.startPlanCheckout?.(planId, checkoutContext);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setPrices();
    updatePricingCopy();

    const context = resolveCheckoutContext();
    showPaymentReturnState(context);
    renderRecommendationBanner(context);

    window.MH_ANALYTICS?.trackPricingViewed?.(context.recommendedPlan, {
        source: context.source || 'pricing_page',
        feature: context.feature || null
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

    bindCheckoutButtons(context);

    if (context.source !== 'pricing_page' || context.feature || context.recommendedPlan !== 'pruvodce') {
        window.requestAnimationFrame(() => {
            highlightRecommendedPlan(context.recommendedPlan);
        });
    }
});
