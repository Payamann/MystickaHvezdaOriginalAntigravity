function getSafeLocalRedirect(value, fallback = null) {
    if (typeof value !== 'string') return fallback;
    const redirect = value.trim();
    if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')
        || redirect.includes('\\') || /[\u0000-\u001F\u007F]/.test(redirect)) {
        return fallback;
    }

    try {
        const target = new URL(redirect, window.location.origin);
        if (target.origin !== window.location.origin) return fallback;
        return `${target.pathname}${target.search}${target.hash}`;
    } catch {
        return fallback;
    }
}

function hasStoredAuthRedirect() {
    try {
        return Boolean(document.getElementById('login-form')?.dataset.authSubmitting
            || sessionStorage.getItem('pending_plan')
            || sessionStorage.getItem('post_auth_activation')
            || sessionStorage.getItem('post_auth_redirect_pending'));
    } catch {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const TERMS_VERSION = '2026-10-23';
    const PRIVACY_VERSION = '2026-08-28';
    const PLAN_COPY = {
        pruvodce: {
            title: 'Členství Mystické Hvězdy',
            copy: 'Odemkneš plné výklady, natální kartu a numerologii. Generované výklady podléhají provozním limitům.',
            trialDays: 7
        },
        osviceni: {
            title: 'Osvícení',
            copy: 'Pokračuješ k pokročilým nástrojům, jako je astrokartografie a hlubší osobní analýzy.',
            trialDays: 7
        },
        'vip-majestrat': {
            title: 'VIP Majestát',
            copy: 'Pokračuješ ke Keltskému kříži a nejhlubším výkladům.',
            trialDays: 0
        }
    };
    const planManifestById = new Map();

    const getPlanTrialDays = (planId) => {
        const manifestTrialDays = Number(planManifestById.get(planId)?.trialDays);
        if (Number.isFinite(manifestTrialDays)) return Math.max(0, manifestTrialDays);
        return Math.max(0, Number(PLAN_COPY[planId]?.trialDays || 0));
    };

    const getCheckoutPromiseCopy = (planId) => {
        const trialDays = getPlanTrialDays(planId);
        const plan = planManifestById.get(planId);
        const intervalLabel = plan?.interval === 'month'
            ? 'měsíc'
            : plan?.interval === 'year' ? 'rok' : '';
        const pricePeriod = plan?.priceLabel && intervalLabel
            ? `${plan.priceLabel}/${intervalLabel}`
            : '';
        const nextAction = isRegisterMode ? 'Po registraci' : 'Po přihlášení';

        if (trialDays > 0) {
            const trial = `${trialDays} dní zdarma${pricePeriod ? `, potom ${pricePeriod}` : ''}`;
            const paymentDetails = plan?.checkoutEnabled
                ? ' Kartu zadáš ve Stripe checkoutu před potvrzením.'
                : ' Cenu a podmínky uvidíš ve Stripe checkoutu před potvrzením.';
            return `${nextAction} přejdeš do bezpečného Stripe checkoutu: ${trial}.${paymentDetails}`;
        }

        return pricePeriod
            ? `${nextAction} přejdeš do bezpečného Stripe checkoutu za ${pricePeriod}. Cenu a podmínky uvidíš před potvrzením.`
            : `${nextAction} přejdeš do bezpečného Stripe checkoutu. Cenu a podmínky uvidíš před potvrzením.`;
    };

    const loadPlanManifest = async () => {
        try {
            const response = await fetch('/api/plans', { credentials: 'same-origin' });
            if (!response.ok) return;
            const manifest = await response.json();
            if (!manifest?.success || !Array.isArray(manifest.plans)) return;
            manifest.plans.forEach((plan) => planManifestById.set(plan.id, plan));
        } catch (error) {
            console.warn('[Auth] Using conservative fallback plan copy:', error.message);
        }
    };

    const FEATURE_LABELS = {
        account: 'Účet zdarma',
        astrocartography: 'Astrokartografie',
        daily_guidance: 'Denní vedení',
        weekly_horoscope: 'Týdenní horoskop',
        monthly_horoscope: 'Měsíční horoskop',
        horoskopy: 'Horoskopy',
        lunar_calendar: 'Lunární kalendář',
        zodiac_signs: 'Znamení zvěrokruhu',
        premium_membership: 'Premium členství',
        subscription_management: 'Správa předplatného',
        vip_membership: 'VIP členství',
        ritual_memory: 'Paměť rituálu',
        profile_history: 'Historie výkladů',
        another_reading: 'Navazující výklad',
        tarot: 'Tarot',
        tarot_yes_no: 'Tarot ano/ne',
        tarot_love: 'Tarot na lásku',
        tarot_daily_card_profile_save: 'Tarot karta dne',
        tarot_multi_card: 'Vícekartový tarot',
        dream_dictionary: 'Snář a výklad snů',
        daily_angel_card: 'Karta dne',
        andelske_karty_hluboky_vhled: 'Andělské karty',
        angel_numbers: 'Andělská čísla',
        synastry: 'Partnerská shoda',
        partnerska_detail: 'Detail partnerské shody',
        compatibility: 'Partnerská shoda',
        numerologie_vyklad: 'Numerologický výklad',
        numerology: 'Numerologický výklad',
        annual_horoscope: 'Osobní mapa',
        rocni_horoskop_2026: 'Osobní mapa',
        personal_map: 'Osobní mapa',
        osobni_mapa_2026: 'Osobní mapa na 12 měsíců',
        natalni_interpretace: 'Interpretace natální karty',
        runy_hluboky_vyklad: 'Hloubkový výklad run',
        shamanske_kolo_plne_cteni: 'Plné čtení šamanského kola',
        minuly_zivot: 'Minulý život',
        kristalova_koule: 'Křišťálová koule',
        rituals: 'Lunární rituály',
        mentor: 'Hvězdný průvodce',
        hvezdny_mentor: 'Hvězdný průvodce',
        angel_card_deep: 'Andělské karty',
        crystal_ball_unlimited: 'Křišťálová koule',
        journal_insights: 'Vzorce v deníku',
        medicine_wheel: 'Šamanské kolo',
        natal_chart: 'Natální karta',
        past_life: 'Minulý život',
        runes_deep_reading: 'Hloubkový výklad run',
        tarot_celtic_cross: 'Keltský kříž'
    };

    const SIGNUP_CONTEXT_BY_FEATURE = {
        account: {
            title: 'Účet bez zdržení',
            copy: 'Po registraci si vybereš, který výklad otevřeš jako první.',
            stepTitle: 'Vybereš si první krok',
            stepCopy: 'Horoskop, tarot i další nástroje najdeš v nabídce.'
        },
        premium_membership: {
            title: 'Členství bez ztráty kontextu',
            copy: 'Po registraci se vrátíš k nabídce členství, kterou máš otevřenou.',
            stepTitle: 'Vrátíš se k členství',
            stepCopy: 'Otevřená nabídka zůstane připravená i po registraci.'
        },
        subscription_management: {
            title: 'Správa členství',
            copy: 'Po vytvoření účtu se vrátíš ke správě členství v profilu.',
            stepTitle: 'Otevřeš nastavení členství',
            stepCopy: 'Členství a platby najdeš v nastavení svého profilu.'
        },
        vip_membership: {
            title: 'Členství bez ztráty kontextu',
            copy: 'Po registraci můžeš pokračovat ke členství s Keltským křížem a dalšími výklady.',
            stepTitle: 'Vrátíš se ke členství',
            stepCopy: 'Po registraci se vrátíš k otevřené nabídce.'
        },
        astrocartography: {
            title: 'Astrokartografie po registraci',
            copy: 'Po vytvoření účtu se vrátíš k astro mapě a místům, která tě astrologicky zajímají.',
            stepTitle: 'Vrátíš se k astro mapě',
            stepCopy: 'Navážeš na zvolený nástroj.'
        },
        daily_guidance: {
            title: 'Denní vedení po registraci',
            copy: 'Po vytvoření účtu se vrátíš na horoskopy a najdeš dnešní osobní vhled.',
            stepTitle: 'Vrátíš se na denní horoskopy',
            stepCopy: 'Začneš dnešním výhledem, bez dalšího hledání.'
        },
        horoskopy: {
            title: 'Osobní horoskopy po registraci',
            copy: 'Po vytvoření účtu se vrátíš na horoskopy a přečteš si dnešní vhled.',
            stepTitle: 'Vrátíš se na osobní horoskopy',
            stepCopy: 'Horoskop najdeš hned po registraci.'
        },
        weekly_horoscope: {
            title: 'Týdenní horoskop po registraci',
            copy: 'Po vytvoření účtu se vrátíš k horoskopům. Týdenní výhled je součástí členství.',
            stepTitle: 'Vrátíš se k horoskopům',
            stepCopy: 'Týdenní výhled otevřeš v rámci členství.'
        },
        monthly_horoscope: {
            title: 'Měsíční horoskop po registraci',
            copy: 'Po vytvoření účtu se vrátíš k horoskopům. Měsíční výhled je součástí členství.',
            stepTitle: 'Vrátíš se k horoskopům',
            stepCopy: 'Měsíční výhled otevřeš v rámci členství.'
        },
        lunar_calendar: {
            title: 'Lunární kalendář po registraci',
            copy: 'Po vytvoření účtu se vrátíš k lunárnímu kalendáři a najdeš praktický tip pro dnešní fázi.',
            stepTitle: 'Vrátíš se k lunárnímu kalendáři',
            stepCopy: 'Najdeš tu dnešní rytmus i praktický krok.'
        },
        zodiac_signs: {
            title: 'Znamení zvěrokruhu po registraci',
            copy: 'Po vytvoření účtu se vrátíš k přehledu znamení a vybereš si to své.',
            stepTitle: 'Vrátíš se k přehledu znamení',
            stepCopy: 'Navážeš na téma, které už máš otevřené, a najdeš své znamení.'
        },
        ritual_memory: {
            title: 'Paměť rituálu po registraci',
            copy: 'S účtem se můžeš vracet k výkladům, reflexím i tématům, která se opakují.',
            stepTitle: 'Otevřeš svůj profil',
            stepCopy: 'Najdeš v něm výklady a můžeš navázat vlastní reflexí.'
        },
        profile_history: {
            title: 'Historie výkladů po registraci',
            copy: 'S účtem můžeš ukládat výklady, zpětnou vazbu i večerní reflexe.',
            stepTitle: 'Otevřeš svou historii',
            stepCopy: 'K uloženým výkladům se můžeš kdykoli vrátit.'
        },
        another_reading: {
            title: 'Navazující výklad po registraci',
            copy: 'Po vytvoření účtu se vrátíš k dalšímu výkladu i k označenému tématu.',
            stepTitle: 'Otevřeš další výklad',
            stepCopy: 'Naváže na předchozí téma a tvoji zpětnou vazbu.'
        },
        tarot: {
            title: 'Tarotový výklad po registraci',
            copy: 'Po vytvoření účtu se vrátíš k tarotu a položíš svou otázku.',
            stepTitle: 'Otevřeš tarotový výklad',
            stepCopy: 'Navážeš na otázku, se kterou přicházíš.'
        },
        tarot_yes_no: {
            title: 'Uložíš výklad do Deníku',
            copy: 'Po registraci se vrátíš do profilu a odpověď z Tarotu ano/ne se uloží do Deníku výkladů.',
            stepTitle: 'Otevřeš Deník výkladů',
            stepCopy: 'Otázka, karta i odpověď zůstanou pohromadě, takže se k nim můžeš vrátit.'
        },
        tarot_love: {
            title: 'Tarot na lásku po registraci',
            copy: 'Po vytvoření účtu se vrátíš k tématu vztahu a můžeš pokračovat hlubším výkladem.',
            stepTitle: 'Vrátíš se k tarotu na lásku',
            stepCopy: 'Registrace zachová otázku, se kterou přicházíš.'
        },
        dream_dictionary: {
            title: 'Výklad snu po registraci',
            copy: 'Po vytvoření účtu navážeš na symbol, který hledáš, a můžeš pokračovat osobním výkladem.',
            stepTitle: 'Vrátíš se k výkladu snu',
            stepCopy: 'Motiv snu zůstane součástí dalšího kroku.'
        },
        tarot_daily_card_profile_save: {
            title: 'Ulož si kartu dne do profilu',
            copy: 'Vytvoř si účet zdarma a vrať se ke stejné kartě dne i jejímu výkladu.',
            stepTitle: 'Vrátíš se ke kartě dne',
            stepCopy: 'Stejný symbol si po registraci můžeš uložit do profilu.'
        },
        tarot_multi_card: {
            title: 'Vícekartový tarot po registraci',
            copy: 'Po vytvoření účtu se vrátíš k tarotu a můžeš pokračovat hlubším výkladem.',
            stepTitle: 'Otevřeš vícekartový tarot',
            stepCopy: 'Navážeš na vybraný výklad.'
        },
        daily_angel_card: {
            title: 'Karta dne po registraci',
            copy: 'Po vytvoření účtu se vrátíš k dennímu symbolu z úvodní stránky a navážeš na něj v Andělských kartách.',
            stepTitle: 'Vrátíš se ke kartě dne',
            stepCopy: 'Zůstaneš u symbolu, který tě zaujal.'
        },
        andelske_karty_hluboky_vhled: {
            title: 'Andělské karty po registraci',
            copy: 'Po vytvoření účtu se vrátíš k andělským kartám a můžeš pokračovat hlubším výkladem.',
            stepTitle: 'Vrátíš se k andělským kartám',
            stepCopy: 'Navážeš na svůj výklad a jeho téma.'
        },
        partnerska_detail: {
            title: 'Partnerská shoda po registraci',
            copy: 'Po vytvoření účtu se vrátíš k partnerské shodě.',
            stepTitle: 'Otevřeš partnerskou shodu',
            stepCopy: 'Pokračuješ rovnou u svého výběru.'
        },
        natalni_interpretace: {
            title: 'Natální karta po registraci',
            copy: 'Po vytvoření účtu se vrátíš k natální kartě a její osobní interpretaci.',
            stepTitle: 'Otevřeš natální kartu',
            stepCopy: 'Datum narození doplníš až v nástroji, který ho potřebuje.'
        },
        numerologie_vyklad: {
            title: 'Numerologie po registraci',
            copy: 'Po vytvoření účtu se vrátíš k numerologii a osobnímu výkladu.',
            stepTitle: 'Otevřeš numerologii',
            stepCopy: 'První vhled najdeš přímo v nástroji.'
        },
        annual_horoscope: {
            title: 'Osobní mapa po registraci',
            copy: 'Roční horoskop už nenabízíme. Po vytvoření účtu se vrátíš k Osobní mapě.',
            stepTitle: 'Otevřeš Osobní mapu',
            stepCopy: 'Navážeš na jednorázový PDF výklad.'
        },
        personal_map: {
            title: 'Osobní mapa po registraci',
            copy: 'Po vytvoření účtu se vrátíš k Osobní mapě a jejímu rozboru tvého směru.',
            stepTitle: 'Otevřeš Osobní mapu',
            stepCopy: 'Vrátíš se k výstupu, který máš otevřený.'
        },
        runy_hluboky_vyklad: {
            title: 'Runy po registraci',
            copy: 'Po vytvoření účtu se vrátíš k runám a můžeš pokračovat hlubším výkladem.',
            stepTitle: 'Otevřeš runový výklad',
            stepCopy: 'Navážeš na svou původní otázku.'
        },
        shamanske_kolo_plne_cteni: {
            title: 'Šamanské kolo po registraci',
            copy: 'Po vytvoření účtu se vrátíš k šamanskému kolu a můžeš pokračovat v plném výkladu.',
            stepTitle: 'Otevřeš šamanské kolo',
            stepCopy: 'Navážeš na vybraný výklad.'
        },
        minuly_zivot: {
            title: 'Minulý život po registraci',
            copy: 'Po vytvoření účtu se vrátíš k symbolickému výkladu minulého života a můžeš pokračovat.',
            stepTitle: 'Otevřeš výklad minulého života',
            stepCopy: 'Čeká tě archetypální příběh k zamyšlení, ne předpověď.'
        },
        kristalova_koule: {
            title: 'Křišťálová koule po registraci',
            copy: 'Po vytvoření účtu se vrátíš ke křišťálové kouli a položíš svou otázku.',
            stepTitle: 'Otevřeš křišťálovou kouli',
            stepCopy: 'Po registraci se vrátíš rovnou ke své otázce.'
        },
        mentor: {
            title: 'Hvězdný průvodce po registraci',
            copy: 'Po vytvoření účtu se vrátíš k průvodci a položíš svou otázku.',
            stepTitle: 'Otevřeš Hvězdného průvodce',
            stepCopy: 'Začneš otázkou, která tě právě zajímá.'
        }
    };

    Object.assign(SIGNUP_CONTEXT_BY_FEATURE, {
        hvezdny_mentor: SIGNUP_CONTEXT_BY_FEATURE.mentor,
        angel_card_deep: SIGNUP_CONTEXT_BY_FEATURE.andelske_karty_hluboky_vhled,
        angel_numbers: SIGNUP_CONTEXT_BY_FEATURE.andelske_karty_hluboky_vhled,
        crystal_ball_unlimited: SIGNUP_CONTEXT_BY_FEATURE.kristalova_koule,
        compatibility: SIGNUP_CONTEXT_BY_FEATURE.partnerska_detail,
        journal_insights: SIGNUP_CONTEXT_BY_FEATURE.mentor,
        medicine_wheel: SIGNUP_CONTEXT_BY_FEATURE.shamanske_kolo_plne_cteni,
        natal_chart: SIGNUP_CONTEXT_BY_FEATURE.natalni_interpretace,
        numerology: SIGNUP_CONTEXT_BY_FEATURE.numerologie_vyklad,
        osobni_mapa_2026: SIGNUP_CONTEXT_BY_FEATURE.personal_map,
        rocni_horoskop_2026: SIGNUP_CONTEXT_BY_FEATURE.personal_map,
        past_life: SIGNUP_CONTEXT_BY_FEATURE.minuly_zivot,
        runes_deep_reading: SIGNUP_CONTEXT_BY_FEATURE.runy_hluboky_vyklad,
        synastry: SIGNUP_CONTEXT_BY_FEATURE.partnerska_detail,
        tarot_celtic_cross: SIGNUP_CONTEXT_BY_FEATURE.tarot_multi_card,
        rituals: {
            title: 'Lunární rituály po registraci',
            copy: 'Po vytvoření účtu se vrátíš k rituálům a můžeš začít praxí podle aktuálního rytmu.',
            stepTitle: 'Otevřeš lunární rituály',
            stepCopy: 'První krok vede rovnou k praxi.'
        }
    });

    const SIGNUP_CONTEXT_BY_SOURCE = {
        homepage_hero: SIGNUP_CONTEXT_BY_FEATURE.tarot_yes_no,
        pricing_free_cta: {
            title: 'Začneš denním horoskopem',
            copy: 'Po registraci otevřeš dnešní horoskop a přečteš si svůj první vhled.',
            stepTitle: 'Otevřeš bezplatný denní vhled',
            stepCopy: 'Další znamení a období najdeš v přehledu horoskopů.'
        },
        homepage_pricing_free_cta: {
            title: 'Začneš denním horoskopem',
            copy: 'Po registraci otevřeš denní horoskopy a vybereš si své znamení.',
            stepTitle: 'Otevřeš denní horoskopy',
            stepCopy: 'Přehled znamení i období zůstane dostupný v nabídce.'
        },
        newsletter_form: SIGNUP_CONTEXT_BY_FEATURE.daily_guidance,
        newsletter_popup: SIGNUP_CONTEXT_BY_FEATURE.daily_guidance,
        tarot_daily_card_profile_save: SIGNUP_CONTEXT_BY_FEATURE.tarot_daily_card_profile_save
    };

    const SIGNUP_CONTEXT_BY_REDIRECT = {
        '/horoskopy.html': SIGNUP_CONTEXT_BY_FEATURE.daily_guidance,
        '/tarot.html': SIGNUP_CONTEXT_BY_FEATURE.tarot,
        '/andelske-karty.html': SIGNUP_CONTEXT_BY_FEATURE.andelske_karty_hluboky_vhled,
        '/partnerska-shoda.html': SIGNUP_CONTEXT_BY_FEATURE.partnerska_detail,
        '/natalni-karta.html': SIGNUP_CONTEXT_BY_FEATURE.natalni_interpretace,
        '/numerologie.html': SIGNUP_CONTEXT_BY_FEATURE.numerologie_vyklad,
        '/rocni-horoskop.html': SIGNUP_CONTEXT_BY_FEATURE.personal_map,
        '/osobni-mapa.html': SIGNUP_CONTEXT_BY_FEATURE.personal_map,
        '/mentor.html': SIGNUP_CONTEXT_BY_FEATURE.mentor
    };

    const GENERIC_SIGNUP_CONTEXT = {
        title: 'Vybereš si, čím začít',
        copy: 'Po registraci otevřeš profil a zvolíš výklad nebo nástroj.',
        stepTitle: 'Vybereš si první krok',
        stepCopy: 'Horoskop, tarot i další nástroje najdeš v nabídce.'
    };

    const loginForm = document.getElementById('login-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const resetSuccessLoginLink = document.getElementById('reset-success-login-link');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backToLoginBtn = document.getElementById('back-to-login');
    const loginHeader = document.getElementById('login-page-title');
    const loginSubtitle = document.getElementById('login-page-subtitle');
    const resetLinkNotice = document.getElementById('reset-link-notice');
    const authModeWrapper = document.getElementById('auth-mode-toggle')?.parentElement;
    const authSubmitBtn = document.getElementById('auth-submit');
    const toggleBtn = document.getElementById('auth-mode-toggle');
    const socialProofEl = document.getElementById('login-social-proof');
    const passwordInput = document.getElementById('password');
    const passwordHelp = document.getElementById('password-help');
    const registerFields = document.getElementById('register-fields');
    const gdprWrapper = document.getElementById('gdpr-consent-wrapper');
    const gdprConsent = document.getElementById('gdpr-consent');
    const signupValuePanel = document.getElementById('signup-value-panel');
    const signupNextStepTitle = document.getElementById('signup-next-step-title');
    const signupNextStepCopy = document.getElementById('signup-next-step-copy');
    const signupSafetyNote = document.getElementById('signup-safety-note');
    const checkoutContextBanner = document.getElementById('checkout-context-banner');
    const checkoutContextLabel = document.getElementById('checkout-context-label');
    const checkoutContextTitle = document.getElementById('checkout-context-title');
    const checkoutContextCopy = document.getElementById('checkout-context-copy');
    const checkoutExistingAccount = document.getElementById('checkout-existing-account');
    const urlParams = new URLSearchParams(window.location.search);

    // Auth.startPlanCheckout() always appends `plan=` when it sends a user here to
    // resume a paid checkout after login/register. If this page loads WITHOUT a
    // `plan` param, the current visit has nothing to do with a plan (e.g. a plain
    // header "Registrace" link) — so any pending_plan left in sessionStorage from
    // an earlier, abandoned checkout attempt must be dropped. Otherwise a stale
    // value silently hijacks an unrelated registration/login straight into Stripe
    // checkout with no way back.
    if (!urlParams.has('plan')) {
        window.Auth?.clearPendingCheckout?.();
    }

    const isResetMode = urlParams.get('reset') === 'true';
    const resetSuccessHistoryKey = 'mhPasswordResetConfirmedAt';
    const hash = window.location.hash;
    const resetHashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const hasResetProviderError = ['error', 'error_code', 'error_description'].some((key) => (
        resetHashParams.has(key) || urlParams.has(key)
    ));
    const resetProviderErrorCode = resetHashParams.get('error_code') || urlParams.get('error_code') || '';
    const resetAccessToken = resetHashParams.get('access_token') || '';
    const resetTokenType = (resetHashParams.get('type') || '').toLowerCase();
    const hasRecoveryToken = Boolean(resetAccessToken) && resetTokenType === 'recovery';
    const hasRecentResetSuccessInHistoryEntry = () => {
        const storedAt = Number(window.history.state?.[resetSuccessHistoryKey]);
        return Number.isFinite(storedAt)
            && storedAt <= Date.now()
            && Date.now() - storedAt < 10 * 60 * 1000;
    };
    let isRegisterMode = urlParams.get('mode') === 'register' || urlParams.get('registrace') === '1';
    const redirectTarget = getSafeLocalRedirect(urlParams.get('redirect'), '/profil.html');
    const hasExplicitCheckoutContext = urlParams.has('plan') || urlParams.has('feature') || urlParams.has('source');
    const pendingPlan = !hasExplicitCheckoutContext
        ? (window.Auth?.getPendingCheckoutPlan?.() || sessionStorage.getItem('pending_plan') || null)
        : null;
    const pendingContext = !hasExplicitCheckoutContext
        ? (window.Auth?.getPendingCheckoutContext?.() || {})
        : {};
    const requestedPlan = urlParams.get('plan') || pendingPlan;
    const requestedFeature = urlParams.get('feature') || pendingContext.feature || null;
    const requestedSource = urlParams.get('source') || pendingContext.source || null;
    const requestedBillingInterval = urlParams.get('billing_interval')
        || urlParams.get('billingInterval')
        || pendingContext.billing_interval
        || pendingContext.billingInterval
        || null;
    const requestedEmail = urlParams.get('email') || '';
    const authFlowStorageKey = 'mh_checkout_auth_flow';
    const authFlowContext = [requestedPlan, requestedSource, requestedFeature, requestedBillingInterval]
        .filter(Boolean)
        .join('|');
    const createAuthFlowId = () => {
        if (!requestedPlan) return null;
        try {
            const stored = JSON.parse(sessionStorage.getItem(authFlowStorageKey) || 'null');
            if (stored?.context === authFlowContext && typeof stored.id === 'string') return stored.id;
        } catch {}

        const id = typeof globalThis.crypto?.randomUUID === 'function'
            ? globalThis.crypto.randomUUID()
            : `mh_auth_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        try {
            sessionStorage.setItem(authFlowStorageKey, JSON.stringify({ context: authFlowContext, id }));
        } catch {}
        return id;
    };
    const authFlowId = createAuthFlowId();

    const hasPendingAuthRedirect = hasStoredAuthRedirect;

    const setBlockVisible = (element, visible) => {
        if (!element) return;
        element.hidden = !visible;
        element.classList.toggle('mh-block-visible', visible);
    };

    const getFormUx = () => window.MH_FORM_UX || {};

    const setFieldError = (field, message) => {
        if (!field) return;
        field.setCustomValidity(message || '');
        getFormUx().setFieldError?.(field, message);
    };

    const clearFieldError = (field) => {
        if (!field) return;
        field.setCustomValidity('');
        getFormUx().clearFieldError?.(field);
    };

    const showAuthError = (message, field = null) => {
        getFormUx().setFormSummary?.(loginForm, message);
        if (field) {
            getFormUx().setFieldError?.(field, message);
            field.focus({ preventScroll: true });
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        window.Auth?.showToast?.('Chyba', message, 'error');
    };

    const clearAuthErrors = () => {
        getFormUx().clearFormSummary?.(loginForm);
        [passwordInput, gdprConsent].forEach(clearFieldError);
    };

    const clearAuthModeErrors = () => {
        getFormUx().clearFormSummary?.(loginForm);
        loginForm?.querySelectorAll('input, select, textarea').forEach((field) => {
            clearFieldError(field);
        });
    };

    const focusAuthField = (field) => {
        if (!field) return;
        field.focus({ preventScroll: true });
        field.scrollIntoView({ behavior: 'auto', block: 'center' });
    };

    const toggleAriaDescription = (element, descriptionId, include) => {
        if (!element || !descriptionId) return;

        const descriptions = new Set((element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        if (include) descriptions.add(descriptionId);
        else descriptions.delete(descriptionId);

        if (descriptions.size) element.setAttribute('aria-describedby', Array.from(descriptions).join(' '));
        else element.removeAttribute('aria-describedby');
    };

    const clearResetCallbackFromUrl = () => {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.hash = '';
        ['error', 'error_code', 'error_description'].forEach((key) => cleanUrl.searchParams.delete(key));
        window.history.replaceState(window.history.state, '', `${cleanUrl.pathname}${cleanUrl.search}`);
    };

    const clearResetSuccessHistoryState = () => {
        const state = window.history.state;
        if (!state || typeof state !== 'object' || Array.isArray(state) || !(resetSuccessHistoryKey in state)) return;

        const nextState = { ...state };
        delete nextState[resetSuccessHistoryKey];
        window.history.replaceState(nextState, '', window.location.href);
    };

    const markResetSuccessHistoryState = () => {
        const state = window.history.state;
        const nextState = state && typeof state === 'object' && !Array.isArray(state)
            ? { ...state }
            : {};
        nextState[resetSuccessHistoryKey] = Date.now();
        window.history.replaceState(nextState, '', window.location.href);
    };

    const showResetRecoveryHelp = (message) => {
        setBlockVisible(loginForm, false);
        setBlockVisible(resetPasswordForm, false);
        setBlockVisible(resetSuccessLoginLink, false);
        setBlockVisible(forgotPasswordForm, true);
        setBlockVisible(forgotPasswordLink, false);
        setBlockVisible(authModeWrapper, false);
        setBlockVisible(resetLinkNotice, true);
        if (loginHeader) loginHeader.textContent = 'Obnovení hesla';
        if (loginSubtitle) loginSubtitle.textContent = 'Obnovu můžeš bezpečně spustit znovu.';
        if (resetLinkNotice) {
            resetLinkNotice.setAttribute('role', 'alert');
            resetLinkNotice.textContent = message;
        }
        clearResetCallbackFromUrl();
        focusAuthField(document.getElementById('forgot-email'));
    };

    const verifyRecoveryLink = async (token) => {
        setBlockVisible(loginForm, false);
        setBlockVisible(forgotPasswordForm, false);
        setBlockVisible(resetPasswordForm, false);
        setBlockVisible(resetSuccessLoginLink, false);
        setBlockVisible(authModeWrapper, false);
        setBlockVisible(resetLinkNotice, true);
        if (loginHeader) loginHeader.textContent = 'Obnovení hesla';
        if (loginSubtitle) loginSubtitle.textContent = 'Kontroluji platnost odkazu pro obnovu hesla.';
        if (resetLinkNotice) {
            resetLinkNotice.setAttribute('role', 'status');
            resetLinkNotice.textContent = 'Ověřuji odkaz pro obnovu hesla…';
        }

        try {
            const response = await fetch('/api/auth/reset-password/validate', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            const data = await response.json().catch(() => null);

            if (response.ok && data?.valid === true) {
                setBlockVisible(resetLinkNotice, false);
                setBlockVisible(resetPasswordForm, true);
                if (loginSubtitle) loginSubtitle.textContent = 'Zadej nové heslo. Platnost odkazu jsme ověřili.';
                focusAuthField(document.getElementById('new-password'));
                return;
            }

            if (response.status === 401) {
                showResetRecoveryHelp('Odkaz pro obnovu už není platný. Zadej e-mail a vyžádej si nový.');
                return;
            }

            showResetRecoveryHelp('Odkaz se teď nepodařilo ověřit. Zkus to později nebo požádej o nový.');
        } catch {
            showResetRecoveryHelp('Odkaz se teď nepodařilo ověřit. Zkontroluj připojení a zkus to znovu.');
        }
    };

    const showResetSuccessState = () => {
        setBlockVisible(loginForm, false);
        setBlockVisible(forgotPasswordForm, false);
        setBlockVisible(resetPasswordForm, false);
        setBlockVisible(forgotPasswordLink, false);
        setBlockVisible(authModeWrapper, false);
        setBlockVisible(resetLinkNotice, true);
        setBlockVisible(resetSuccessLoginLink, true);
        if (loginHeader) loginHeader.textContent = 'Heslo bylo změněno';
        if (loginSubtitle) loginSubtitle.textContent = 'Nové heslo je uložené.';
        if (resetLinkNotice) {
            resetLinkNotice.setAttribute('role', 'status');
            resetLinkNotice.textContent = 'Teď se můžeš přihlásit novým heslem. Tato změna se potvrdila přímo na serveru.';
        }
        clearResetCallbackFromUrl();
        focusAuthField(resetSuccessLoginLink);
    };

    // Back/forward between same-document history entries does not rerun the
    // initializer. Restore the success message only for the entry that carries
    // the server-confirmed marker; a fresh reset URL remains unconfirmed.
    window.addEventListener('popstate', () => {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('reset') !== 'true'
            || currentUrl.hash
            || !hasRecentResetSuccessInHistoryEntry()) return;

        showResetSuccessState();
    });

    // Sdílená hláška: použije ji i nativní validace přes setCustomValidity, aby GDPR
    // checkbox neukazoval generické "Vyplňte prosím toto pole", ale tuhle konkrétní.
    const GDPR_CONSENT_MESSAGE = 'Pro vytvoření účtu potvrď souhlas se zpracováním údajů a obchodní podmínky.';

    const syncGdprValidity = () => {
        if (gdprConsent) {
            gdprConsent.setCustomValidity(gdprConsent.checked ? '' : GDPR_CONSENT_MESSAGE);
        }
    };

    const validateRegisterFields = () => {
        if (!isRegisterMode) return true;

        if (passwordInput && passwordInput.value.length < 8) {
            const message = 'Heslo musí mít alespoň 8 znaků.';
            setFieldError(passwordInput, message);
            showAuthError(message, passwordInput);
            return false;
        }

        if (gdprConsent && !gdprConsent.checked) {
            setFieldError(gdprConsent, GDPR_CONSENT_MESSAGE);
            showAuthError(GDPR_CONSENT_MESSAGE, gdprConsent);
            return false;
        }

        clearAuthErrors();
        return true;
    };

    const getSafeRedirectTarget = () => redirectTarget;

    const buildCheckoutAuthStepPayload = (eventName, step, extraMetadata = {}) => {
        if (!requestedPlan) return null;

        const pendingMetadata = pendingContext.metadata && typeof pendingContext.metadata === 'object' && !Array.isArray(pendingContext.metadata)
            ? pendingContext.metadata
            : {};
        const metadata = {
            ...pendingMetadata,
            path: window.location.pathname,
            redirect: getSafeRedirectTarget(),
            auth_mode: isRegisterMode ? 'register' : 'login',
            step,
            ...extraMetadata
        };

        if (authFlowId) metadata.auth_flow_id = authFlowId;
        if (requestedBillingInterval) metadata.billing_interval = requestedBillingInterval;
        if (!metadata.entry_source && requestedSource) metadata.entry_source = requestedSource;
        if (!metadata.entry_feature && requestedFeature) metadata.entry_feature = requestedFeature;

        return {
            eventName,
            source: requestedSource || pendingContext.source || 'auth_pending_plan',
            feature: requestedFeature || pendingContext.feature || null,
            planId: requestedPlan,
            metadata
        };
    };

    const trackCheckoutAuthStep = (eventName, step, extraMetadata = {}) => {
        const payload = buildCheckoutAuthStepPayload(eventName, step, extraMetadata);
        if (!payload) return;

        const queueRetry = () => {
            const queuedId = window.Auth?.queueCheckoutFunnelEvent?.(payload);
            if (!queuedId || typeof window.Auth?.flushPendingCheckoutAuthRequiredEvents !== 'function') {
                return;
            }

            window.setTimeout(() => {
                window.Auth?.flushPendingCheckoutAuthRequiredEvents?.();
            }, 250);
        };

        try {
            const sender = window.Auth?.sendServerFunnelEvent;
            if (typeof sender !== 'function') {
                queueRetry();
                return;
            }

            const sent = sender.call(window.Auth, payload);
            if (sent && typeof sent.catch === 'function') {
                sent.then((success) => {
                    if (!success) queueRetry();
                }).catch(error => {
                    queueRetry();
                    console.warn('[FUNNEL] Could not record checkout auth step:', error.message);
                });
            } else if (!sent) {
                queueRetry();
            }
        } catch (error) {
            queueRetry();
            console.warn('[FUNNEL] Could not record checkout auth step:', error.message);
        }
    };

    const trackAuthAnalytics = (methodName, ...args) => {
        const method = window.MH_ANALYTICS?.[methodName];
        if (typeof method !== 'function') {
            return false;
        }

        try {
            method.apply(window.MH_ANALYTICS, args);
            return true;
        } catch (error) {
            console.warn(`[AUTH] ${methodName} analytics failed:`, error?.message || error);
            return false;
        }
    };

    const getGrowthLoop = () => window.MH_GROWTH_LOOP || null;

    const getFeatureLabel = (feature) => {
        if (!feature) return null;
        return FEATURE_LABELS[feature] || getGrowthLoop()?.getFeatureLabel?.(feature, feature) || feature;
    };

    const getManifestSignupContext = () => {
        const activation = getGrowthLoop()?.getPostSignupActivation?.({
            source: requestedSource,
            feature: requestedFeature,
            redirect: getSafeRedirectTarget()
        });
        if (!activation?.featureId) return null;

        const label = getFeatureLabel(activation.featureId);
        if (!label) return null;

        return {
            title: `${label} po registraci`,
            copy: 'Po vytvoření účtu přejdeš rovnou k prvnímu konkrétnímu kroku.',
            stepTitle: `Otevřeš: ${label}`,
            stepCopy: 'Registrace zachová, odkud přicházíš, a naváže na vybraný nástroj.'
        };
    };

    const getSignupContext = () => (
        SIGNUP_CONTEXT_BY_FEATURE[requestedFeature]
        || SIGNUP_CONTEXT_BY_SOURCE[requestedSource]
        || SIGNUP_CONTEXT_BY_REDIRECT[getSafeRedirectTarget()]
        || getManifestSignupContext()
        || GENERIC_SIGNUP_CONTEXT
    );

    const renderSignupValuePanel = () => {
        const context = getSignupContext();
        if (signupNextStepTitle) signupNextStepTitle.textContent = context.stepTitle;
        if (signupNextStepCopy) signupNextStepCopy.textContent = context.stepCopy;
    };

    const shouldShowSignupContext = () => isRegisterMode && (
        requestedFeature
        || requestedSource
        || getSafeRedirectTarget() !== '/profil.html'
    );

    const renderCheckoutContext = () => {
        if (!checkoutContextBanner) return;

        const plan = requestedPlan ? PLAN_COPY[requestedPlan] : null;
        const featureLabel = getFeatureLabel(requestedFeature);

        if (plan) {
            if (checkoutContextTitle) checkoutContextTitle.textContent = plan.title;
            if (checkoutContextCopy) {
                const checkoutPromise = getCheckoutPromiseCopy(requestedPlan);
                checkoutContextCopy.textContent = featureLabel
                    ? `Navazuješ na funkci: ${featureLabel}. ${plan.copy} ${checkoutPromise}`
                    : `${plan.copy} ${checkoutPromise}`;
            }
            if (checkoutContextLabel) {
                checkoutContextLabel.textContent = requestedSource ? 'Pokračuješ k odemčení' : 'Pokračuješ k plánu';
            }
            setBlockVisible(checkoutContextBanner, true);
            return;
        }

        if (!shouldShowSignupContext()) {
            setBlockVisible(checkoutContextBanner, false);
            return;
        }

        const context = getSignupContext();
        if (checkoutContextLabel) checkoutContextLabel.textContent = featureLabel || 'První hodnota';
        if (checkoutContextTitle) checkoutContextTitle.textContent = context.title;
        if (checkoutContextCopy) checkoutContextCopy.textContent = context.copy;
        setBlockVisible(checkoutContextBanner, true);
    };

    const trackAuthView = (source = 'page_load') => {
        trackAuthAnalytics('trackAuthViewed', isRegisterMode ? 'register' : 'login', {
            source,
            redirect_target: redirectTarget,
            pending_plan: pendingPlan
        });
        if (source === 'page_load') {
            trackCheckoutAuthStep('checkout_auth_page_viewed', 'auth_page_viewed');
        }
    };

    const bindPasswordToggles = () => {
        document.querySelectorAll('[data-password-toggle]').forEach((button) => {
            if (button.dataset.bound === 'true') return;
            button.dataset.bound = 'true';

            button.addEventListener('click', () => {
                const input = document.getElementById(button.dataset.passwordToggle);
                if (!input) return;

                const nextType = input.type === 'password' ? 'text' : 'password';
                input.type = nextType;
                const isVisible = nextType === 'text';
                button.textContent = isVisible ? 'Skrýt' : 'Zobrazit';
                button.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
                button.setAttribute('aria-label', isVisible ? 'Skrýt heslo' : 'Zobrazit heslo');
            });
        });
    };

    const applyMode = () => {
        if (!authSubmitBtn) {
            return;
        }

        document.body.classList.toggle('auth-register-mode', isRegisterMode);
        document.body.classList.toggle('auth-checkout-plan-mode', Boolean(requestedPlan));

        if (forgotPasswordLink) {
            setBlockVisible(forgotPasswordLink, !isRegisterMode);
        }

        if (isRegisterMode) {
            renderSignupValuePanel();
            if (requestedPlan) {
                const trialDays = getPlanTrialDays(requestedPlan);
                if (loginHeader) loginHeader.textContent = 'Vytvoř si účet a pokračuj k odemčení';
                if (loginSubtitle) {
                    loginSubtitle.textContent = trialDays > 0
                        ? `Účet slouží ke správě předplatného a zabere přibližně 30 vteřin. Prvních ${trialDays} dní je zdarma — kartu zadáš až ve Stripe checkoutu a předplatné zrušíš v profilu.`
                        : 'Účet slouží ke správě předplatného a zabere přibližně 30 vteřin. Kartu zadáš až ve Stripe checkoutu, kde před potvrzením uvidíš cenu i období.';
                }
            } else {
                if (loginHeader) loginHeader.textContent = 'Vytvoř si účet zdarma';
                if (loginSubtitle) loginSubtitle.textContent = 'Stačí e-mail a heslo. Platební kartu nevyžadujeme.';
            }
            if (signupSafetyNote) {
                const trialDays = requestedPlan ? getPlanTrialDays(requestedPlan) : 0;
                signupSafetyNote.textContent = requestedPlan
                    ? trialDays > 0
                        ? `Po registraci přejdeš do bezpečného Stripe checkoutu s ${trialDays} dny zdarma. Výklady slouží jako osobní inspirace a nenahrazují odbornou péči.`
                        : 'Po registraci přejdeš do bezpečného Stripe checkoutu. Cenu a období uvidíš před potvrzením. Výklady slouží jako osobní inspirace a nenahrazují odbornou péči.'
                    : 'Výklady slouží jako osobní inspirace a nenahrazují odbornou péči.';
            }
            setBlockVisible(socialProofEl, false);
            setBlockVisible(signupValuePanel, !requestedPlan && !shouldShowSignupContext());
            setBlockVisible(passwordHelp, true);
            setBlockVisible(signupSafetyNote, true);
            setBlockVisible(registerFields, false);
            setBlockVisible(gdprWrapper, true);
            if (passwordInput) {
                passwordInput.autocomplete = 'new-password';
                passwordInput.minLength = 8;
                toggleAriaDescription(passwordInput, passwordHelp?.id, true);
            }
            if (gdprConsent) {
                gdprConsent.required = true;
                syncGdprValidity();
            }
            authSubmitBtn.textContent = requestedPlan ? 'Vytvořit účet a pokračovat' : 'Vytvořit účet zdarma';
            if (toggleBtn) toggleBtn.textContent = 'Už máš účet? Přihlas se';
        } else {
            if (requestedPlan) {
                if (loginHeader) loginHeader.textContent = 'Přihlas se a pokračuj k odemčení';
                if (loginSubtitle) loginSubtitle.textContent = 'Po přihlášení se vrátíš k vybranému členství a otevřeš bezpečný Stripe checkout.';
            } else {
                if (loginHeader) loginHeader.textContent = 'Vítej zpět';
                if (loginSubtitle) loginSubtitle.textContent = 'Přihlas se ke svému účtu a pokračuj.';
            }
            setBlockVisible(socialProofEl, false);
            setBlockVisible(signupValuePanel, false);
            setBlockVisible(passwordHelp, false);
            setBlockVisible(signupSafetyNote, false);
            setBlockVisible(registerFields, false);
            setBlockVisible(gdprWrapper, false);
            if (passwordInput) {
                passwordInput.autocomplete = 'current-password';
                passwordInput.removeAttribute('minlength');
                toggleAriaDescription(passwordInput, passwordHelp?.id, false);
            }
            if (gdprConsent) {
                gdprConsent.required = false;
                gdprConsent.checked = false;
                gdprConsent.setCustomValidity('');
            }
            authSubmitBtn.textContent = requestedPlan ? 'Přihlásit se a pokračovat' : 'Přihlásit se';
            if (toggleBtn) toggleBtn.textContent = 'Nemáš účet? Zaregistruj se zdarma →';
        }

        setBlockVisible(checkoutExistingAccount, Boolean(requestedPlan && isRegisterMode));

        const emailInput = document.getElementById('email');
        if (emailInput && requestedEmail && !emailInput.value) {
            emailInput.value = requestedEmail;
        }

        renderCheckoutContext();
    };

    bindPasswordToggles();

    passwordInput?.addEventListener('input', () => {
        clearFieldError(passwordInput);
        getFormUx().clearFormSummary?.(loginForm);
    });

    gdprConsent?.addEventListener('change', () => {
        clearFieldError(gdprConsent);
        getFormUx().clearFormSummary?.(loginForm);
        syncGdprValidity();
    });

    let authFormStartedTracked = false;
    const ensureAuthFormStarted = (trigger = 'input') => {
        if (authFormStartedTracked || !requestedPlan) return;
        authFormStartedTracked = true;
        trackCheckoutAuthStep('checkout_auth_form_started', 'auth_form_started', { trigger });
    };

    // Programové zaostření e-mailu při načtení není skutečný začátek formuláře.
    // První zápis uživatele (nebo explicitní submit pokus pro password manager)
    // dává page_view → form_started metriku, kterou lze opravdu interpretovat.
    loginForm?.addEventListener('input', event => {
        if (!event.target?.matches?.('input')) return;
        ensureAuthFormStarted('field_input');
    });

    let validationFailureTracked = false;
    loginForm?.addEventListener('invalid', event => {
        if (validationFailureTracked || !requestedPlan) return;
        validationFailureTracked = true;
        queueMicrotask(() => {
            validationFailureTracked = false;
        });

        const invalidField = event.target;
        trackCheckoutAuthStep('checkout_auth_validation_failed', 'native_validation_failed');
        trackAuthAnalytics('trackEvent', 'auth_validation_failed', {
            auth_mode: isRegisterMode ? 'register' : 'login',
            field: invalidField?.name || invalidField?.id || 'unknown',
            source: requestedSource,
            feature: requestedFeature,
            plan_id: requestedPlan
        });
    }, true);

    if (isResetMode) {
        const hasRecentResetSuccess = hasRecentResetSuccessInHistoryEntry();
        if (!hasRecentResetSuccess) clearResetSuccessHistoryState();

        if (hasRecentResetSuccess && !hash) {
            showResetSuccessState();
        } else {
            clearResetSuccessHistoryState();
            setBlockVisible(loginForm, false);
            setBlockVisible(forgotPasswordLink, false);
            setBlockVisible(authModeWrapper, false);
            setBlockVisible(resetLinkNotice, false);
            setBlockVisible(resetSuccessLoginLink, false);
            if (loginHeader) loginHeader.textContent = 'Obnovení hesla';

            if (hasRecoveryToken && !hasResetProviderError) {
                void verifyRecoveryLink(resetAccessToken);
            } else {
                const isExpiredLink = resetProviderErrorCode === 'otp_expired';
                const message = isExpiredLink
                    ? 'Odkaz pro obnovu hesla vypršel nebo už byl použit. Zadej e-mail a pošleme ti nový odkaz.'
                    : hasResetProviderError
                        ? 'Tento odkaz pro obnovu hesla nefunguje. Zadej e-mail a požádej o nový odkaz.'
                        : 'Otevřel se formulář obnovy bez ověřovacího odkazu. Zadej e-mail a pošleme ti nový.';
                // Supabase error fragments can contain provider details. The helper
                // removes them from the address bar after showing a safe explanation.
                showResetRecoveryHelp(message);
            }
        }
    } else {
        clearResetSuccessHistoryState();
        applyMode();
        void loadPlanManifest().then(applyMode);
        trackAuthView();

        const emailField = document.getElementById('email');
        if (emailField && !emailField.value) {
            emailField.focus();
        }
    }

    loginForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        ensureAuthFormStarted('submit_attempt');

        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value || '';

        if (!window.Auth || !authSubmitBtn) {
            return;
        }

        clearAuthErrors();
        if (!loginForm.checkValidity()) {
            loginForm.reportValidity();
            return;
        }

        if (!validateRegisterFields()) {
            trackCheckoutAuthStep('checkout_auth_validation_failed', 'register_validation_failed');
            return;
        }

        trackCheckoutAuthStep(
            'checkout_auth_form_submitted',
            isRegisterMode ? 'register_form_submitted' : 'login_form_submitted'
        );

        authSubmitBtn.disabled = true;
        loginForm.dataset.authSubmitting = 'true';
        const originalText = authSubmitBtn.textContent;
        const submittedMode = isRegisterMode ? 'register' : 'login';
        authSubmitBtn.textContent = isRegisterMode ? 'Registruji...' : 'Přihlašuji...';

        try {
            if (isRegisterMode) {
                if (password.length < 8) {
                    throw new Error('Heslo musí mít alespoň 8 znaků.');
                }

                const result = await window.Auth.register(email, password, {
                    gdpr_consent: gdprConsent?.checked === true,
                    terms_consent: gdprConsent?.checked === true
                });

                if (!result.success) {
                    trackCheckoutAuthStep('checkout_auth_request_failed', 'register_request_failed', {
                        reason_code: result.code || 'REGISTRATION_FAILED',
                        retryable: Boolean(result.retryAfter)
                    });

                    if (result.code === 'REGISTRATION_RECOVERY_REQUIRED') {
                        isRegisterMode = false;
                        syncAuthModeInUrl();
                        applyMode();
                        const emailInput = document.getElementById('email');
                        if (emailInput) emailInput.value = email;
                        if (passwordInput) passwordInput.value = '';
                        getFormUx().setFormSummary?.(
                            loginForm,
                            'Tento e-mail může být spojený s existujícím účtem. Přepnuli jsme tě na přihlášení — zadej heslo, nebo použij obnovu hesla.'
                        );
                        passwordInput?.focus({ preventScroll: true });
                        passwordInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        trackAuthView('registration_recovery');
                        return;
                    }

                    throw new Error(result.error || 'Registrace se nepodařila.');
                }

                if (!result.analyticsTracked) {
                    trackAuthAnalytics('trackAuthCompleted', 'register', {
                        method: 'email',
                        redirect_target: redirectTarget,
                        pending_plan: pendingPlan
                    });
                }
            } else {
                const result = await window.Auth.login(email, password);
                if (!result.success) {
                    trackCheckoutAuthStep('checkout_auth_request_failed', 'login_request_failed', {
                        reason_code: result.code || 'LOGIN_FAILED',
                        retryable: Boolean(result.retryAfter)
                    });
                    throw new Error(result.error || 'Přihlášení se nepodařilo.');
                }

                if (!result.analyticsTracked) {
                    trackAuthAnalytics('trackAuthCompleted', 'login', {
                        method: 'email',
                        redirect_target: redirectTarget,
                        pending_plan: pendingPlan
                    });
                }

                window.Auth.showToast?.('Vítej zpět', 'Přihlášení proběhlo úspěšně.', 'success');
            }
        } catch (error) {
            getFormUx().setFormSummary?.(loginForm, error.message);
            window.Auth.showToast?.('Chyba', error.message, 'error');
        } finally {
            authSubmitBtn.disabled = false;
            delete loginForm.dataset.authSubmitting;
            if ((isRegisterMode ? 'register' : 'login') === submittedMode) {
                authSubmitBtn.textContent = originalText;
            } else {
                applyMode();
            }
        }
    });

    forgotPasswordLink?.addEventListener('click', () => {
        clearAuthModeErrors();
        setBlockVisible(resetLinkNotice, false);
        setBlockVisible(loginForm, false);
        setBlockVisible(forgotPasswordForm, true);
        setBlockVisible(forgotPasswordLink, false);
        setBlockVisible(authModeWrapper, false);
        if (loginHeader) loginHeader.textContent = 'Zapomenuté heslo';
        if (loginSubtitle) loginSubtitle.textContent = 'Pošleme ti odkaz pro nastavení nového hesla.';
        focusAuthField(document.getElementById('forgot-email'));
    });

    backToLoginBtn?.addEventListener('click', () => {
        setBlockVisible(resetLinkNotice, false);
        if (isResetMode) {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('reset');
            cleanUrl.hash = '';
            window.history.replaceState(window.history.state, '', `${cleanUrl.pathname}${cleanUrl.search}`);
        }
        setBlockVisible(loginForm, true);
        setBlockVisible(forgotPasswordForm, false);
        setBlockVisible(authModeWrapper, true);
        applyMode();
        focusAuthField(document.getElementById('email'));
    });

    forgotPasswordForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('forgot-email')?.value;
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent;

        if (!submitBtn) {
            return;
        }

        submitBtn.textContent = 'Odesílám...';
        submitBtn.disabled = true;

        try {
            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                window.trackEvent?.('password_reset_requested', {
                    source: 'forgot_password_form'
                });
                window.Auth?.showToast?.('E-mail odeslán', data.message, 'success');
                backToLoginBtn?.click();
            } else {
                throw new Error(data.error || 'Nepodařilo se odeslat e-mail s obnovou hesla.');
            }
        } catch (error) {
            window.Auth?.showToast?.('Chyba', error.message, 'error');
        } finally {
            submitBtn.textContent = originalText || 'Odeslat odkaz pro obnovu';
            submitBtn.disabled = false;
        }
    });

    resetPasswordForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newPassword = document.getElementById('new-password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;

        if (newPassword !== confirmPassword) {
            const confirmField = document.getElementById('confirm-password');
            getFormUx().setFieldError?.(confirmField, 'Hesla se neshodují.');
            getFormUx().setFormSummary?.(resetPasswordForm, 'Hesla se neshodují.');
            confirmField?.focus({ preventScroll: true });
            window.Auth?.showToast?.('Chyba', 'Hesla se neshodují.', 'error');
            return;
        }

        const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent;

        if (!submitBtn) {
            return;
        }

        submitBtn.textContent = 'Ukládám...';
        submitBtn.disabled = true;

        try {
            if (!hasRecoveryToken || hasResetProviderError) {
                throw new Error('Odkaz pro obnovu hesla není platný. Požádej o nový odkaz.');
            }

            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${resetAccessToken}`,
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json();

            if (data.success) {
                window.trackEvent?.('password_reset_completed', {
                    source: 'reset_password_form'
                });
                markResetSuccessHistoryState();
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                showResetSuccessState();
            } else {
                const errorMessage = data.error || 'Nepodařilo se změnit heslo.';
                const invalidRecoveryLink = response.status === 401
                    || /(?:odkaz|token).*(?:neplat|vypršel|expired|invalid)|(?:expired|invalid).*(?:link|token)/i.test(errorMessage);
                if (invalidRecoveryLink) {
                    showResetRecoveryHelp('Odkaz pro obnovu hesla už není platný. Zadej e-mail a požádej o nový odkaz.');
                    return;
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            window.Auth?.showToast?.('Chyba', error.message, 'error');
        } finally {
            submitBtn.textContent = originalText || 'Nastavit nové heslo';
            submitBtn.disabled = false;
        }
    });

    function syncAuthModeInUrl() {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('mode', isRegisterMode ? 'register' : 'login');
        window.history.replaceState(window.history.state, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    }

    toggleBtn?.addEventListener('click', () => {
        clearAuthModeErrors();
        isRegisterMode = !isRegisterMode;
        syncAuthModeInUrl();
        applyMode();
        focusAuthField(document.getElementById('email'));
        trackAuthView('toggle');
    });

    checkoutExistingAccount?.addEventListener('click', () => {
        clearAuthModeErrors();
        isRegisterMode = false;
        syncAuthModeInUrl();
        applyMode();
        trackAuthView('checkout_existing_account');
        focusAuthField(document.getElementById('email'));
    });

    setTimeout(() => {
        if (isResetMode) return;

        if (window.Auth?.isLoggedIn()) {
            if (hasPendingAuthRedirect()) {
                return;
            }

            const redirect = urlParams.get('redirect');
            const safeRedirect = getSafeLocalRedirect(redirect, null);
            if (safeRedirect) {
                window.location.href = safeRedirect;
            } else {
                window.location.href = '/profil.html';
            }
        }
    }, 500);
});

document.addEventListener('auth:changed', () => {
    if (new URLSearchParams(window.location.search).get('reset') === 'true') return;

    if (window.Auth?.isLoggedIn()) {
        // getPostVerificationCheckout guards the login recovery flow: right after a
        // login, Auth.loginSuccess may be about to resume an interrupted checkout
        // stored in localStorage. Redirecting to /profil.html here would race with
        // (and usually kill) that checkout navigation — loginSuccess owns the
        // redirect in that case and clears the entry itself.
        if (hasStoredAuthRedirect()
            || window.Auth?.getPostVerificationCheckout?.()) {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const redirect = getSafeLocalRedirect(urlParams.get('redirect'), '/profil.html');

        if (!redirect.includes('prihlaseni')) {
            window.location.href = redirect;
        }
    }
});
