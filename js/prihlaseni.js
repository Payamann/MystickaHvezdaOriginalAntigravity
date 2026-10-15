function hasStoredAuthRedirect() {
    try {
        return Boolean(sessionStorage.getItem('pending_plan')
            || sessionStorage.getItem('post_auth_activation')
            || sessionStorage.getItem('post_auth_redirect_pending'));
    } catch {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const TERMS_VERSION = '2026-08-28';
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

    const getPlanPriceLabel = (planId) => {
        const plan = planManifestById.get(planId);
        if (!plan) return '';
        const amount = typeof plan.priceLabel === 'string' && plan.priceLabel.trim()
            ? plan.priceLabel.trim()
            : typeof plan.priceCzk === 'number' && Number.isFinite(plan.priceCzk)
                ? `${new Intl.NumberFormat('cs-CZ').format(plan.priceCzk)} Kč`
                : '';
        if (!amount) return '';
        const period = plan.interval === 'month' ? '/měsíc' : plan.interval === 'year' ? '/rok' : '';
        return `${amount}${period}`;
    };

    const getCheckoutPromiseCopy = (planId, registerMode = isRegisterMode) => {
        const trialDays = getPlanTrialDays(planId);
        const priceLabel = getPlanPriceLabel(planId);
        const priceCopy = priceLabel
            ? `${trialDays > 0 ? 'Po zkoušce' : 'Cena členství:'} ${priceLabel}.`
            : 'Cenu a období uvidíš ve Stripe před potvrzením.';
        if (registerMode) {
            return trialDays > 0
                ? `Po registraci otevřeme bezpečný checkout s ${trialDays} dny zdarma. Kartu zadáš až ve Stripe checkoutu. ${priceCopy}`
                : `Po registraci otevřeme bezpečný checkout. ${priceCopy}`;
        }
        return `Po přihlášení otevřeme bezpečný checkout. ${trialDays > 0 ? `Zkušební období má ${trialDays} dní; jeho dostupnost potvrdí checkout. ` : ''}${priceCopy}`;
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
            title: 'Účet zdarma bez zdržení',
            copy: 'Po registraci tě provedeme prvním nastavením a pošleme k osobnímu výkladu, který dává smysl jako první.',
            stepTitle: 'Otevřeme první osobní krok',
            stepCopy: 'Začneš krátkým výběrem znamení a hned potom konkrétním výkladem.'
        },
        premium_membership: {
            title: 'Premium bez přerušení',
            copy: 'Po registraci tě vrátíme k vybranému plánu, aby šlo pokračovat bez hledání.',
            stepTitle: 'Vrátíme tě k vybranému plánu',
            stepCopy: 'Vybraný plán zůstane zachovaný, takže další krok bude jasný.'
        },
        subscription_management: {
            title: 'Předplatné bez přerušení',
            copy: 'Po přihlášení nebo registraci se vrátíš ke správě předplatného a dalšímu kroku kolem plánu.',
            stepTitle: 'Vrátíme tě ke správě plánu',
            stepCopy: 'Vybraný plán zůstane zachovaný i po přihlášení nebo registraci.'
        },
        vip_membership: {
            title: 'Členství bez přerušení',
            copy: 'Po registraci můžeš pokračovat ke členství s Keltským křížem a dalšími výklady.',
            stepTitle: 'Vrátíme tě ke členství',
            stepCopy: 'Neztratíš cestu z úvodní stránky ani vybraný plán.'
        },
        astrocartography: {
            title: 'Astrokartografie po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k astro mapě a místům, která s tebou astrologicky rezonují.',
            stepTitle: 'Otevřeme astro mapu',
            stepCopy: 'Začneš nástrojem, který tě sem přivedl.'
        },
        daily_guidance: {
            title: 'Denní vedení po registraci',
            copy: 'Po vytvoření účtu tě pošleme rovnou na horoskopy, kde získáš první osobní vhled.',
            stepTitle: 'Otevřeme denní horoskopy',
            stepCopy: 'Začneš tím nejrychlejším: dnešním vedením bez čekání.'
        },
        horoskopy: {
            title: 'Osobní horoskopy po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat na horoskopy a vezmeš si první denní vhled.',
            stepTitle: 'Otevřeme osobní horoskopy',
            stepCopy: 'První výklad přijde hned po registraci, ne až na stránce profilu.'
        },
        weekly_horoscope: {
            title: 'Týdenní horoskop po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k horoskopům a můžeš otevřít širší týdenní vedení.',
            stepTitle: 'Otevřeme horoskopy',
            stepCopy: 'Začneš denním vhledem a snadno přejdeš na týdenní vedení.'
        },
        monthly_horoscope: {
            title: 'Měsíční horoskop po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k horoskopům a můžeš otevřít širší měsíční vedení.',
            stepTitle: 'Otevřeme horoskopy',
            stepCopy: 'Začneš denním vhledem a snadno přejdeš na měsíční vedení.'
        },
        lunar_calendar: {
            title: 'Lunární kalendář po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k lunárnímu kalendáři a vezmeš si z dnešní fáze jeden praktický krok.',
            stepTitle: 'Otevřeme lunární kalendář',
            stepCopy: 'Začneš konkrétním rytmem dne, ne prázdnou stránkou.'
        },
        zodiac_signs: {
            title: 'Znamení zvěrokruhu po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k přehledu znamení a můžeš si vybrat osobní vstup do horoskopů.',
            stepTitle: 'Otevřeme znamení zvěrokruhu',
            stepCopy: 'Navážeš na otevřené téma a rychle najdeš vlastní znamení.'
        },
        ritual_memory: {
            title: 'Paměť rituálu po registraci',
            copy: 'Po vytvoření účtu se budeš vracet k výkladům, reflexím a tématům, která se opravdu opakují.',
            stepTitle: 'Otevřeme osobní profil',
            stepCopy: 'Profil nebude prázdný archiv. Povede tě k prvnímu výkladu, reflexi a návratu k tématům.'
        },
        profile_history: {
            title: 'Historie výkladů po registraci',
            copy: 'Po vytvoření účtu budeš mít místo, kam ukládat výklady, zpětnou vazbu a večerní reflexe.',
            stepTitle: 'Otevřeme osobní historii',
            stepCopy: 'Výklady nepůjdou do ztracena. Profil je propojí s dalším konkrétním krokem.'
        },
        another_reading: {
            title: 'Navazující výklad po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k dalšímu výkladu bez ztráty právě zvoleného tématu.',
            stepTitle: 'Otevřeme další výklad',
            stepCopy: 'Zpětná vazba se neztratí a další výklad naváže na předchozí signál.'
        },
        tarot: {
            title: 'Tarotový výklad po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k tarotu a můžeš si rovnou položit první otázku.',
            stepTitle: 'Otevřeme tarotový výklad',
            stepCopy: 'Navážeš přímo na svůj záměr.'
        },
        tarot_yes_no: {
            title: 'Uložíme výklad do Deníku',
            copy: 'Po registraci se vrátíš do profilu a odpověď z Tarotu ano/ne přidáme do Deníku výkladů.',
            stepTitle: 'Otevřeme Deník výkladů',
            stepCopy: 'Otázka, karta i odpověď zůstanou pohromadě, takže se k nim můžeš vrátit.'
        },
        tarot_love: {
            title: 'Tarot na lásku po registraci',
            copy: 'Po vytvoření účtu se vrátíš k tématu vztahu a můžeš pokračovat v hlubším výkladu.',
            stepTitle: 'Otevřeme tarot na lásku',
            stepCopy: 'Registrace zachová tvůj vztahový záměr.'
        },
        dream_dictionary: {
            title: 'Výklad snu po registraci',
            copy: 'Po vytvoření účtu navážeš na symbol, který tě sem přivedl, a můžeš pokračovat k osobnímu výkladu.',
            stepTitle: 'Vrátíme tě k výkladu snu',
            stepCopy: 'Hlavní motiv snu zůstane součástí dalšího osobního kroku.'
        },
        tarot_daily_card_profile_save: {
            title: 'Ulož si kartu dne do profilu',
            copy: 'Vytvoř si účet zdarma a vrať se ke stejné kartě dne, aby nezmizela jako jednorázový náhodný vhled.',
            stepTitle: 'Vrátíme tě ke kartě dne',
            stepCopy: 'Po registraci pokračuješ u stejného symbolu a můžeš si výklad uložit do profilu.'
        },
        tarot_multi_card: {
            title: 'Vícekartový tarot po registraci',
            copy: 'Po vytvoření účtu se vrátíš k tarotu a můžeš pokračovat v hlubším výkladu.',
            stepTitle: 'Otevřeme vícekartový tarot',
            stepCopy: 'Registrace naváže na výklad, který si chceš odemknout.'
        },
        daily_angel_card: {
            title: 'Karta dne po registraci',
            copy: 'Po vytvoření účtu se vrátíš k dennímu symbolu z úvodní stránky a navážeš na něj v Andělských kartách.',
            stepTitle: 'Vrátíme tě k dennímu symbolu',
            stepCopy: 'Karta dne zůstane dostupná i po registraci.'
        },
        andelske_karty_hluboky_vhled: {
            title: 'Andělské karty po registraci',
            copy: 'Po vytvoření účtu se vrátíš k andělským kartám a můžeš pokračovat v hlubším výkladu.',
            stepTitle: 'Vrátíme tě k andělským kartám',
            stepCopy: 'Registrace zachová téma výkladu a otevře další krok.'
        },
        partnerska_detail: {
            title: 'Partnerská shoda po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k partnerské shodě bez hledání správné stránky.',
            stepTitle: 'Otevřeme partnerskou shodu',
            stepCopy: 'Začneš rovnou tam, kde vzniká první osobní výsledek.'
        },
        natalni_interpretace: {
            title: 'Natální karta po registraci',
            copy: 'Po vytvoření účtu tě navedeme na natální kartu a první osobní interpretaci.',
            stepTitle: 'Otevřeme natální kartu',
            stepCopy: 'Datum narození doplníte až v nástroji, který ho opravdu potřebuje.'
        },
        numerologie_vyklad: {
            title: 'Numerologie po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k numerologii a prvnímu osobnímu výkladu.',
            stepTitle: 'Otevřeme numerologii',
            stepCopy: 'První vhled dostaneš z konkrétního nástroje, ne z prázdné stránky.'
        },
        annual_horoscope: {
            title: 'Osobní mapa po registraci',
            copy: 'Roční horoskop už nenabízíme. Po vytvoření účtu budeš pokračovat k hlubší Osobní mapě.',
            stepTitle: 'Otevřeme Osobní mapu',
            stepCopy: 'Navážeš na jednorázový hlubší PDF výklad místo obecného profilu.'
        },
        personal_map: {
            title: 'Osobní mapa po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k osobní mapě a hlubšímu rozboru vlastního směru.',
            stepTitle: 'Otevřeme osobní mapu',
            stepCopy: 'Registrace tě vrátí k hlubšímu výstupu, který na této stránce čeká.'
        },
        runy_hluboky_vyklad: {
            title: 'Runy po registraci',
            copy: 'Po vytvoření účtu se vrátíš k runám a můžeš pokračovat v hlubším výkladu.',
            stepTitle: 'Otevřeme runový výklad',
            stepCopy: 'Registrace naváže na tvoji otázku.'
        },
        shamanske_kolo_plne_cteni: {
            title: 'Šamanské kolo po registraci',
            copy: 'Po vytvoření účtu se vrátíš k šamanskému kolu a můžeš pokračovat v plném čtení.',
            stepTitle: 'Otevřeme šamanské kolo',
            stepCopy: 'Navážeš na zvolený výklad.'
        },
        minuly_zivot: {
            title: 'Minulý život po registraci',
            copy: 'Po vytvoření účtu se vrátíš k symbolickému výkladu minulého života a můžeš pokračovat bez ztráty tématu.',
            stepTitle: 'Otevřeme minulý život',
            stepCopy: 'Začneš archetypálním příběhem pro sebereflexi, ne tvrdým slibem.'
        },
        kristalova_koule: {
            title: 'Křišťálová koule po registraci',
            copy: 'Po vytvoření účtu se vrátíš ke křišťálové kouli a můžeš položit první osobní otázku.',
            stepTitle: 'Otevřeme křišťálovou kouli',
            stepCopy: 'Registrace tě vrátí k otázce, ne na prázdnou stránku profilu.'
        },
        mentor: {
            title: 'Hvězdný průvodce po registraci',
            copy: 'Po vytvoření účtu budeš pokračovat k průvodci a můžeš položit první otázku.',
            stepTitle: 'Otevřeme Hvězdného průvodce',
            stepCopy: 'První kontakt s produktem začne okamžitou otázkou.'
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
            copy: 'Po vytvoření účtu budeš pokračovat k rituálům a můžeš začít osobní praxí podle aktuálního rytmu.',
            stepTitle: 'Otevřeme lunární rituály',
            stepCopy: 'První krok povede rovnou k praxi, ne do prázdného profilu.'
        }
    });

    const SIGNUP_CONTEXT_BY_SOURCE = {
        homepage_hero: SIGNUP_CONTEXT_BY_FEATURE.tarot_yes_no,
        pricing_free_cta: {
            title: 'Začínáte zdarma',
            copy: 'Vytvoříš si účet bez platební karty a potom tě pošleme na první denní horoskop.',
            stepTitle: 'Otevřeme bezplatný denní vhled',
            stepCopy: 'Uvidíš, co účet zdarma umí, dřív než začneš řešit placený plán.'
        },
        homepage_pricing_free_cta: {
            title: 'Začínáte zdarma',
            copy: 'Vytvoříš si účet bez platební karty a potom pokračuješ k dennímu vedení.',
            stepTitle: 'Otevřeme denní horoskopy',
            stepCopy: 'První vhled přijde hned po registraci.'
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
        title: 'Účet zdarma bez zdržení',
        copy: 'Po registraci tě navedeme k prvnímu osobnímu výkladu. Nepotřebujeme platební kartu ani dlouhý dotazník.',
        stepTitle: 'Otevřeme první osobní výklad',
        stepCopy: 'Začneš konkrétním výkladem, ne prázdnou stránkou.'
    };

    const loginForm = document.getElementById('login-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backToLoginBtn = document.getElementById('back-to-login');
    const loginHeader = document.getElementById('login-page-title');
    const loginSubtitle = document.getElementById('login-page-subtitle');
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
    const hash = window.location.hash;
    let isRegisterMode = urlParams.get('mode') === 'register' || urlParams.get('registrace') === '1';
    const redirectTarget = urlParams.get('redirect') || '/profil.html';
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
            field.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        window.Auth?.showToast?.('Chyba', message, 'error');
    };

    const clearAuthErrors = () => {
        [loginForm, forgotPasswordForm, resetPasswordForm].forEach((form) => {
            getFormUx().clearFormSummary?.(form);
            form?.querySelectorAll('input, select, textarea').forEach(clearFieldError);
        });
    };

    const getFriendlyAuthError = (error, fallback) => {
        const raw = String(error?.message || '').trim();
        if (!raw || /unexpected token|not valid json|json parse|failed to fetch|networkerror|network request failed/i.test(raw)) {
            return fallback;
        }
        return raw;
    };

    const focusAndReveal = (element) => {
        if (!element) return;
        if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
        requestAnimationFrame(() => {
            element.focus({ preventScroll: true });
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

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

    const getSafeRedirectTarget = () => (
        redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
            ? redirectTarget
            : '/profil.html'
    );

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
            copy: 'Po vytvoření účtu budeš pokračovat k prvnímu konkrétnímu kroku bez návratu do obecného katalogu.',
            stepTitle: `Otevřeme ${label}`,
            stepCopy: 'Registrace zachová původní téma a naváže rovnou prvním výkladem.'
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
        if (signupNextStepTitle) signupNextStepTitle.textContent = normalizeSignupCopy(context.stepTitle);
        if (signupNextStepCopy) signupNextStepCopy.textContent = normalizeSignupCopy(context.stepCopy);
    };

    const normalizeSignupCopy = (text) => String(text || '')
        .replace(/\bvás\b/g, 'tě')
        .replace(/\bVás\b/g, 'Tě')
        .replace(/\bvám\b/g, 'tobě')
        .replace(/\bVám\b/g, 'Tobě')
        .replace(/\bbudete\b/g, 'budeš')
        .replace(/\bBudete\b/g, 'Budeš')
        .replace(/\bzačnete\b/g, 'začneš')
        .replace(/\bZačnete\b/g, 'Začneš')
        .replace(/\bneztratíte\b/g, 'neztratíš')
        .replace(/\bNeztratíte\b/g, 'Neztratíš')
        .replace(/\bjste\b/g, 'jsi')
        .replace(/\bJste\b/g, 'Jsi');

    const renderCheckoutContext = () => {
        if (!checkoutContextBanner) return;

        const plan = requestedPlan ? PLAN_COPY[requestedPlan] : null;
        const featureLabel = getFeatureLabel(requestedFeature);

        if (plan) {
            if (checkoutContextTitle) checkoutContextTitle.textContent = plan.title;
            if (checkoutContextCopy) {
                const checkoutPromise = getCheckoutPromiseCopy(requestedPlan, isRegisterMode);
                checkoutContextCopy.textContent = featureLabel
                    ? `Navazuješ na funkci: ${featureLabel}. ${plan.copy} ${checkoutPromise}`
                    : `${plan.copy} ${checkoutPromise}`;
            }
            if (checkoutContextLabel) {
                checkoutContextLabel.textContent = requestedSource ? 'Pokračuješ k odemčení' : 'Pokračuješ k vybranému plánu';
            }
            setBlockVisible(checkoutContextBanner, true);
            return;
        }

        const shouldShowActivationContext = isRegisterMode && (
            requestedFeature
            || requestedSource
            || getSafeRedirectTarget() !== '/profil.html'
        );

        if (!shouldShowActivationContext) {
            setBlockVisible(checkoutContextBanner, false);
            return;
        }

        const context = getSignupContext();
        if (checkoutContextLabel) checkoutContextLabel.textContent = featureLabel || 'Další krok';
        if (checkoutContextTitle) checkoutContextTitle.textContent = normalizeSignupCopy(context.title);
        if (checkoutContextCopy) checkoutContextCopy.textContent = normalizeSignupCopy(context.copy);
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
                if (loginSubtitle) loginSubtitle.textContent = 'Stačí e-mail a heslo. Platební kartu nevyžadujeme a osobní údaje doplníš až u výkladu, který je opravdu potřebuje.';
            }
            if (signupSafetyNote) {
                const trialDays = requestedPlan ? getPlanTrialDays(requestedPlan) : 0;
                signupSafetyNote.textContent = requestedPlan
                    ? trialDays > 0
                        ? `Po registraci otevřeme bezpečný Stripe checkout s ${trialDays} dny zdarma. Výklady slouží jako osobní inspirace a nenahrazují odbornou péči.`
                        : 'Po registraci otevřeme bezpečný Stripe checkout. Cenu a období uvidíš před potvrzením. Výklady slouží jako osobní inspirace a nenahrazují odbornou péči.'
                    : 'Registrace je zdarma a bez platební karty. Výklady slouží jako osobní inspirace a nenahrazují odbornou péči.';
            }
            setBlockVisible(socialProofEl, true);
            setBlockVisible(signupValuePanel, !requestedPlan);
            setBlockVisible(passwordHelp, true);
            setBlockVisible(signupSafetyNote, true);
            setBlockVisible(registerFields, false);
            setBlockVisible(gdprWrapper, true);
            if (passwordInput) {
                passwordInput.autocomplete = 'new-password';
                passwordInput.minLength = 8;
            }
            if (gdprConsent) {
                gdprConsent.required = true;
                syncGdprValidity();
            }
            authSubmitBtn.textContent = requestedPlan ? 'Vytvořit účet a pokračovat' : 'Vytvořit účet zdarma';
            if (toggleBtn) toggleBtn.textContent = 'Máš účet? Přihlas se';
        } else {
            if (requestedPlan) {
                if (loginHeader) loginHeader.textContent = 'Přihlas se a pokračuj k odemčení';
                if (loginSubtitle) loginSubtitle.textContent = 'Po přihlášení zachováme vybraný plán a otevřeme bezpečný Stripe checkout.';
            } else {
                if (loginHeader) loginHeader.textContent = 'Vítej zpět';
                if (loginSubtitle) loginSubtitle.textContent = 'Přihlas se a otevři svoje uložené výklady.';
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
            }
            if (gdprConsent) {
                gdprConsent.required = false;
                gdprConsent.checked = false;
                gdprConsent.setCustomValidity('');
            }
            authSubmitBtn.textContent = requestedPlan ? 'Přihlásit se a pokračovat' : 'Přihlásit se';
            if (toggleBtn) toggleBtn.textContent = 'Nemáš účet? Vytvoř si ho zdarma →';
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

    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const recoveryError = hashParams.get('error_code') || hashParams.get('error_description') || hashParams.get('error');
    const accessToken = hashParams.get('access_token');
    const hasValidRecoveryInput = isResetMode && Boolean(accessToken) && !recoveryError;

    if (hasValidRecoveryInput) {
        setBlockVisible(loginForm, false);
        setBlockVisible(forgotPasswordForm, false);
        setBlockVisible(resetPasswordForm, true);
        setBlockVisible(forgotPasswordLink, false);
        setBlockVisible(authModeWrapper, false);
        if (loginHeader) loginHeader.textContent = 'Obnovení hesla';
        if (loginSubtitle) loginSubtitle.textContent = 'Zadej nové heslo a vrať se zpět do svého účtu.';
    } else if (isResetMode) {
        setBlockVisible(loginForm, false);
        setBlockVisible(resetPasswordForm, false);
        setBlockVisible(forgotPasswordForm, true);
        setBlockVisible(forgotPasswordLink, false);
        setBlockVisible(authModeWrapper, false);
        if (loginHeader) loginHeader.textContent = 'Obnova hesla';
        if (loginSubtitle) {
            loginSubtitle.textContent = recoveryError
                ? 'Tento odkaz už není platný. Požádej o nový odkaz pro obnovu hesla.'
                : 'Pro obnovu hesla zadej e-mail a pošleme ti nový odkaz.';
        }
        getFormUx().setFormSummary?.(
            forgotPasswordForm,
            recoveryError
                ? 'Odkaz pro obnovu hesla vypršel nebo už byl použit. Zadej e-mail a vyžádej si nový.'
                : 'Chybí platný odkaz pro obnovu hesla. Zadej e-mail a vyžádej si nový.'
        );
        focusAndReveal(forgotPasswordForm?.querySelector('input'));
    } else {
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
            const message = getFriendlyAuthError(error, 'Přihlášení se teď nepodařilo. Zkus to znovu za chvíli.');
            getFormUx().setFormSummary?.(loginForm, message);
            window.Auth.showToast?.('Chyba', message, 'error');
        } finally {
            authSubmitBtn.disabled = false;
            if ((isRegisterMode ? 'register' : 'login') === submittedMode) {
                authSubmitBtn.textContent = originalText;
            } else {
                applyMode();
            }
        }
    });

    forgotPasswordLink?.addEventListener('click', () => {
        setBlockVisible(loginForm, false);
        setBlockVisible(forgotPasswordForm, true);
        setBlockVisible(forgotPasswordLink, false);
        setBlockVisible(authModeWrapper, false);
        if (loginHeader) loginHeader.textContent = 'Zapomenuté heslo';
        if (loginSubtitle) loginSubtitle.textContent = 'Pošleme ti odkaz pro nastavení nového hesla.';
    });

    backToLoginBtn?.addEventListener('click', () => {
        setBlockVisible(loginForm, true);
        setBlockVisible(forgotPasswordForm, false);
        setBlockVisible(authModeWrapper, true);
        applyMode();
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

            const data = await response.json().catch(() => null);

            if (response.ok && data?.success) {
                window.trackEvent?.('password_reset_requested', {
                    source: 'forgot_password_form'
                });
                window.Auth?.showToast?.('E-mail odeslán', data.message, 'success');
                backToLoginBtn?.click();
            } else {
                throw new Error(data?.error || 'Nepodařilo se odeslat e-mail s obnovou hesla.');
            }
        } catch (error) {
            const message = getFriendlyAuthError(error, 'Odkaz pro obnovu se teď nepodařilo odeslat. Zkus to znovu za chvíli.');
            getFormUx().setFormSummary?.(forgotPasswordForm, message);
            window.Auth?.showToast?.('Chyba', message, 'error');
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
            if (!accessToken) {
                throw new Error('Neplatný odkaz pro obnovení hesla.');
            }

            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json().catch(() => null);

            if (response.ok && data?.success) {
                window.trackEvent?.('password_reset_completed', {
                    source: 'reset_password_form'
                });
                window.Auth?.showToast?.('Hotovo', 'Heslo bylo změněno. Teď se můžeš přihlásit.', 'success');
                window.location.href = '/prihlaseni.html';
            } else {
                throw new Error(data?.error || 'Nepodařilo se změnit heslo.');
            }
        } catch (error) {
            const message = getFriendlyAuthError(error, 'Heslo se teď nepodařilo změnit. Zkus to znovu za chvíli.');
            getFormUx().setFormSummary?.(resetPasswordForm, message);
            window.Auth?.showToast?.('Chyba', message, 'error');
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
        clearAuthErrors();
        isRegisterMode = !isRegisterMode;
        syncAuthModeInUrl();
        applyMode();
        focusAndReveal(loginHeader || document.getElementById('email'));
        trackAuthView('toggle');
    });

    checkoutExistingAccount?.addEventListener('click', () => {
        isRegisterMode = false;
        syncAuthModeInUrl();
        applyMode();
        trackAuthView('checkout_existing_account');
        focusAndReveal(loginHeader || document.getElementById('email'));
    });

    setTimeout(() => {
        if (window.Auth?.isLoggedIn()) {
            if (hasPendingAuthRedirect()) {
                return;
            }

            const redirect = urlParams.get('redirect');
            if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
                window.location.href = redirect;
            } else {
                window.location.href = '/profil.html';
            }
        }
    }, 500);
});

document.addEventListener('auth:changed', () => {
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
        let redirect = urlParams.get('redirect') || '/profil.html';

        if (!redirect.startsWith('/') || redirect.startsWith('//')) {
            redirect = '/profil.html';
        }

        if (!redirect.includes('prihlaseni')) {
            window.location.href = redirect;
        }
    }
});
