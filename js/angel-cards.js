/**
 * Angel Cards Logic
 * Handles card drawing, 3D animations, and API communication for deep readings.
 */

let angelCardsData = [];
let drawnCard = null;
let angelFirstValueTracked = false;

const ANGEL_CARD_FEATURE = 'andelske_karty_hluboky_vhled';
const ANGEL_CARD_PLAN_ID = 'pruvodce';
const ANGEL_CARD_RESULT_SOURCE = 'angel_card_result';

const DAILY_CARD_FALLBACKS = {
    'andele-ochranci': {
        name: 'Andělé Ochránci',
        keyword: 'Ochrana',
        text: 'Dnes tě obklopuje neviditelná ochrana. Důvěřuj svému vnitřnímu hlasu a neboj se udělat první krok. Andělé tě provázejí.',
        archetype: 'guidance'
    },
    hojnost: {
        name: 'Hojnost',
        keyword: 'Prosperita',
        text: 'Energie hojnosti proudí tvým životem. Otevři se přijímání – ať už jde o lásku, příležitosti nebo uznání. Zasloužíš si to.',
        archetype: 'guidance'
    },
    'novy-zacatek': {
        name: 'Nový začátek',
        keyword: 'Obnova',
        text: 'Jitřní energie nese poselství čerstvého startu. To, co dlouho odkládáš, teď dostává zelenou. Důvěřuj procesu a jdi vpřed.',
        archetype: 'guidance'
    },
    'vnitrni-mir': {
        name: 'Vnitřní mír',
        keyword: 'Klid',
        text: 'Dnešní den volá po ztišení. Věnuj chvíli sobě, svému dechu a vnitřnímu prostoru. Z klidu vychází ta nejlepší rozhodnutí.',
        archetype: 'guidance'
    },
    odvaha: {
        name: 'Odvaha',
        keyword: 'Síla',
        text: 'Hvězdy ti dnes přidávají na odvaze. Je čas říct ano věcem, kterých se dosud bojíš. Tvoje srdce zná správný směr.',
        archetype: 'guidance'
    },
    laska: {
        name: 'Láska',
        keyword: 'Spojení',
        text: 'Energie dne je prodchnuta láskou. Ať jde o vztah, přátelství nebo vztah k sobě – otevři své srdce a lásku přijímej i dávej.',
        archetype: 'guidance'
    },
    intuice: {
        name: 'Intuice',
        keyword: 'Vhled',
        text: 'Tvůj šestý smysl je dnes obzvláště aktivní. Věř prvním pocitům a hledej odpovědi uvnitř sebe, ne jen ve vnějším světě.',
        archetype: 'guidance'
    },
    transformace: {
        name: 'Transformace',
        keyword: 'Změna',
        text: 'Jako motýl procházíš proměnou. Nenech se vystrašit tím, co se rozpadá – to, co přichází, je krásnější. Přijmi změnu s otevřenou náručí.',
        archetype: 'guidance'
    },
    vdecnost: {
        name: 'Vděčnost',
        keyword: 'Hojnost',
        text: 'Zastav se a všimni si všeho, za co dnes cítíš vděčnost. Vděčnost otevírá dveře dalším darům. Dnes oceň i ty nejmenší věci.',
        archetype: 'guidance'
    },
    harmonie: {
        name: 'Harmonie',
        keyword: 'Rovnováha',
        text: 'Hledej rovnováhu ve všech oblastech svého života. Harmonie přichází z vyrovnání vnitřního a vnějšího světa. Nenásilí a klid jsou tvoje síla.',
        archetype: 'guidance'
    },
    vudce: {
        name: 'Vůdce',
        keyword: 'Vedení',
        text: 'Dnes tě ostatní přirozeně sledují. Tvoje slova a činy mají větší váhu, než si myslíš. Buď lídrem, jakého si přeješ mít za vzor.',
        archetype: 'guidance'
    },
    propojeni: {
        name: 'Propojení',
        keyword: 'Síť',
        text: 'Dnešní energie posiluje tvoje vztahy a propojení s druhými. Neboj se ozvat starému příteli nebo navázat nové kontakty – vesmír to podporuje.',
        archetype: 'guidance'
    },
    hojeni: {
        name: 'Hojení',
        keyword: 'Uzdravení',
        text: 'Zelená energie hojení prostupuje tvým tělem i duší. Je čas pustit staré rány a dovolit si plně se uzdravit. Jsi na správné cestě.',
        archetype: 'guidance'
    },
    moudrost: {
        name: 'Moudrost',
        keyword: 'Poznání',
        text: 'Dnes máš k dispozici hlubokou moudrost a vhled. Naslouchej starším, čti mezi řádky a hledej smysl za povrchem věcí.',
        archetype: 'guidance'
    },
    radost: {
        name: 'Radost',
        keyword: 'Lehkost',
        text: 'Dnes si dovol lehkost a radost. Hraj si, směj se, užij si okamžik. Radost je tvůj přirozený stav i právo.',
        archetype: 'guidance'
    },
    prulom: {
        name: 'Průlom',
        keyword: 'Zjevení',
        text: 'Dnes může přijít nečekané zjevení nebo průlom v situaci, která se zdála zablokovaná. Měj oči i mysl otevřené – osvícení přichází náhle.',
        archetype: 'guidance'
    },
    duvera: {
        name: 'Důvěra',
        keyword: 'Víra',
        text: 'Důvěřuj procesu, i když nevidíš celý obraz. Vesmír pracuje za kulisami v tvůj prospěch. Pusť kontrolu a uvěř, že vše dopadne dobře.',
        archetype: 'guidance'
    },
    kreativita: {
        name: 'Kreativita',
        keyword: 'Tvorba',
        text: 'Tvoje kreativní energie je dnes na vrcholu. Vrať se k projektu, který odkládáš, nebo vyzkoušej něco zcela nového. Tvoř!',
        archetype: 'guidance'
    },
    uvolneni: {
        name: 'Uvolnění',
        keyword: 'Tok',
        text: 'Přestaň zadržovat dech a plav s proudem. Uvolnění napětí a odporu ti otvírá cestu k snadnějšímu a radostnějšímu životu.',
        archetype: 'guidance'
    },
    zamer: {
        name: 'Záměr',
        keyword: 'Fokus',
        text: 'Jasně si definuj, co chceš. Dnešní energie podporuje záměry a manifestace. Napiš si cíl nebo ho vyslov nahlas – vesmír naslouchá.',
        archetype: 'guidance'
    },
    koreny: {
        name: 'Kořeny',
        keyword: 'Stabilita',
        text: 'Ukotvi se ve svých kořenech – rodině, hodnotách, tradici. Síla vyrůstá ze stability a hlubokého zakotvení. Dnes oceň, odkud pocházíš.',
        archetype: 'guidance'
    },
    zrcadlo: {
        name: 'Zrcadlo',
        keyword: 'Reflexe',
        text: 'Cokoliv tě dnes na druhých dráždí nebo nadchne, je zrcadlem tvého vlastního nitra. Den pro sebereflexi a hluboké pochopení sebe sama.',
        archetype: 'guidance'
    },
    prijeti: {
        name: 'Přijetí',
        keyword: 'Soucit',
        text: 'Přijmi sebe i druhé přesně takové, jací jsou. Dnešek volá po soucitu namísto souzení. Z přijetí roste skutečná láska.',
        archetype: 'guidance'
    },
    zazrak: {
        name: 'Zázrak',
        keyword: 'Požehnání',
        text: 'Otevři oči pro malé zázraky kolem sebe. Dnes se vesmír dává o sobě vědět skrze synchronicity a náhody – žádná z nich není náhodná.',
        archetype: 'guidance'
    },
    pratelstvi: {
        name: 'Přátelství',
        keyword: 'Komunita',
        text: 'Přátelé jsou rodina, kterou si volíš. Dnes se ozvi těm, na které myslíš. Jedno upřímné slovo může změnit celý den.',
        archetype: 'guidance'
    },
    ohraniceni: {
        name: 'Ohraničení',
        keyword: 'Hranice',
        text: 'Naučit se říkat ne je akt lásky k sobě. Dnes posiluj zdravé hranice – bez viny, bez omluv. Tvoje energie je dar, ne povinnost.',
        archetype: 'guidance'
    },
    vizionar: {
        name: 'Vizionář',
        keyword: 'Vize',
        text: 'Povznes pohled nad každodennost. Jaká je tvoje velká vize? Dnešek přeje snění, plánování a smělým cílům.',
        archetype: 'guidance'
    },
    hravost: {
        name: 'Hravost',
        keyword: 'Spontánnost',
        text: 'Je čas přerušit rutinu a vnést do dne trochu překvapení. Buď spontánní, dovol si hravost a neboj se vypadat trochu bláznivě. Život je příliš krátký na vážnost.',
        archetype: 'guidance'
    },
    'propojen-se-zemi': {
        name: 'Propojen se zemí',
        keyword: 'Zemění',
        text: 'Vyjdi ven, dotkni se přírody, zhluboka dýchej. Zemský magnetismus ti dodá sílu a jasnost mysli. Příroda je tvůj nejlepší lék.',
        archetype: 'guidance'
    },
    paradox: {
        name: 'Paradox',
        keyword: 'Tajemství',
        text: 'Ne vše musí být hned vysvětleno. Dnes se smiř s nejistotou a tajemstvím. Pravda má mnoho vrstev – ponoř se do hlubiny beze strachu.',
        archetype: 'guidance'
    },
    vitez: {
        name: 'Vítěz',
        keyword: 'Úspěch',
        text: 'Tvoje vytrvalost nese ovoce. Dnes oslav svůj pokrok – i ten nejmenší úspěch si zaslouží uznání. Jsi na správné cestě k vítězství.',
        archetype: 'guidance'
    }
};

function setBlockVisible(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('mh-block-visible', visible);
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

function scrollAngelResultsIntoView(behavior = 'smooth') {
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

function scheduleMobileAngelResultsScroll(behavior = 'smooth') {
    if (!window.matchMedia('(max-width: 700px)').matches) return;

    scrollAngelResultsIntoView(behavior);
    setTimeout(() => scrollAngelResultsIntoView(behavior), 320);
    setTimeout(() => scrollAngelResultsIntoView(behavior), 900);
    setTimeout(() => scrollAngelResultsIntoView(behavior), 1600);
}

function setCardBack(backEl, card) {
    if (!backEl || !card) return;

    const archetype = card.archetype || 'guidance';
    backEl.className = `angel-card-back angel-card-back--${archetype}`;
    if (card.dailyImageSlug) {
        backEl.classList.add('angel-card-back--daily', `angel-card-back--daily-${card.dailyImageSlug}`);
    }
    backEl.innerHTML = `
        <div class="angel-card-overlay"></div>
        <div class="angel-card-content">
            <div class="angel-card-sparkle">✨</div>
            <h3 class="angel-name">${card.name}</h3>
            <div class="angel-theme">${card.theme}</div>
        </div>
    `;
}

function animateCardTilt(inner, transform) {
    if (!inner) return;
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

function getDailyCardFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('daily_card');
    if (!slug) return null;

    const sourceCard = getStoredDailyCard(slug) || DAILY_CARD_FALLBACKS[slug];
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

    return { action, response };
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
        <button id="favorite-angel-card-btn" class="btn btn--glass favorite-reading-action__button">
            <span class="favorite-icon">☆</span> Přidat do oblíbených
        </button>
    `;
    container.appendChild(action);

    action.querySelector('#favorite-angel-card-btn')?.addEventListener('click', async () => {
        if (typeof window.toggleFavorite === 'function') {
            await window.toggleFavorite(readingId, 'favorite-angel-card-btn');
        }
    });
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

    const { response } = ensureDeepInsightElements();
    const button = document.getElementById('btn-deep-angel');
    if (!response || !button) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Andělé předávají vhled...';
    response.hidden = false;
    response.textContent = 'Naslouchám poselství karty...';

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        const res = await fetch(`${apiBase()}/angel-card`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({
                card: drawnCard,
                intention: 'hluboký vhled k andělské kartě'
            })
        });

        const data = await res.json();

        if (res.status === 401 || res.status === 402 || res.status === 403 || data.isTeaser) {
            startAngelUpgradeFlow('angel_card_api_gate', 'login');
            response.hidden = true;
            return;
        }

        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Nepodařilo se načíst hluboký vhled.');
        }

        renderDeepInsightText(response, data.response);

        if (window.Auth?.saveReading) {
            const saveResult = await window.Auth.saveReading('angel-card', {
                card: {
                    name: drawnCard.name,
                    theme: drawnCard.theme,
                    message: drawnCard.message
                },
                intention: 'hluboký vhled k andělské kartě',
                response: data.response,
                fallback: !!data.fallback
            });

            if (saveResult?.id) {
                appendFavoriteAction(response, saveResult.id);
            }
        }

        scrollAngelResultsIntoView();
    } catch (error) {
        console.error('Angel deep insight failed:', error);
        response.textContent = 'Hluboký vhled se teď nepodařilo načíst. Zkuste to prosím znovu.';
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load card database
    try {
        const res = await fetch('/data/angel-cards.json');
        if (!res.ok) throw new Error('Nepodařilo se načíst databázi karet.');
        angelCardsData = await res.json();
    } catch (error) {
        console.error('Error loading angel cards:', error);
        alert('Došlo k chybě při načítání karet. Zkuste prosím obnovit stránku.');
        return;
    }

    // 2. Homepage daily-card deep links are already a chosen card, so open them revealed.
    const linkedDailyCard = getDailyCardFromUrl();
    if (linkedDailyCard) {
        drawnCard = linkedDailyCard;
        revealPreDrawnCard({
            message: `Tvoje andělská karta: ${linkedDailyCard.name}`
        });
    } else {
        checkDailyLock();
    }

    // 3. Attach listeners
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

    const shareBtn = document.getElementById('btn-share-card');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareCard);
    }

    window.addEventListener('mh_cookie_banner_visible', () => {
        scheduleMobileAngelResultsScroll();
    });
});

function drawAngelCardImage(card) {
    const shareImage = window.MH_SHARE_IMAGE;
    const canvas = shareImage.createCanvas();
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const seed = String(card.name || '').length * 29 + String(card.theme || '').length;

    shareImage.drawBrandBackground(ctx, canvas, seed);

    ctx.fillStyle = '#f1d06b';
    ctx.font = '700 52px Cinzel, Georgia, serif';
    ctx.fillText('ANDĚLSKÁ KARTA', centerX, 244);

    ctx.font = '160px serif';
    ctx.fillText('🕊️', centerX, 470);

    ctx.fillStyle = '#fff7d6';
    ctx.font = '700 58px Cinzel, Georgia, serif';
    let y = shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, card.name || '', 860), centerX, 590, 68, 2);

    if (card.theme) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '600 36px Inter, Arial, sans-serif';
        ctx.fillText(card.theme, centerX, y + 26);
        y += 74;
    }

    ctx.fillStyle = 'rgba(212,175,55,0.86)';
    ctx.fillRect(170, y + 12, 740, 3);
    y += 78;

    const message = card.short_message || card.message || '';
    if (message) {
        ctx.fillStyle = '#f6f1ff';
        ctx.font = '500 38px Inter, Arial, sans-serif';
        shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, message, 840), centerX, y, 50, 5);
    }

    shareImage.drawFooter(ctx, canvas, 'mystickahvezda.cz/andelske-karty.html',
        'Vytáhni si svou andělskou kartu na dnešek.');

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
            const canvas = drawAngelCardImage(drawnCard);
            await window.MH_SHARE_IMAGE.shareOrDownload({
                canvas,
                fileName: 'andelska-karta.png',
                shareTitle: `Moje andělská karta: ${drawnCard.name}`,
                shareText: `Dnes mě provází anděl ${drawnCard.name} (${drawnCard.theme}). Vytáhni si svou kartu na mystickahvezda.cz`,
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

    const shareTitle = `Moje andělská karta: ${drawnCard.name} ✨`;
    const shareText = `Dnes mě provází anděl ${drawnCard.name} s tématem: ${drawnCard.theme}. Zjisti, jaká karta čeká na tebe na Mystické Hvězdě! 🕊️`;
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
    const today = new Date().toISOString().split('T')[0];
    const savedDataStr = localStorage.getItem('angelCardDaily');

    if (savedDataStr) {
        try {
            const savedData = JSON.parse(savedDataStr);
            if (savedData.date === today && savedData.cardData) {
                // User already drew a card today
                drawnCard = savedData.cardData;
                revealPreDrawnCard();
            } else {
                // Different day, clear the old reading to be safe
                localStorage.removeItem('angelCardDaily');
            }
        } catch (e) {
            console.error('Error parsing daily card:', e);
            localStorage.removeItem('angelCardDaily');
        }
    }
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
    if (container.classList.contains('is-flipped')) return; // Already drawn

    const hasPreselectedDailyCard = Boolean(drawnCard?.isDailyCardDetail);

    if (!hasPreselectedDailyCard) {
        // Select random card
        const randomIndex = Math.floor(Math.random() * angelCardsData.length);
        drawnCard = angelCardsData[randomIndex];

        // Save to Daily Lock
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('angelCardDaily', JSON.stringify({
            date: today,
            cardData: drawnCard
        }));
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

    // Show results section after flip completes smoothly
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
    }, 800);
}
