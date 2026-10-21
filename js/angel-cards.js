/**
 * Angel Cards Logic
 * Handles card drawing, 3D animations, and API communication for deep readings.
 */

import { showFallbackNotice } from './utils/reading-display.js';

let angelCardsData = [];
let angelCardsLoading = false;
let drawnCard = null;
let angelFirstValueTracked = false;
let deepInsightInFlightForCard = null;
let deepInsightCompletedForCard = null;
let angelDeepInsightGeneration = 0;
let angelDeepInsightController = null;
let activeAngelDeepInsightSession = null;
let displayedAngelDeepInsightSession = null;
let observedAngelSession = null;

const ANGEL_CARD_FEATURE = 'andelske_karty_hluboky_vhled';
const ANGEL_CARD_PLAN_ID = 'pruvodce';
const ANGEL_CARD_RESULT_SOURCE = 'angel_card_result';

function captureAngelSession() {
    const isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());
    return { isLoggedIn, userId: isLoggedIn ? window.Auth?.user?.id : null };
}

function hasSameAngelSession(session) {
    const current = captureAngelSession();
    if (current.isLoggedIn !== session?.isLoggedIn) return false;
    if (!current.isLoggedIn) return true;
    return typeof session.userId === 'string' && session.userId.length > 0 && current.userId === session.userId;
}

function clearAngelDeepInsight() {
    angelDeepInsightGeneration += 1;
    angelDeepInsightController?.abort();
    angelDeepInsightController = null;
    activeAngelDeepInsightSession = null;
    displayedAngelDeepInsightSession = null;
    deepInsightInFlightForCard = null;
    deepInsightCompletedForCard = null;

    const response = document.getElementById('angel-ai-response');
    if (response) {
        response.replaceChildren();
        response.hidden = true;
        response.classList.remove('mh-block-visible');
    }
    const status = document.getElementById('angel-ai-status');
    if (status) {
        status.textContent = '';
        status.hidden = true;
    }
    document.getElementById('favorite-angel-card-btn')?.closest('.favorite-reading-action')?.remove();
    const button = document.getElementById('btn-deep-angel');
    if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = 'Získat hluboký vhled';
    }
}

function invalidateAngelSessionChange() {
    const current = captureAngelSession();
    const observedChanged = observedAngelSession && !hasSameAngelSession(observedAngelSession);
    const activeChanged = activeAngelDeepInsightSession && !hasSameAngelSession(activeAngelDeepInsightSession);
    const displayedChanged = displayedAngelDeepInsightSession && !hasSameAngelSession(displayedAngelDeepInsightSession);
    observedAngelSession = current;
    if (!observedChanged && !activeChanged && !displayedChanged) return;
    clearAngelDeepInsight();
}

function isCurrentAngelDeepInsight(requestId, session) {
    if (requestId !== angelDeepInsightGeneration) return false;
    if (hasSameAngelSession(session)) return true;
    invalidateAngelSessionChange();
    return false;
}

document.addEventListener('auth:changed', invalidateAngelSessionChange);
window.addEventListener('storage', event => {
    if (event.key === 'auth_user') invalidateAngelSessionChange();
});
observedAngelSession = captureAngelSession();

const DAILY_CARD_FALLBACKS = {
    'andele-ochranci': {
        name: 'Andělé Ochránci',
        keyword: 'Ochrana',
        text: 'Ochrana může být připomenutím, co ti pomáhá cítit se bezpečně. Kde můžeš dnes nastavit hranici nebo požádat o podporu?',
        archetype: 'guidance'
    },
    hojnost: {
        name: 'Hojnost',
        keyword: 'Prosperita',
        text: 'Hojnost může připomenout různé zdroje, které máš: čas, dovednosti i lidi kolem sebe. Co z nich chceš využít nebo chránit?',
        archetype: 'guidance'
    },
    'novy-zacatek': {
        name: 'Nový začátek',
        keyword: 'Obnova',
        text: 'Nový začátek nemusí znamenat velký obrat. Co můžeš začít jinak v malém a podle svých možností?',
        archetype: 'guidance'
    },
    'vnitrni-mir': {
        name: 'Vnitřní mír',
        keyword: 'Klid',
        text: 'Klid nemusí přijít na povel. Co ti právě teď může přinést trochu prostoru, nebo co potřebuješ odložit?',
        archetype: 'guidance'
    },
    odvaha: {
        name: 'Odvaha',
        keyword: 'Síla',
        text: 'Odvaha nemusí být bez strachu. Co bys chtěl říct nebo zkusit, pokud je to bezpečné a dává ti to smysl?',
        archetype: 'guidance'
    },
    laska: {
        name: 'Láska',
        keyword: 'Spojení',
        text: 'Láska může znamenat blízkost, respekt i péči o sebe. Co teď potřebuješ ve vztazích vyjádřit nebo chránit?',
        archetype: 'guidance'
    },
    intuice: {
        name: 'Intuice',
        keyword: 'Vhled',
        text: 'První dojem je jedna informace, ne jistota. U důležité volby si dej čas a doplň ho fakty.',
        archetype: 'guidance'
    },
    transformace: {
        name: 'Transformace',
        keyword: 'Změna',
        text: 'Změna nemusí být snadná ani žádoucí. Co chceš zachovat a co se dá upravit podle okolností?',
        archetype: 'guidance'
    },
    vdecnost: {
        name: 'Vděčnost',
        keyword: 'Hojnost',
        text: 'Vděčnost může upozornit na něco, čeho si ceníš, aniž by popírala těžkosti. Co ti dnes dává oporu?',
        archetype: 'guidance'
    },
    harmonie: {
        name: 'Harmonie',
        keyword: 'Rovnováha',
        text: 'Rovnováha neznamená mít všechno stejně. Kde během dne potřebuješ víc času nebo jasnější hranici?',
        archetype: 'guidance'
    },
    vudce: {
        name: 'Vůdce',
        keyword: 'Vedení',
        text: 'Vedení může začít nasloucháním a jasnou dohodou. Kde můžeš převzít odpovědnost a kde ji sdílet?',
        archetype: 'guidance'
    },
    propojeni: {
        name: 'Propojení',
        keyword: 'Síť',
        text: 'Propojení může mít mnoho podob. Který kontakt by ti dělal radost, pokud máš chuť se ozvat?',
        archetype: 'guidance'
    },
    hojeni: {
        name: 'Hojení',
        keyword: 'Uzdravení',
        text: 'Hojení není slib ani povinnost cítit se lépe. Jakou podporu nebo péči můžeš bezpečně vyhledat?',
        archetype: 'guidance'
    },
    moudrost: {
        name: 'Moudrost',
        keyword: 'Poznání',
        text: 'Moudrost může vyrůstat ze zkušenosti i nových informací. Co ještě potřebuješ vědět, než se rozhodneš?',
        archetype: 'guidance'
    },
    radost: {
        name: 'Radost',
        keyword: 'Lehkost',
        text: 'Radost nemusí přijít sama ani být povinností. Je dnes něco malého, co tě těší nebo by ti ulevilo?',
        archetype: 'guidance'
    },
    prulom: {
        name: 'Průlom',
        keyword: 'Zjevení',
        text: 'Průlom není zaručený. Když se něco zaseklo, můžeš pojmenovat překážku nebo požádat o pohled zvenčí.',
        archetype: 'guidance'
    },
    duvera: {
        name: 'Důvěra',
        keyword: 'Víra',
        text: 'Důvěra neznamená vzdát se kontroly nad vším. Kde můžeš postupovat podle ověřených informací a vlastních hranic?',
        archetype: 'guidance'
    },
    kreativita: {
        name: 'Kreativita',
        keyword: 'Tvorba',
        text: 'Tvořivost může začít drobným pokusem bez nároku na výsledek. Co by sis rád zkusil?',
        archetype: 'guidance'
    },
    uvolneni: {
        name: 'Uvolnění',
        keyword: 'Tok',
        text: 'Uvolnění neznamená zapomenout, odpustit ani zůstat v těžké situaci. Co už nechceš nést sám?',
        archetype: 'guidance'
    },
    zamer: {
        name: 'Záměr',
        keyword: 'Fokus',
        text: 'Záměr může pomoct vybrat směr, ale neurčuje výsledek. Který další krok je v tvých možnostech?',
        archetype: 'guidance'
    },
    koreny: {
        name: 'Kořeny',
        keyword: 'Stabilita',
        text: 'Kořeny mohou připomenout, co ti dává oporu. Které hodnoty nebo vztahy chceš zachovat?',
        archetype: 'guidance'
    },
    zrcadlo: {
        name: 'Zrcadlo',
        keyword: 'Reflexe',
        text: 'Zrcadlo může otevřít otázku, co v tobě situace probouzí. Reakce druhých ale není důkazem o tvé vině.',
        archetype: 'guidance'
    },
    prijeti: {
        name: 'Přijetí',
        keyword: 'Soucit',
        text: 'Přijetí neznamená souhlasit ani vzdát se změny. Co můžeš uznat tak, jak to je, a jakou hranici potřebuješ?',
        archetype: 'guidance'
    },
    zazrak: {
        name: 'Zázrak',
        keyword: 'Požehnání',
        text: 'Zázrak jako symbol může připomenout nečekaný okamžik radosti. Náhodám nemusíš přisuzovat skrytý význam.',
        archetype: 'guidance'
    },
    pratelstvi: {
        name: 'Přátelství',
        keyword: 'Komunita',
        text: 'Přátelství může potřebovat různé množství kontaktu. Pokud máš chuť se ozvat, je někdo, komu bys rád napsal?',
        archetype: 'guidance'
    },
    ohraniceni: {
        name: 'Ohraničení',
        keyword: 'Hranice',
        text: 'Hranice pomáhají pojmenovat, co je pro tebe přijatelné. Kde by ti pomohla jasná a bezpečná dohoda?',
        archetype: 'guidance'
    },
    vizionar: {
        name: 'Vizionář',
        keyword: 'Vize',
        text: 'Vize je možnost přemýšlet o budoucnosti, ne předpověď. Co chceš zkusit a jaký malý krok je proveditelný?',
        archetype: 'guidance'
    },
    hravost: {
        name: 'Hravost',
        keyword: 'Spontánnost',
        text: 'Hravost může být drobnou změnou v běžném dni. Co by bylo příjemné a nepřidalo další povinnost?',
        archetype: 'guidance'
    },
    'propojen-se-zemi': {
        name: 'Propojení se zemí',
        keyword: 'Příroda',
        text: 'Pobyt venku některým lidem vyhovuje, jiným ne. Jaký způsob odpočinku ti dnes sedí?',
        archetype: 'guidance'
    },
    paradox: {
        name: 'Paradox',
        keyword: 'Tajemství',
        text: 'Nejistota nemusí mít hned odpověď. Co už víš a co zatím může zůstat otevřené?',
        archetype: 'guidance'
    },
    vitez: {
        name: 'Vítěz',
        keyword: 'Úspěch',
        text: 'Ocenění pokroku nemusí znamenat vítězství nad ostatními. Který konkrétní krok se ti povedl a co ti pomohlo?',
        archetype: 'guidance'
    }
};

function setBlockVisible(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('mh-block-visible', visible);
}

function setAngelCardLoadState(state, retrying = false) {
    const drawControl = document.getElementById('draw-btn');
    const loadState = document.getElementById('angel-card-load-state');
    const message = document.getElementById('angel-card-load-message');
    const retryButton = document.getElementById('angel-card-load-retry');
    const canDraw = state === 'ready';
    const shouldRestoreDrawFocus = canDraw && document.activeElement === retryButton;

    if (drawControl) {
        drawControl.setAttribute('aria-disabled', String(!canDraw));
        drawControl.tabIndex = canDraw ? 0 : -1;
        if (state === 'loading') drawControl.setAttribute('aria-busy', 'true');
        else drawControl.removeAttribute('aria-busy');
    }

    if (loadState) {
        loadState.hidden = canDraw;
        loadState.classList.toggle('form-error-summary', state === 'error');
        loadState.setAttribute('role', state === 'error' ? 'alert' : 'status');
        loadState.setAttribute('aria-live', state === 'error' ? 'assertive' : 'polite');
        if (message) {
            message.textContent = state === 'loading'
                ? (retrying ? 'Zkouším znovu načíst balíček karet…' : 'Načítám balíček karet…')
                : 'Andělské karty se nepodařilo načíst. Zkus načtení znovu.';
        }
    }

    if (retryButton) {
        retryButton.hidden = state !== 'error' && !(state === 'loading' && retrying);
        retryButton.textContent = state === 'loading' ? 'Načítám…' : 'Zkusit znovu';
        retryButton.setAttribute('aria-disabled', String(state === 'loading'));
    }

    if (shouldRestoreDrawFocus) drawControl?.focus();
}

async function loadAngelCardData(retrying = false) {
    if (angelCardsLoading) return;
    angelCardsLoading = true;
    setAngelCardLoadState('loading', retrying);

    try {
        const res = await fetch('/data/angel-cards.json?v=20261018-angel-copy-review-batch6');
        if (!res.ok) throw new Error('Nepodařilo se načíst databázi karet.');
        const cards = await res.json();
        if (!Array.isArray(cards)) throw new Error('Databáze karet má neočekávaný formát.');

        angelCardsData = cards.filter(card => card
            && typeof card.id === 'string'
            && typeof card.name === 'string'
            && typeof card.theme === 'string'
            && typeof card.short_message === 'string');
        if (angelCardsData.length === 0) throw new Error('Databáze neobsahuje platné karty.');

        const linkedDailyCard = getDailyCardFromUrl();
        if (linkedDailyCard) {
            drawnCard = linkedDailyCard;
            revealPreDrawnCard({
                message: `Tvoje andělská karta: ${linkedDailyCard.name}`
            });
        } else {
            checkDailyLock();
        }

        setAngelCardLoadState('ready');
    } catch (error) {
        angelCardsData = [];
        console.error('Error loading angel cards:', error);
        setAngelCardLoadState('error');
    } finally {
        angelCardsLoading = false;
    }
}

function getVisibleCookieBannerOffset() {
    const banner = document.getElementById('cookie-banner');
    if (!banner || banner.hidden || !banner.classList.contains('visible')) return 0;

    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const rect = banner.getBoundingClientRect();
    // Lišta najíždí translateY přechodem (0.5s) — rect.top je během
    // animace ještě dole a rezerva by vyšla nulová. Výška se transformem
    // nemění, takže rezervu počítej z konečné klidové polohy lišty.
    const restingTop = viewportHeight - 16 - rect.height;
    return Math.max(0, viewportHeight - Math.min(rect.top, restingTop) + 16);
}

function getMotionAwareScrollBehavior() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function scrollAngelResultsIntoView(behavior = getMotionAwareScrollBehavior()) {
    const results = document.getElementById('angel-results');
    if (!results?.classList.contains('mh-block-visible')) return;

    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const reservedBottom = getVisibleCookieBannerOffset();
    const availableHeight = Math.max(320, viewportHeight - reservedBottom);
    const resultsRect = results.getBoundingClientRect();
    let targetTop = window.scrollY + resultsRect.top - Math.max(86, (availableHeight - resultsRect.height) / 2);
    const action = document.getElementById('angel-deep-action') || document.getElementById('btn-deep-angel');

    if (reservedBottom && action) {
        const bannerTop = viewportHeight - reservedBottom + 16;
        const actionRect = action.getBoundingClientRect();
        const predictedActionBottom = actionRect.bottom - (targetTop - window.scrollY);
        const overlap = predictedActionBottom - (bannerTop - 8);
        if (overlap > 0) {
            targetTop += overlap;
        }
    }

    window.scrollTo({
        top: Math.max(0, targetTop),
        behavior
    });
}

let mobileAngelScrollGeneration = 0;
let mobileAngelScrollRetryTimers = [];
let mobileAngelScrollCancelListeners = [];

function clearMobileAngelScrollRetries(invalidate = true) {
    if (invalidate) mobileAngelScrollGeneration += 1;
    mobileAngelScrollRetryTimers.forEach(timer => clearTimeout(timer));
    mobileAngelScrollRetryTimers = [];
    mobileAngelScrollCancelListeners.forEach(({ type, listener }) => {
        window.removeEventListener(type, listener, true);
    });
    mobileAngelScrollCancelListeners = [];
}

function scheduleMobileAngelResultsScroll(behavior = getMotionAwareScrollBehavior()) {
    clearMobileAngelScrollRetries();
    if (!window.matchMedia('(max-width: 700px)').matches) return;

    scrollAngelResultsIntoView(behavior);
    const generation = mobileAngelScrollGeneration;
    const cancelOnInteraction = () => clearMobileAngelScrollRetries();
    for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'resize']) {
        window.addEventListener(type, cancelOnInteraction, { capture: true, passive: true });
        mobileAngelScrollCancelListeners.push({ type, listener: cancelOnInteraction });
    }

    let remainingRetries = 3;
    for (const delay of [320, 900, 1600]) {
        const timer = window.setTimeout(() => {
            if (generation !== mobileAngelScrollGeneration) return;
            scrollAngelResultsIntoView(behavior);
            remainingRetries -= 1;
            if (remainingRetries === 0) clearMobileAngelScrollRetries(false);
        }, delay);
        mobileAngelScrollRetryTimers.push(timer);
    }
}

const ANGEL_ART_TYPES = new Set(['abundance', 'guidance', 'healing', 'love', 'nature', 'peace', 'purpose', 'strength']);
const DAILY_ANGEL_ART = {
    hojnost: 'abundance', vdecnost: 'abundance', radost: 'abundance', vitez: 'abundance',
    'vnitrni-mir': 'peace', harmonie: 'peace', uvolneni: 'peace', prijeti: 'peace',
    odvaha: 'strength', prulom: 'strength', ohraniceni: 'strength',
    laska: 'love', propojeni: 'love', pratelstvi: 'love',
    hojeni: 'healing', transformace: 'healing',
    koreny: 'nature', 'propojen-se-zemi': 'nature',
    'novy-zacatek': 'purpose', vudce: 'purpose', kreativita: 'purpose', vizionar: 'purpose'
};

function angelArtType(card) {
    // Historical daily links did not store a meaningful archetype.
    const type = DAILY_ANGEL_ART[card.dailyImageSlug] || card.archetype;
    return ANGEL_ART_TYPES.has(type) ? type : 'guidance';
}

function setCardBack(backEl, card) {
    if (!backEl || !card) return;

    const archetype = angelArtType(card);
    backEl.className = `angel-card-back angel-card-back--${archetype}`;
    backEl.innerHTML = `
        <div class="angel-card-overlay"></div>
        <div class="angel-card-content">
            <div class="angel-card-sparkle" aria-hidden="true"><svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg></div>
            <h3 class="angel-name">${card.name}</h3>
            <div class="angel-theme">${card.theme}</div>
        </div>
    `;
}

function animateCardTilt(inner, transform) {
    if (!inner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        cancelCardTilt(inner);
        return;
    }
    inner.animate([
        { transform }
    ], {
        duration: 120,
        easing: 'ease-out',
        fill: 'forwards'
    });
}

function cancelCardTilt(inner) {
    if (!inner) return;
    inner.getAnimations().forEach(animation => animation.cancel());
}

function apiBase() {
    return window.API_CONFIG?.BASE_URL || '/api';
}

function getStoredDailyCard(slug) {
    try {
        const saved = JSON.parse(localStorage.getItem('mh_kdd_card') || 'null');
        if (saved?.slug === slug && saved?.card) return saved.card;
    } catch (error) {
        if (window.MH_DEBUG) console.debug('Stored daily card read failed:', error);
    }
    return null;
}

function getLocalDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDailyCardFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('daily_card');
    if (!slug) return null;

    // Prefer current copy for known legacy daily-card links; older localStorage
    // entries can outlive the content and cache revision that created them.
    const sourceCard = DAILY_CARD_FALLBACKS[slug] || getStoredDailyCard(slug);
    if (!sourceCard) return null;

    return {
        id: `daily_${slug}`,
        name: sourceCard.name,
        theme: sourceCard.keyword || sourceCard.theme || 'Denní symbol',
        short_message: sourceCard.text || sourceCard.short_message || '',
        archetype: sourceCard.archetype || 'guidance',
        dailyImageSlug: slug,
        isDailyCardDetail: true
    };
}

function buildAngelUpgradeUrl(source) {
    const pricingUrl = new URL('/cenik.html', window.location.origin);
    pricingUrl.searchParams.set('plan', ANGEL_CARD_PLAN_ID);
    pricingUrl.searchParams.set('source', source);
    pricingUrl.searchParams.set('feature', ANGEL_CARD_FEATURE);
    pricingUrl.searchParams.set('entry_source', source);
    pricingUrl.searchParams.set('entry_feature', ANGEL_CARD_FEATURE);
    return `${pricingUrl.pathname}${pricingUrl.search}`;
}

function cleanAngelContextValue(value, maxLength = 120) {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).trim();
    if (!cleaned) return null;
    return cleaned.slice(0, maxLength);
}

function buildAngelProfileSignupUrl(source = 'angel_card_save_profile') {
    const params = new URLSearchParams(window.location.search);
    const authUrl = new URL('/prihlaseni.html', window.location.origin);
    const entrySource = cleanAngelContextValue(params.get('source'));
    const entryFeature = cleanAngelContextValue(params.get('feature'));

    authUrl.searchParams.set('mode', 'register');
    authUrl.searchParams.set('redirect', '/andelske-karty.html');
    authUrl.searchParams.set('source', source);
    authUrl.searchParams.set('feature', ANGEL_CARD_FEATURE);
    authUrl.searchParams.set('entry_source', entrySource || ANGEL_CARD_RESULT_SOURCE);
    authUrl.searchParams.set('entry_feature', entryFeature || ANGEL_CARD_FEATURE);

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((key) => {
        const value = cleanAngelContextValue(params.get(key));
        if (value) authUrl.searchParams.set(key, value);
    });

    return `${authUrl.pathname}${authUrl.search}`;
}

async function trackAngelFunnelEvent(eventName, source, metadata = {}) {
    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!csrfToken) return;

        await fetch(`${apiBase()}/payment/funnel-event`, {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                eventName,
                source,
                feature: ANGEL_CARD_FEATURE,
                planId: ANGEL_CARD_PLAN_ID,
                metadata: {
                    path: window.location.pathname,
                    ...metadata
                }
            })
        });
    } catch (error) {
        console.warn('[Angel cards funnel] Could not record event:', error.message);
    }
}

function startAngelUpgradeFlow(source, authMode = 'register') {
    window.MH_ANALYTICS?.trackCTA?.(source, {
        plan_id: ANGEL_CARD_PLAN_ID,
        feature: ANGEL_CARD_FEATURE
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout(ANGEL_CARD_PLAN_ID, {
            source,
            feature: ANGEL_CARD_FEATURE,
            metadata: {
                entry_source: source,
                entry_feature: ANGEL_CARD_FEATURE
            },
            redirect: '/cenik.html',
            authMode
        });
        return;
    }

    window.location.href = buildAngelUpgradeUrl(source);
}

function getDeepInsightHost() {
    return document.querySelector('#angel-results .message-box') || document.getElementById('angel-results');
}

function ensureAngelProfileCta() {
    const existing = document.getElementById('angel-profile-cta');
    if (window.Auth?.isLoggedIn?.()) {
        existing?.remove();
        return null;
    }

    const host = getDeepInsightHost();
    if (!host) return null;
    if (existing) return existing;

    const source = 'angel_card_save_profile';
    const profileCta = document.createElement('div');
    profileCta.id = 'angel-profile-cta';
    profileCta.className = 'angel-profile-cta';
    profileCta.setAttribute('aria-label', 'Registrace profilu zdarma po andelske karte');
    profileCta.innerHTML = `
        <p class="angel-profile-cta__eyebrow">Profil zdarma</p>
        <h3>Chce&scaron; se k poselstv&iacute;m vracet?</h3>
        <p>Profil zdarma ti otev&#345;e n&aacute;vazn&eacute; v&yacute;klady a denn&iacute; veden&iacute; bez platebn&iacute; karty.</p>
        <a href="${buildAngelProfileSignupUrl(source)}"
           class="btn btn--secondary angel-profile-cta__button"
           data-analytics-cta="${source}"
           data-analytics-feature="${ANGEL_CARD_FEATURE}"
           data-analytics-intent="free_profile_after_result">Vytvo&#345;it profil zdarma</a>
    `;

    const deepAction = document.getElementById('angel-deep-action');
    if (deepAction && deepAction.parentElement === host) {
        deepAction.insertAdjacentElement('afterend', profileCta);
        return profileCta;
    }

    const shareAction = document.getElementById('btn-share-card')?.closest('div');
    if (shareAction && shareAction.parentElement === host) {
        host.insertBefore(profileCta, shareAction);
        return profileCta;
    }

    host.appendChild(profileCta);
    return profileCta;
}

function ensureDeepInsightElements() {
    const host = getDeepInsightHost();
    if (!host) return {};

    let action = document.getElementById('angel-deep-action');
    if (!action) {
        action = document.createElement('div');
        action.id = 'angel-deep-action';
        action.className = 'mt-lg text-center angel-deep-action';

        const button = document.createElement('button');
        button.id = 'btn-deep-angel';
        button.className = 'btn btn--primary';
        button.type = 'button';
        button.textContent = 'Získat hluboký vhled';
        button.addEventListener('click', requestDeepInsight);

        action.appendChild(button);
        const shareAction = document.getElementById('btn-share-card')?.closest('div');
        if (shareAction && shareAction.parentElement === host) {
            host.insertBefore(action, shareAction);
        } else {
            host.appendChild(action);
        }
    }

    ensureAngelProfileCta();

    let response = document.getElementById('angel-ai-response');
    if (!response) {
        response = document.createElement('div');
        response.id = 'angel-ai-response';
        response.className = 'angel-ai-response mt-lg';
        response.hidden = true;
        host.appendChild(response);
    }

    let status = document.getElementById('angel-ai-status');
    if (!status) {
        status = document.createElement('p');
        status.id = 'angel-ai-status';
        status.className = 'sr-only';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');
        status.hidden = true;
        host.appendChild(status);
    }

    return { action, response, status };
}

function renderDeepInsightText(container, text) {
    container.textContent = '';
    const content = String(text || '').trim();
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);

    if (looksLikeHtml && window.DOMPurify) {
        container.innerHTML = window.DOMPurify.sanitize(content, {
            ALLOWED_TAGS: ['div', 'h4', 'p', 'ul', 'li', 'em', 'strong', 'b', 'i', 'br', 'span'],
            ALLOWED_ATTR: ['class']
        });
        container.hidden = false;
        container.classList.add('mh-block-visible');
        return;
    }

    content
        .split(/\n{2,}/)
        .map(part => part.trim())
        .filter(Boolean)
        .forEach(part => {
            const paragraph = document.createElement('p');
            paragraph.textContent = part.replace(/\*\*/g, '');
            container.appendChild(paragraph);
        });
    container.hidden = false;
    container.classList.add('mh-block-visible');
}

function trackAngelFirstValue(source = ANGEL_CARD_RESULT_SOURCE) {
    if (!drawnCard || angelFirstValueTracked) return;
    angelFirstValueTracked = true;

    const metadata = {
        source,
        feature: ANGEL_CARD_FEATURE,
        first_value_type: 'angel_card_result',
        card_name: String(drawnCard.name || '').slice(0, 80),
        card_theme: String(drawnCard.theme || '').slice(0, 80),
        is_daily_card_detail: Boolean(drawnCard.isDailyCardDetail),
        seo_cluster: 'angel_cards',
        seo_page_type: 'free_tool'
    };

    if (window.MH_ANALYTICS?.trackFirstValueCompleted) {
        window.MH_ANALYTICS.trackFirstValueCompleted(ANGEL_CARD_FEATURE, metadata);
    } else {
        window.MH_ANALYTICS?.trackEvent?.('first_value_completed', metadata);
    }

    void trackAngelFunnelEvent('first_value_completed', source, metadata);
}

function appendFavoriteAction(container, readingId) {
    if (!container || !readingId || document.getElementById('favorite-angel-card-btn')) return;

    const action = document.createElement('div');
    action.className = 'text-center favorite-reading-action';
    action.innerHTML = `
        <button id="favorite-angel-card-btn" type="button" aria-pressed="false" class="btn btn--glass favorite-reading-action__button">
            <svg class="mh-symbol mh-symbol--inline favorite-icon" viewBox="0 0 48 48" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg> Přidat do oblíbených
        </button>
    `;
    container.appendChild(action);

    action.querySelector('#favorite-angel-card-btn')?.addEventListener('click', async () => {
        if (typeof window.toggleFavorite === 'function') {
            await window.toggleFavorite(readingId, 'favorite-angel-card-btn');
        }
    });
}

function getDeepInsightCardKey(card) {
    if (!card) return '';
    return JSON.stringify([
        String(card.id || ''),
        String(card.name || ''),
        String(card.theme || ''),
        String(card.message || ''),
        String(card.short_message || '')
    ]);
}

async function requestDeepInsight() {
    if (!drawnCard) return;

    if (!window.Auth?.isLoggedIn?.()) {
        window.Auth?.showToast?.('Přihlášení vyžadováno', 'Hluboký vhled k andělské kartě je dostupný po přihlášení.', 'info');
        startAngelUpgradeFlow('angel_card_auth_gate', 'register');
        return;
    }

    if (!window.Auth?.isPremium?.()) {
        window.Auth?.showToast?.('Premium vyžadováno', 'Hluboký vhled je dostupný pro Hvězdné Průvodce.', 'info');
        startAngelUpgradeFlow('angel_card_premium_gate', 'login');
        return;
    }

    invalidateAngelSessionChange();
    const readingSession = captureAngelSession();
    const readingOwnerId = readingSession.userId;
    if (typeof readingOwnerId !== 'string' || !readingOwnerId) return;

    const { response, status } = ensureDeepInsightElements();
    const button = document.getElementById('btn-deep-angel');
    if (!response || !status || !button) return;

    const card = drawnCard;
    const cardKey = getDeepInsightCardKey(card);
    if (!cardKey || deepInsightInFlightForCard === cardKey || deepInsightCompletedForCard === cardKey) return;

    const originalText = button.textContent;
    const requestId = ++angelDeepInsightGeneration;
    const controller = new AbortController();
    angelDeepInsightController = controller;
    activeAngelDeepInsightSession = readingSession;
    displayedAngelDeepInsightSession = null;
    deepInsightInFlightForCard = cardKey;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Připravuji hlubší výklad…';
    response.hidden = false;
    response.textContent = 'Výklad k vytažené kartě se připravuje…';
    status.hidden = false;
    status.textContent = 'Načítám hluboký vhled k andělské kartě.';

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!isCurrentAngelDeepInsight(requestId, readingSession)) return;
        const res = await fetch(`${apiBase()}/angel-card`, {
            method: 'POST',
            credentials: 'include',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({
                card,
                intention: 'hluboký vhled k andělské kartě'
            })
        });
        if (!isCurrentAngelDeepInsight(requestId, readingSession)) return;

        const data = await res.json();
        if (!isCurrentAngelDeepInsight(requestId, readingSession)) return;

        if (res.status === 401 || res.status === 402 || res.status === 403 || data.isTeaser) {
            startAngelUpgradeFlow('angel_card_api_gate', 'login');
            response.hidden = true;
            status.textContent = '';
            status.hidden = true;
            return;
        }

        if (!res.ok || !data.success || !String(data.response || '').trim()) {
            throw new Error(data.error || 'Nepodařilo se načíst hluboký vhled.');
        }

        renderDeepInsightText(response, data.response);
        showFallbackNotice(response, data.fallback);
        deepInsightCompletedForCard = cardKey;
        displayedAngelDeepInsightSession = readingSession;
        status.textContent = 'Hluboký vhled k andělské kartě je připraven.';

        if (window.Auth?.saveReading) {
            try {
                const saveResult = await window.Auth.saveReading('angel-card', {
                    card: {
                        name: card.name,
                        theme: card.theme,
                        message: card.message
                    },
                    intention: 'hluboký vhled k andělské kartě',
                    response: data.response,
                    fallback: !!data.fallback
                }, readingOwnerId);
                if (!isCurrentAngelDeepInsight(requestId, readingSession)) return;
                if (saveResult?.id && deepInsightCompletedForCard === cardKey) {
                    appendFavoriteAction(response, saveResult.id);
                } else if (!saveResult?.id && deepInsightCompletedForCard === cardKey) {
                    status.textContent = 'Hluboký vhled je připravený, ale nepodařilo se ho uložit do profilu.';
                }
            } catch (saveError) {
                if (!isCurrentAngelDeepInsight(requestId, readingSession)) return;
                console.warn('Angel deep insight save failed:', saveError.message);
                status.textContent = 'Hluboký vhled je připravený, ale nepodařilo se ho uložit do profilu.';
            }
        }

        scrollAngelResultsIntoView();
    } catch (error) {
        if (error?.name === 'AbortError' || !isCurrentAngelDeepInsight(requestId, readingSession)) return;
        console.error('Angel deep insight failed:', error);
        response.textContent = 'Hluboký vhled se teď nepodařilo načíst. Zkus to prosím znovu.';
        status.textContent = 'Hluboký vhled se nepodařilo načíst. Zkus to prosím znovu.';
    } finally {
        if (requestId === angelDeepInsightGeneration) {
            if (deepInsightInFlightForCard === cardKey) deepInsightInFlightForCard = null;
            const completed = deepInsightCompletedForCard === cardKey;
            button.disabled = completed;
            button.removeAttribute('aria-busy');
            button.textContent = completed ? 'Hluboký vhled je připraven' : originalText;
            if (activeAngelDeepInsightSession === readingSession) activeAngelDeepInsightSession = null;
            if (angelDeepInsightController === controller) angelDeepInsightController = null;
        }
    }
}

// Initialize controls before loading the data so load failures can recover in place.
document.addEventListener('DOMContentLoaded', () => {
    const drawBtn = document.getElementById('draw-btn');
    if (drawBtn) {
        drawBtn.addEventListener('click', drawCard);
        drawBtn.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            drawCard();
        });

        drawBtn.addEventListener('mousemove', handleMouseMove);
        drawBtn.addEventListener('mouseleave', () => {
            const inner = drawBtn.querySelector('.angel-card-inner');
            if (inner && !drawBtn.classList.contains('is-flipped')) {
                animateCardTilt(inner, 'rotateX(0deg) rotateY(0deg)');
            }
        });
    }

    document.getElementById('angel-card-load-retry')?.addEventListener('click', () => {
        if (angelCardsLoading) return;
        void loadAngelCardData(true);
    });

    const shareBtn = document.getElementById('btn-share-card');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareCard);
    }

    window.addEventListener('mh_cookie_banner_visible', () => {
        scheduleMobileAngelResultsScroll();
    });

    void loadAngelCardData();
});

async function drawAngelCardImage(card) {
    const shareImage = window.MH_SHARE_IMAGE;
    const canvas = shareImage.createCanvas();
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    await document.fonts?.ready;
    shareImage.drawBrandBackground(ctx, canvas, 7, { showHeader: false });
    const art = await shareImage.loadImage(`/img/atlas/angels-v1/${angelArtType(card)}.webp`);
    shareImage.drawImageContain(ctx, art, 250, 34, 580, 720);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d0b17c';
    ctx.font = '500 26px Inter, Arial, sans-serif';
    ctx.fillText('ANDĚLSKÁ KARTA', centerX, 790);

    ctx.fillStyle = '#e9e3d7';
    ctx.font = '500 46px Cinzel, Georgia, serif';
    let y = shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, card.name || '', 900), centerX, 854, 56, 2, 900);

    if (card.theme) {
        ctx.fillStyle = '#c0c8ca';
        ctx.font = '500 28px Inter, Arial, sans-serif';
        ctx.fillText(card.theme, centerX, y + 26);
        y += 54;
    }

    ctx.fillStyle = 'rgba(208,177,124,0.86)';
    ctx.fillRect(170, y + 12, 740, 3);
    y += 48;

    const message = card.short_message || card.message || '';
    if (message) {
        ctx.fillStyle = '#e9e3d7';
        ctx.font = '400 30px Inter, Arial, sans-serif';
        shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, message, 900), centerX, y, 40, Math.max(1, Math.floor((1220 - y) / 40)), 900);
    }

    ctx.fillStyle = '#d0b17c';
    ctx.font = '400 24px Inter, Arial, sans-serif';
    ctx.fillText('Mystická Hvězda · andělské karty', centerX, 1290);

    return canvas;
}

/**
 * Shares the drawn card: branded PNG via the native share sheet where
 * supported, otherwise falls back to the original text/URL share.
 */
async function shareCard() {
    if (!drawnCard) return;

    if (window.MH_SHARE_IMAGE?.shareOrDownload) {
        try {
            const canvas = await drawAngelCardImage(drawnCard);
            await window.MH_SHARE_IMAGE.shareOrDownload({
                canvas,
                fileName: 'andelska-karta.png',
                shareTitle: `Andělská karta dne: ${drawnCard.name}`,
                shareText: `Karta ${drawnCard.name} otevírá téma ${drawnCard.theme}. Ber její význam jako symbolický podnět k zamyšlení. Vyber si svou kartu na mystickahvezda.cz/andelske-karty.html.`,
                eventBase: 'angel_card_image',
                metadata: {
                    source: 'angel_card_result',
                    feature: 'daily_angel_card',
                    card_name: String(drawnCard.name || '').slice(0, 80)
                }
            });
            return;
        } catch (error) {
            console.warn('[Angel] Image share failed, falling back to text share:', error.message);
        }
    }

    const shareTitle = `Andělská karta dne: ${drawnCard.name}`;
    const shareText = `Karta ${drawnCard.name} otevírá téma ${drawnCard.theme}. Ber její význam jako symbolický podnět k zamyšlení. Vyber si svou kartu na mystickahvezda.cz/andelske-karty.html.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
        }).catch(err => {
            console.warn('Share API failed:', err);
        });
    } else {
        // Fallback for desktop/unsupported browsers
        navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n${shareUrl}`).then(() => {
            alert('Odkaz a poselství byly zkopírovány do schránky! Můžete je vložit přátelům.');
        }).catch(err => {
            console.error('Clipboard failed', err);
            alert('Bohužel se nepodařilo zkopírovat odkaz.');
        });
    }
}

/**
 * Checks if the user has already drawn a card today and sets up the UI accordingly.
 */
function checkDailyLock() {
    const today = getLocalDayKey();
    let savedDataStr = null;
    try {
        savedDataStr = localStorage.getItem('angelCardDaily');
    } catch {
        // A blocked storage area must not prevent the user from drawing a card.
        return;
    }

    if (savedDataStr) {
        try {
            const savedData = JSON.parse(savedDataStr);
            if (savedData.date === today && savedData.cardData) {
                // User already drew a card today
                drawnCard = savedData.cardData;
                revealPreDrawnCard();
            } else {
                // Different day, clear the old reading to be safe
                try { localStorage.removeItem('angelCardDaily'); } catch { /* Storage is optional. */ }
            }
        } catch (e) {
            console.error('Error parsing daily card:', e);
            try { localStorage.removeItem('angelCardDaily'); } catch { /* Storage is optional. */ }
        }
    }
}

function saveDailyCard(card) {
    try {
        localStorage.setItem('angelCardDaily', JSON.stringify({
            date: getLocalDayKey(),
            cardData: card
        }));
        return true;
    } catch (error) {
        if (window.MH_DEBUG) console.debug('Daily angel card could not be saved:', error);
        return false;
    }
}

function updateDailyCardStorageNotice(saved) {
    const notice = document.getElementById('angel-card-storage-note');
    if (!notice) return;
    notice.hidden = saved;
    notice.textContent = saved
        ? ''
        : 'Prohlížeč si dnešní kartu neuložil. Pokud stránku zavřeš, nemusí se stejná karta znovu zobrazit.';
}

/**
 * Bypasses the animation for returning users and shows their already drawn card.
 */
function revealPreDrawnCard(options = {}) {
    const container = document.getElementById('draw-btn');
    if (!container) return;

    // Populate Back of Card
    const backEl = container.querySelector('.angel-card-back');
    if (backEl) {
        setCardBack(backEl, drawnCard);
    }

    // Populate Results Area
    const shortMessageEl = document.getElementById('angel-short-message');
    if (shortMessageEl) {
        shortMessageEl.textContent = drawnCard.short_message;
    }

    // Skip animation lock
    const inner = container.querySelector('.angel-card-inner');
    if (inner) cancelCardTilt(inner);
    // Turn off transition temporarily so it just appears flipped
    if (inner) inner.classList.add('angel-card-inner--no-transition');

    container.classList.add('is-flipped');
    container.classList.remove('glow-effect');
    container.classList.add('angel-card-container--drawn');

    // Show results section immediately
    const intro = document.getElementById('angel-intro');
    if (intro) {
        const introTexts = intro.querySelectorAll('p');
        introTexts.forEach(p => {
            p.hidden = true;
        });

        // Add a small title for returning users
        intro.querySelector('.angel-return-message')?.remove();
        const returnMsg = document.createElement('p');
        returnMsg.className = 'mb-xl text-lg w-mx-md mx-auto angel-return-message';
        const returnMessage = options.message || 'Tvoje andělská karta pro dnešek už je otevřená...';
        const emphasis = document.createElement('em');
        emphasis.textContent = returnMessage;
        returnMsg.appendChild(emphasis);
        intro.prepend(returnMsg);
    }

    const results = document.getElementById('angel-results');
    if (results) {
        setBlockVisible(results, true);
        results.classList.add('animate-in');
        requestAnimationFrame(() => scheduleMobileAngelResultsScroll('auto'));
    }

    ensureDeepInsightElements();

    // Restore transition after a tiny delay so future interactions aren't broken
    setTimeout(() => {
        if (inner) inner.classList.remove('angel-card-inner--no-transition');
    }, 50);
}

/**
 * Creates a subtle 3D tilt effect before drawing
 */
function handleMouseMove(e) {
    const cardEl = e.currentTarget;
    if (cardEl.classList.contains('is-flipped')) return;

    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top; // y position within the element

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation
    const rotateY = ((x - centerX) / centerX) * 10;

    const inner = cardEl.querySelector('.angel-card-inner');
    if (inner) {
        animateCardTilt(inner, `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    }
}

/**
 * Draws a random angel card and triggers the flip animation
 */
function drawCard() {
    const container = document.getElementById('draw-btn');
    if (!container || angelCardsData.length === 0 || container.getAttribute('aria-disabled') === 'true'
        || container.classList.contains('is-flipped')) return; // Not ready or already drawn

    const hasPreselectedDailyCard = Boolean(drawnCard?.isDailyCardDetail);

    if (!hasPreselectedDailyCard) {
        // Select random card
        const randomIndex = Math.floor(Math.random() * angelCardsData.length);
        drawnCard = angelCardsData[randomIndex];
        deepInsightInFlightForCard = null;
        deepInsightCompletedForCard = null;

        // Save to Daily Lock
        updateDailyCardStorageNotice(saveDailyCard(drawnCard));
    }

    // Populate Back of Card
    const backEl = container.querySelector('.angel-card-back');
    if (backEl) {
        // We will use a soft abstract background image or CSS gradient
        setCardBack(backEl, drawnCard);
    }

    // Populate Results Area
    const shortMessageEl = document.getElementById('angel-short-message');
    if (shortMessageEl) {
        shortMessageEl.textContent = drawnCard.short_message;
    }

    // Trigger Flip
    // Reset any transform from mouse move
    const inner = container.querySelector('.angel-card-inner');
    if (inner) cancelCardTilt(inner);

    container.classList.add('is-flipped');
    container.classList.remove('glow-effect');
    container.classList.add('angel-card-container--drawn');

    // Skip the animation wait when the visitor asks for reduced motion.
    const revealDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800;
    setTimeout(() => {
        const intro = document.getElementById('angel-intro');
        if (intro) {
            // Hide intro text
            const introTexts = intro.querySelectorAll('p');
            introTexts.forEach(p => p.classList.add('angel-intro-text--hidden'));
        }

        const results = document.getElementById('angel-results');
        if (results) {
            setBlockVisible(results, true);
            trackAngelFirstValue(ANGEL_CARD_RESULT_SOURCE);
            // Trigger animation frame
            requestAnimationFrame(() => {
                results.classList.add('animate-in');
                ensureDeepInsightElements();
                scheduleMobileAngelResultsScroll();
            });
        }
    }, revealDelay);
}
