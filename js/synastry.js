/**
 * Mystická Hvězda - Synastry Calculator (AI-Powered)
 * Uses the server AI API for detailed relationship analysis.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSynastry();
});

const SYNASTRY_FEATURE = 'partnerska_detail';
const SYNASTRY_PLAN_ID = 'pruvodce';
const SYNASTRY_RESULT_SOURCE = 'partner_match_result';
const SYNASTRY_PAYMENT_REASSURANCE = 'Členství: 7 dní za 0 Kč, potom automaticky 199 Kč/měsíc, pokud ho nezrušíš. K aktivaci je potřeba karta. Zrušení v profilu.';
const PERSONAL_MAP_PRODUCT_ID = 'osobni_mapa_2026';
const PERSONAL_MAP_PRODUCT_TYPE = 'personal_map';
let personalMapOfferViewed = false;
let latestSynastryResultScores = null;
let relationshipTarotOfferViewed = false;
let relationshipTarotOfferObserver = null;
const scoreAnimationTimers = new Map();

function resetSynastryResult() {
    for (const timer of scoreAnimationTimers.values()) clearInterval(timer);
    scoreAnimationTimers.clear();
    relationshipTarotOfferObserver?.disconnect();
    lastSynastryShareData = null;
    latestSynastryResultScores = null;
    for (const id of ['synastry-results', 'synastry-next-step', 'ai-synastry']) {
        setBlockVisible(document.getElementById(id), false);
    }
    document.getElementById('synastry-share-image-btn')?.remove();
    document.getElementById('synastry-engine-summary')?.remove();
    document.getElementById('ai-synastry')?.remove();
    for (const id of ['total-score', 'score-emotion', 'score-comm', 'score-passion', 'score-stability', 'synastry-next-score', 'verdict-text']) {
        const element = document.getElementById(id);
        if (element) element.textContent = '';
    }
}

function setSynastryCalculationError(message = '') {
    let status = document.getElementById('synastry-calculation-status');
    if (!status) {
        status = document.createElement('p');
        status.id = 'synastry-calculation-status';
        status.setAttribute('role', 'alert');
        document.getElementById('synastry-form')?.append(status);
    }
    status.textContent = message;
    status.hidden = !message;
}

function getRelationshipTarotFlowId() {
    const key = 'mh_relationship_flow_id';
    const valid = value => typeof value === 'string' && /^[a-z0-9_-]{16,80}$/i.test(value);
    try {
        const stored = sessionStorage.getItem(key);
        if (valid(stored)) return stored;
        const generated = globalThis.crypto?.randomUUID?.()
            || `mh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
        sessionStorage.setItem(key, generated);
        return generated;
    } catch {
        return `mh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
    }
}

function reportRelationshipTarotEvent(eventName) {
    const flowId = getRelationshipTarotFlowId();
    const metadata = {
        product_id: 'relationship_tarot',
        product_type: 'relationship_tarot',
        price: 149,
        currency: 'CZK',
        flow_id: flowId,
        funnel_step: 'entry_offer',
        placement: 'synastry_result_next_step',
        entry_feature: SYNASTRY_FEATURE
    };
    try {
        window.MH_ANALYTICS?.trackEvent?.(eventName, {
            source: SYNASTRY_RESULT_SOURCE,
            feature: 'relationship_tarot',
            ...metadata
        });
    } catch { /* Funnel analytics must not affect the free result. */ }

    void Promise.resolve().then(() => window.getCSRFToken?.()).then(csrfToken => {
        if (!csrfToken) return;
        return fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/payment/funnel-event`, {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
            body: JSON.stringify({
                eventName,
                source: SYNASTRY_RESULT_SOURCE,
                feature: 'relationship_tarot',
                planType: 'relationship_tarot',
                metadata
            })
        });
    }).catch(() => { /* Telemetry must never block the free result or navigation. */ });
}

function observeRelationshipTarotOffer() {
    const offer = document.querySelector('[data-relationship-tarot-offer]');
    if (!offer || offer.hidden || relationshipTarotOfferViewed || !('IntersectionObserver' in window)) return;
    relationshipTarotOfferObserver?.disconnect();
    relationshipTarotOfferObserver = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.4)) return;
        relationshipTarotOfferViewed = true;
        relationshipTarotOfferObserver?.disconnect();
        reportRelationshipTarotEvent('one_time_offer_viewed');
    }, { threshold: 0.4 });
    relationshipTarotOfferObserver.observe(offer);
}

function loadRelationshipTarotOfferAvailability() {
    const offer = document.querySelector('[data-relationship-tarot-offer]');
    const membership = document.querySelector('[data-synastry-upgrade]');
    if (!offer || !membership) return;

    const showOffer = enabled => {
        offer.hidden = !enabled;
        membership.hidden = enabled;
        if (enabled) observeRelationshipTarotOffer();
    };

    fetch('/api/vztahovy-vyklad/product', { cache: 'no-store' }).then(async response => {
        if (!response.ok) throw new Error('Relationship reading availability is unavailable.');
        const product = await response.json();
        showOffer(product.enabled === true && product.amount === 14900 && product.currency === 'czk');
    }).catch(() => showOffer(false));
}

function buildSynastryUpgradeUrl(source = 'synastry_teaser_overlay') {
    const authUrl = new URL('/prihlaseni.html', window.location.origin);
    authUrl.searchParams.set('mode', 'register');
    authUrl.searchParams.set('redirect', '/cenik.html');
    authUrl.searchParams.set('plan', SYNASTRY_PLAN_ID);
    authUrl.searchParams.set('source', source);
    authUrl.searchParams.set('feature', SYNASTRY_FEATURE);
    authUrl.searchParams.set('entry_source', source);
    authUrl.searchParams.set('entry_feature', SYNASTRY_FEATURE);
    return `${authUrl.pathname}${authUrl.search}`;
}

function getSynastryAttribution() {
    const params = new URLSearchParams(window.location.search);
    return {
        source: params.get('source') || 'partnerska_shoda_page',
        feature: params.get('feature') || SYNASTRY_FEATURE
    };
}

async function trackSynastryFunnelEvent(eventName, source, metadata = {}) {
    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!csrfToken) return;

        await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/payment/funnel-event`, {
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
                feature: SYNASTRY_FEATURE,
                planId: SYNASTRY_PLAN_ID,
                metadata: {
                    path: window.location.pathname,
                    ...metadata
                }
            })
        });
    } catch (error) {
        console.warn('[Synastry funnel] Could not record event:', error.message);
    }
}

async function trackPersonalMapOfferEvent(eventName, metadata = {}) {
    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!csrfToken) return;

        await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/payment/funnel-event`, {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                eventName,
                source: SYNASTRY_RESULT_SOURCE,
                feature: PERSONAL_MAP_PRODUCT_ID,
                planId: PERSONAL_MAP_PRODUCT_ID,
                planType: PERSONAL_MAP_PRODUCT_TYPE,
                metadata: {
                    product_id: PERSONAL_MAP_PRODUCT_ID,
                    product_type: PERSONAL_MAP_PRODUCT_TYPE,
                    entry_feature: SYNASTRY_FEATURE,
                    placement: 'synastry_result_next_step',
                    suggested_focus_area: 'relationships',
                    path: window.location.pathname,
                    ...metadata
                }
            })
        });
    } catch (error) {
        console.warn('[Synastry personal map funnel] Could not record event:', error.message);
    }
}

function trackPersonalMapOfferView(scores) {
    const offer = document.querySelector('[data-personal-map-offer]');
    if (personalMapOfferViewed || !offer) return;
    const disclosure = offer.closest('details');
    if (disclosure && !disclosure.open) return;
    personalMapOfferViewed = true;

    window.MH_ANALYTICS?.trackEvent?.('personal_map_offer_viewed', {
        source: SYNASTRY_RESULT_SOURCE,
        feature: PERSONAL_MAP_PRODUCT_ID,
        placement: 'synastry_result_next_step',
        suggested_focus_area: 'relationships',
        total_score: scores?.totalScore ?? null
    });
    void trackPersonalMapOfferEvent('one_time_product_viewed', {
        total_score: scores?.totalScore ?? null
    });
}

function startSynastryUpgradeFlow(source) {
    window.MH_ANALYTICS?.trackCTA?.(source, {
        plan_id: SYNASTRY_PLAN_ID,
        feature: SYNASTRY_FEATURE
    });
    void trackSynastryFunnelEvent('paywall_cta_clicked', source, {
        destination: '/cenik.html'
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout(SYNASTRY_PLAN_ID, {
            source,
            feature: SYNASTRY_FEATURE,
            metadata: {
                entry_source: source,
                entry_feature: SYNASTRY_FEATURE
            },
            redirect: '/cenik.html',
            authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
        });
        return;
    }

    window.location.href = buildSynastryUpgradeUrl(source);
}

function getSynastryUpgradeLabel(context = 'detail') {
    return context === 'teaser'
        ? 'Odemknout plný vztahový rozbor'
        : 'Odemknout detailní rozbor';
}

function getSynastryPaymentReassuranceHtml() {
    return `<p class="synastry-upgrade-reassurance">${SYNASTRY_PAYMENT_REASSURANCE}</p>`;
}

function setBlockVisible(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('mh-block-visible', visible);
}

function setFlexVisible(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('mh-flex-visible', visible);
}

function animateScale(element, axis, value, duration = 1000) {
    if (!element) return;
    element.animate([
        { transform: `${axis}(0)` },
        { transform: `${axis}(${value})` }
    ], {
        duration,
        easing: 'ease-out',
        fill: 'forwards'
    });
}

function normalizeServerSynastryScores(scores) {
    if (!scores || typeof scores !== 'object') return null;
    const values = ['total', 'emotion', 'communication', 'passion', 'stability'].map(key => scores[key]);
    if (!values.every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100)) return null;

    const normalized = {
        totalScore: Number(scores.total),
        emotionScore: Number(scores.emotion),
        commScore: Number(scores.communication),
        passionScore: Number(scores.passion),
        stabilityScore: Number(scores.stability)
    };

    return Object.values(normalized).every(Number.isFinite) ? normalized : null;
}

function optionalInputValue(id) {
    const value = document.getElementById(id)?.value?.trim();
    return value || undefined;
}

function formatPrecisionLabel(precision) {
    const labels = {
        birth_time_location_timezone: 'čas + rozpoznané místo',
        birth_time_utc: 'čas bez rozpoznaného místa',
        date_noon_location_timezone: 'datum + místo, bez přesného času',
        date_noon_utc: 'pouze datum'
    };

    return labels[precision] || 'neurčená přesnost';
}

function formatSynastryChartLine(person, fallbackName) {
    const chart = person?.chart;
    const summary = chart?.summary || {};
    const location = chart?.location?.name || 'místo nerozpoznáno';
    const ascendant = summary.ascendantSign || 'bez ascendentu';
    const sun = summary.sunSign || '--';
    const moon = summary.moonSign || '--';

    return `${person?.name || fallbackName}: Slunce ${sun}, Měsíc ${moon}, ASC ${ascendant}, ${location}`;
}

function renderSynastryEngineSummary(container, synastry) {
    const existing = document.getElementById('synastry-engine-summary');
    if (existing) existing.remove();
    if (!container || !synastry?.engine) return;

    const summary = document.createElement('article');
    summary.id = 'synastry-engine-summary';
    summary.className = 'synastry-engine-summary';

    const header = document.createElement('div');
    header.className = 'synastry-engine-summary__header';

    const title = document.createElement('h4');
    title.textContent = 'Astro výpočet vztahu';

    const badge = document.createElement('span');
    badge.className = 'synastry-engine-summary__badge';
    badge.textContent = formatPrecisionLabel(synastry.engine.precision);

    header.append(title, badge);

    const list = document.createElement('ul');
    list.className = 'synastry-engine-summary__list';

    [
        formatSynastryChartLine(synastry.person1, 'Osoba A'),
        formatSynastryChartLine(synastry.person2, 'Osoba B')
    ].forEach((line) => {
        const item = document.createElement('li');
        item.textContent = line;
        list.appendChild(item);
    });

    const note = document.createElement('p');
    note.className = 'synastry-engine-summary__note';
    note.textContent = 'Přesnější čas a rozpoznané město zpřístupní ascendent, domy a stabilnější vztahové skóre.';

    summary.append(header, list, note);

    const firstGrid = container.querySelector('.grid');
    if (firstGrid?.nextSibling) {
        container.insertBefore(summary, firstGrid.nextSibling);
    } else {
        container.appendChild(summary);
    }
}

function appendSynastryFavoriteAction(container, readingId) {
    if (!container || !readingId) return;

    document.getElementById('favorite-synastry-action')?.remove();

    const action = document.createElement('div');
    action.id = 'favorite-synastry-action';
    action.className = 'text-center favorite-reading-action mt-md';
    action.innerHTML = `
        <button id="favorite-synastry-btn" class="btn btn--glass favorite-reading-action__button">
            <span class="favorite-icon">☆</span> Přidat do oblíbených
        </button>
    `;
    container.appendChild(action);

    action.querySelector('#favorite-synastry-btn')?.addEventListener('click', async () => {
        if (typeof window.toggleFavorite === 'function') {
            await window.toggleFavorite(readingId, 'favorite-synastry-btn');
        }
    });
}

function applySynastryScores(scores, showDetails) {
    if (!scores) return;

    const totalElement = document.getElementById('total-score');
    if (totalElement) totalElement.textContent = `${scores.totalScore}%`;

    const heartFill = document.getElementById('heart-anim');
    if (heartFill) {
        animateScale(heartFill, 'scaleY', scores.totalScore / 100, 1);
    }

    if (!showDetails) return;

    const detailMap = [
        ['score-emotion', 'bar-emotion', scores.emotionScore],
        ['score-comm', 'bar-comm', scores.commScore],
        ['score-passion', 'bar-passion', scores.passionScore],
        ['score-stability', 'bar-stability', scores.stabilityScore]
    ];

    detailMap.forEach(([scoreId, barId, value]) => {
        const scoreElement = document.getElementById(scoreId);
        const barElement = document.getElementById(barId);
        if (scoreElement) scoreElement.textContent = `${value}%`;
        if (barElement) animateScale(barElement, 'scaleX', value / 100, 1);
    });
}

async function fetchCalculatedSynastry(person1, person2) {
    if (!window.callAPI) return null;
    const data = await window.callAPI('/synastry/calculate', { person1, person2 });
    return data.synastry || null;
}

function trackSynastryCalculation(scores, synastry) {
    const attribution = getSynastryAttribution();
    window.MH_ANALYTICS?.trackEvent?.('synastry_calculated', {
        source: attribution.source,
        feature: attribution.feature,
        engine_version: synastry?.engine?.version || null,
        precision: synastry?.engine?.precision || null,
        person1_precision: synastry?.engine?.person1Precision || null,
        person2_precision: synastry?.engine?.person2Precision || null,
        person1_location_resolved: Boolean(synastry?.person1?.chart?.location),
        person2_location_resolved: Boolean(synastry?.person2?.chart?.location),
        total_score: scores?.totalScore ?? null,
        emotion_score: scores?.emotionScore ?? null,
        communication_score: scores?.commScore ?? null,
        passion_score: scores?.passionScore ?? null,
        stability_score: scores?.stabilityScore ?? null,
        cross_aspects_count: Array.isArray(synastry?.crossAspects) ? synastry.crossAspects.length : 0
    });
}

function revealSynastryNextStep(scores, synastry, isPremium) {
    latestSynastryResultScores = scores;
    const section = document.getElementById('synastry-next-step');
    if (!section) return;

    const score = Number.isFinite(scores?.totalScore) ? `${scores.totalScore}%` : '--';
    const scoreElement = document.getElementById('synastry-next-score');
    if (scoreElement) scoreElement.textContent = score;

    setBlockVisible(section, true);
    observeRelationshipTarotOffer();
    trackPersonalMapOfferView(scores);

    window.MH_ANALYTICS?.trackEvent?.('synastry_result_bridge_viewed', {
        source: SYNASTRY_RESULT_SOURCE,
        feature: SYNASTRY_FEATURE,
        total_score: scores?.totalScore ?? null,
        precision: synastry?.engine?.precision || null,
        premium: Boolean(isPremium)
    });

    if (!isPremium) {
        void trackSynastryFunnelEvent('paywall_viewed', SYNASTRY_RESULT_SOURCE, {
            total_score: scores?.totalScore ?? null,
            precision: synastry?.engine?.precision || null
        });
    }
}

let lastSynastryShareData = null;

function buildSynastryShareVerdict(totalScore) {
    if (totalScore > 85) return 'Velmi silná shoda s výraznou vzájemnou podporou.';
    if (totalScore > 70) return 'Velmi silný pár s harmonickými aspekty.';
    if (totalScore > 55) return 'Slibné spojení, které stojí za hlubší pohled.';
    return 'Spojení plné kontrastů — a příležitostí k růstu.';
}

function firstNameOf(person, fallback) {
    const name = String(person?.name || '').trim();
    return name ? name.split(/\s+/)[0] : fallback;
}

async function drawSynastryResultCard({ person1, person2, scores }) {
    const shareImage = window.MH_SHARE_IMAGE;
    const canvas = shareImage.createCanvas();
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const totalScore = Number(scores?.totalScore) || 0;
    const nameA = firstNameOf(person1, 'Osoba A');
    const nameB = firstNameOf(person2, 'Osoba B');

    await shareImage.drawBrandBackground(ctx, canvas);

    ctx.fillStyle = '#d0b17c';
    ctx.font = '700 52px Cinzel, Georgia, serif';
    ctx.fillText('PARTNERSKÁ SHODA', centerX, 250);

    ctx.fillStyle = '#fff7d6';
    ctx.font = '700 58px Cinzel, Georgia, serif';
    shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, `${nameA} & ${nameB}`, 860), centerX, 400, 68, 2, 860);

    ctx.fillStyle = totalScore > 70 ? '#b9f3c2' : (totalScore > 55 ? '#d0b17c' : '#ff9ea8');
    ctx.font = '700 190px Cinzel, Georgia, serif';
    ctx.fillText(`${totalScore}%`, centerX, 720);

    ctx.fillStyle = '#e9e3d7';
    ctx.font = '500 38px Inter, Arial, sans-serif';
    let y = shareImage.drawCenteredLines(
        ctx,
        shareImage.wrapText(ctx, buildSynastryShareVerdict(totalScore), 840),
        centerX,
        830,
        50,
        3,
        840
    );

    ctx.fillStyle = 'rgba(189,155,101,0.86)';
    ctx.fillRect(170, y + 24, 740, 3);

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '500 30px Inter, Arial, sans-serif';
    ctx.fillText('Vypočítáno z data narození podle astrologické synastrie.', centerX, y + 96);

    shareImage.drawFooter(ctx, canvas, 'mystickahvezda.cz/partnerska-shoda.html',
        'Spočítej shodu se svým protějškem.');

    return canvas;
}

async function onSynastryImageShareClick(event) {
    const button = event.currentTarget;
    if (!lastSynastryShareData || !window.MH_SHARE_IMAGE?.shareOrDownload) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Připravuji obrázek...';

    try {
        const canvas = await drawSynastryResultCard(lastSynastryShareData);
        const totalScore = Number(lastSynastryShareData.scores?.totalScore) || 0;
        await window.MH_SHARE_IMAGE.shareOrDownload({
            canvas,
            fileName: 'partnerska-shoda.png',
            shareTitle: 'Partnerská shoda',
            shareText: `Naše partnerská shoda vyšla na ${totalScore} %. Spočítej si tu svoji na mystickahvezda.cz`,
            eventBase: 'partner_match_image',
            metadata: {
                source: SYNASTRY_RESULT_SOURCE,
                feature: SYNASTRY_FEATURE,
                total_score: totalScore
            }
        });
    } catch (error) {
        console.warn('[Synastry] Image share failed:', error.message);
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

function setupSynastryImageShare(person1, person2, scores) {
    if (!window.MH_SHARE_IMAGE?.shareOrDownload) return;

    lastSynastryShareData = { person1, person2, scores };

    const verdict = document.getElementById('verdict-text');
    const host = verdict?.parentElement;
    if (!host) return;

    let button = document.getElementById('synastry-share-image-btn');
    if (!button) {
        button = document.createElement('button');
        button.id = 'synastry-share-image-btn';
        button.type = 'button';
        button.className = 'btn btn--ghost mt-md';
        button.textContent = 'Uložit obrázek shody';
        button.addEventListener('click', onSynastryImageShareClick);
        host.appendChild(button);
    }
}

function bindSynastryNextStepLinks() {
    document.querySelectorAll('[data-relationship-tarot-offer]').forEach(link => {
        link.addEventListener('click', () => {
            const flowId = getRelationshipTarotFlowId();
            try {
                sessionStorage.setItem('mh_relationship_entry_click', JSON.stringify({
                    source: SYNASTRY_RESULT_SOURCE,
                    flowId,
                    placement: 'synastry_result_next_step',
                    at: Date.now()
                }));
            } catch { /* Navigation remains available when storage is disabled. */ }
            window.MH_ANALYTICS?.trackCTA?.('partner_relationship_reading', {
                source: SYNASTRY_RESULT_SOURCE,
                feature: 'relationship_tarot',
                product_id: 'relationship_tarot',
                destination: link.getAttribute('href') || null
            });
        });
    });

    document.querySelectorAll('[data-synastry-upgrade]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            startSynastryUpgradeFlow(link.dataset.synastrySource || SYNASTRY_RESULT_SOURCE);
        });
    });

    document.querySelectorAll('[data-synastry-intent]').forEach((link) => {
        link.addEventListener('click', () => {
            window.MH_ANALYTICS?.trackEvent?.('synastry_result_intent_clicked', {
                source: 'partner_match_intent',
                feature: link.dataset.synastryIntent || null,
                destination: link.getAttribute('href') || null
            });
        });
    });

    document.querySelectorAll('[data-personal-map-offer]').forEach((link) => {
        const disclosure = link.closest('details');
        disclosure?.addEventListener('toggle', () => {
            if (disclosure.open && latestSynastryResultScores) {
                trackPersonalMapOfferView(latestSynastryResultScores);
            }
        });
        link.addEventListener('click', () => {
            const destination = link.getAttribute('href') || null;
            window.MH_ANALYTICS?.trackCTA?.('partner_match_personal_map', {
                source: SYNASTRY_RESULT_SOURCE,
                feature: PERSONAL_MAP_PRODUCT_ID,
                product_id: PERSONAL_MAP_PRODUCT_ID,
                product_type: PERSONAL_MAP_PRODUCT_TYPE,
                destination
            });
            void trackPersonalMapOfferEvent('one_time_product_cta_clicked', { destination });
        });
    });
}

function initSynastry() {
    const form = document.getElementById('synastry-form');
    if (!form) return;

    bindSynastryNextStepLinks();
    loadRelationshipTarotOfferAvailability();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await calculateCompatibility();
    });

    // Handle "Use my profile" checkbox
    const useProfileCheckbox = document.getElementById('use-profile-p1');
    if (useProfileCheckbox) {
        useProfileCheckbox.addEventListener('change', async (e) => {
            const nameInput = document.getElementById('p1-name');
            const dateInput = document.getElementById('p1-date');
            const timeInput = document.getElementById('p1-time');
            const placeInput = document.getElementById('p1-place');

            if (e.target.checked) {
                if (!window.Auth?.isLoggedIn()) {
                    window.Auth?.showToast?.('Info', 'Pro použití profilu se prosím přihlaste.', 'info');
                    e.target.checked = false;
                    return;
                }

                try {
                    const user = await window.Auth.getProfile();
                    if (!user) throw new Error('Failed to load profile');

                    if (user.first_name) nameInput.value = user.first_name;

                    if (user.birth_date) {
                        try {
                            const d = new Date(user.birth_date);
                            if (!isNaN(d.getTime())) {
                                dateInput.value = d.toISOString().split('T')[0];
                            } else {
                                dateInput.value = user.birth_date;
                            }
                        } catch (parseErr) {
                            dateInput.value = user.birth_date;
                        }
                    }

                    if (user.birth_time && timeInput) {
                        const time = user.birth_time.toString();
                        timeInput.value = time.length > 5 ? time.substring(0, 5) : time;
                    }

                    if (user.birth_place && placeInput) {
                        placeInput.value = user.birth_place;
                    }
                } catch (error) {
                    console.error('Synastry Autofill Error:', error);
                    window.Auth?.showToast?.('Chyba', 'Nepodařilo se načíst data.', 'error');
                    e.target.checked = false;
                }
            }
        });
    }
    // Check visibility on load & auth change
    updateProfileVisibility();
    document.addEventListener('auth:changed', updateProfileVisibility);
    document.addEventListener('auth:refreshed', updateProfileVisibility); // Handle status changes too
}

function updateProfileVisibility() {
    const wrapper = document.getElementById('profile-option-wrapper');
    if (!wrapper) return;

    if (window.Auth && window.Auth.isLoggedIn()) {
        setFlexVisible(wrapper, true);
    } else {
        setFlexVisible(wrapper, false);
        // Uncheck if hidden
        const checkbox = document.getElementById('use-profile-p1');
        if (checkbox) checkbox.checked = false;
    }
}

async function calculateCompatibility() {
    const btn = document.querySelector('#synastry-form button');
    const resultsDiv = document.getElementById('synastry-results');
    const originalText = btn.textContent;

    btn.textContent = 'Analyzuji hvězdy...';
    btn.disabled = true;
    resetSynastryResult();
    setSynastryCalculationError();

    // Get form data
    const person1 = {
        name: document.getElementById('p1-name').value,
        birthDate: document.getElementById('p1-date').value,
        birthTime: optionalInputValue('p1-time'),
        birthPlace: optionalInputValue('p1-place')
    };
    const person2 = {
        name: document.getElementById('p2-name').value,
        birthDate: document.getElementById('p2-date').value,
        birthTime: optionalInputValue('p2-time'),
        birthPlace: optionalInputValue('p2-place')
    };

    let displayedScores;
    let calculatedSynastry = null;

    try {
        calculatedSynastry = await fetchCalculatedSynastry(person1, person2);
        displayedScores = normalizeServerSynastryScores(calculatedSynastry?.scores);
        if (!displayedScores) throw new Error('Missing or invalid synastry scores');
    } catch (calculationError) {
        console.warn('Synastry calculation unavailable:', calculationError.message);
        setSynastryCalculationError('Partnerskou shodu se teď nepodařilo vypočítat. Zadané údaje zůstaly vyplněné; zkus výpočet znovu.');
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }
    try { trackSynastryCalculation(displayedScores, calculatedSynastry); } catch { /* Analytics must not prevent a valid result. */ }

    const viewerProfile = window.Auth?.isLoggedIn?.() ? await window.Auth.getProfile() : null;
    const hasActiveSession = !!viewerProfile;

    // Show results with animation
    setBlockVisible(resultsDiv, true);
    renderSynastryEngineSummary(resultsDiv, calculatedSynastry);
    resultsDiv.scrollIntoView({ behavior: 'smooth' });

    // Animate scores
    // Check Premium Status for Visuals
    const isPremium = hasActiveSession && window.Auth && window.Auth.isPremium();

    // Animate Total Score (Always visible)
    animateValue('total-score', 0, displayedScores.totalScore, 2000);
    const heartFill = document.getElementById('heart-anim');
    if (heartFill) {
        animateScale(heartFill, 'scaleY', displayedScores.totalScore / 100, 1500);
    }

    // Detailed Scores - Gated
    const cardTitle = document.querySelector('.card__title');
    const detailCard = cardTitle ? cardTitle.closest('.card') : null;
    if (!detailCard) {
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }

    revealSynastryNextStep(displayedScores, calculatedSynastry, isPremium);
    setupSynastryImageShare(person1, person2, displayedScores);

    // Reset previous state
    const existingOverlay = detailCard.querySelector('.premium-lock-overlay');
    if (existingOverlay) existingOverlay.remove();
    detailCard.classList.remove('blur-content');

    if (isPremium) {
        // Show Real Data
        animateValue('score-emotion', 0, displayedScores.emotionScore, 1500);
        animateValue('score-comm', 0, displayedScores.commScore, 1700);
        animateValue('score-passion', 0, displayedScores.passionScore, 1900);
        animateValue('score-stability', 0, displayedScores.stabilityScore, 2100);

        animateScale(document.getElementById('bar-emotion'), 'scaleX', displayedScores.emotionScore / 100);
        animateScale(document.getElementById('bar-comm'), 'scaleX', displayedScores.commScore / 100);
        animateScale(document.getElementById('bar-passion'), 'scaleX', displayedScores.passionScore / 100);
        animateScale(document.getElementById('bar-stability'), 'scaleX', displayedScores.stabilityScore / 100);
    } else {
        // Soft Gate - Obscure Details
        document.getElementById('score-emotion').textContent = '🔒';
        document.getElementById('score-comm').textContent = '🔒';
        document.getElementById('score-passion').textContent = '🔒';
        document.getElementById('score-stability').textContent = '🔒';

        animateScale(document.getElementById('bar-emotion'), 'scaleX', 0);
        animateScale(document.getElementById('bar-comm'), 'scaleX', 0);
        animateScale(document.getElementById('bar-passion'), 'scaleX', 0);
        animateScale(document.getElementById('bar-stability'), 'scaleX', 0);

        // Add Overlay
        detailCard.classList.add('premium-lock-host');

        const overlay = document.createElement('div');
        overlay.className = 'premium-lock-overlay';
        overlay.innerHTML = `
            <div class="lock-icon">🔒</div>
            <h3 class="synastry-lock-title">Detailní rozbor</h3>
            <p class="synastry-lock-copy">Emoce, komunikace a vášeň jsou dostupné v členství Mystické Hvězdy.</p>
            <button class="btn btn--primary btn--sm mt-md synastry-upgrade-btn">${getSynastryUpgradeLabel('detail')}</button>
            ${getSynastryPaymentReassuranceHtml()}
        `;
        detailCard.appendChild(overlay);

        overlay.querySelector('.synastry-upgrade-btn').addEventListener('click', () => {
            startSynastryUpgradeFlow('synastry_detail_lock');
        });
    }



    // Get or create AI results container
    let aiResultsDiv = document.getElementById('ai-synastry');
    if (!aiResultsDiv) {
        aiResultsDiv = createAIResultsContainer();
    }
    setBlockVisible(aiResultsDiv, false);

    if (!hasActiveSession) {
        document.getElementById('total-score').textContent = `${displayedScores.totalScore}%`;
        document.getElementById('verdict-text').textContent =
            `Celková kompatibilita ${displayedScores.totalScore}% - `;
        setBlockVisible(aiResultsDiv, true);
        renderTeaser(aiResultsDiv, displayedScores.totalScore);
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }

    try {
        // Call AI for detailed analysis
        btn.textContent = 'Generuji hlubokou analýzu...';

        // Call API via Auth Wrapper (Protected)
        const response = await window.Auth.fetchProtected('synastry', {
            person1,
            person2
        });
        const data = await response.json();

        if (data.success) {
            const serverScores = normalizeServerSynastryScores(data.synastry?.scores);
            if (serverScores) {
                displayedScores = serverScores;
                calculatedSynastry = data.synastry;
                applySynastryScores(displayedScores, isPremium && !data.isTeaser);
                renderSynastryEngineSummary(resultsDiv, calculatedSynastry);
                setupSynastryImageShare(person1, person2, displayedScores);
            }

            // Update verdict
            document.getElementById('verdict-text').textContent =
                `Celková kompatibilita ${displayedScores.totalScore}% - `;

            // Show AI interpretation
            setBlockVisible(aiResultsDiv, true);

            if (data.isTeaser) {
                // RENDER TEASER (Blurred)
                document.getElementById('total-score').textContent = `${displayedScores.totalScore}%`;
                renderTeaser(aiResultsDiv, displayedScores.totalScore);
            } else {
                // RENDER FULL CONTENT
                const contentDiv = aiResultsDiv.querySelector('.ai-content');
                // Remove blur classes if they exist from previous runs
                contentDiv.classList.remove('blur-content');
                const overlay = aiResultsDiv.querySelector('.teaser-overlay');
                if (overlay) overlay.remove();

                await typewriterEffect(contentDiv, data.response);

                // Save to history if logged in
                if (window.Auth && window.Auth.saveReading && !data.isTeaser) {
                    try {
                        const saveResult = await window.Auth.saveReading('synastry', {
                            person1,
                            person2,
                            interpretation: data.response,
                            scores: displayedScores,
                            synastry: data.synastry || calculatedSynastry
                        });
                        appendSynastryFavoriteAction(aiResultsDiv, saveResult?.id);
                    } catch (e) {
                        console.warn('Failed to auto-save synastry reading:', e);
                    }
                }
            }
        } else {
            throw new Error(data.error);
        }

    } catch (error) {
        console.error('Synastry Error:', error);

        document.getElementById('verdict-text').textContent = `Celková kompatibilita ${displayedScores.totalScore}%`;

        setBlockVisible(aiResultsDiv, true);
        aiResultsDiv.querySelector('.ai-content').textContent =
            'Výpočet shody je hotový, ale slovní výklad teď není dostupný. Zkus to prosím později.';
    }

    btn.textContent = originalText;
    btn.disabled = false;
}

function createAIResultsContainer() {
    const container = document.createElement('div');
    container.id = 'ai-synastry';
    container.className = 'synastry-ai';
    container.innerHTML = `
        <h4 class="synastry-ai__title">
            Hluboká analýza vztahu
        </h4>
        <div class="ai-content synastry-ai__content"></div>
    `;

    // Insert after synastry-results
    const results = document.getElementById('synastry-results');
    results.appendChild(container);

    return container;
}

async function typewriterEffect(element, text) {
    element.textContent = '';
    const chars = text.split('');
    for (let i = 0; i < chars.length; i++) {
        element.textContent += chars[i];
        if (i % 100 === 0) {
            element.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        await new Promise(resolve => setTimeout(resolve, 15));
    }
}

function renderTeaser(container, totalScore = null) {
    const contentDiv = container.querySelector('.ai-content');
    const scoreLabel = typeof totalScore === 'number' ? `${totalScore}%` : 'základní';
    contentDiv.classList.remove('blur-content');
    container.classList.remove('teaser-overlay-host');
    container.querySelector('.teaser-overlay')?.remove();
    contentDiv.replaceChildren();
    const note = document.createElement('p');
    note.textContent = `Základní skóre ${scoreLabel} je symbolický astrologický pohled, ne měření kvality vztahu. Členský rozbor propojí vypočtené aspekty s tématy komunikace, emocí a vzájemných dohod. Osobní výklad se v bezplatné ukázce negeneruje.`;
    contentDiv.appendChild(note);
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    clearInterval(scoreAnimationTimers.get(id));

    const range = end - start;
    if (range === 0) {
        obj.textContent = end + "%";
        return;
    }

    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.max(1, Math.abs(Math.floor(duration / range)));

    const timer = setInterval(function () {
        current = increment > 0 ? Math.min(end, current + increment) : Math.max(end, current + increment);
        obj.textContent = current + "%";
        if (current === end) {
            clearInterval(timer);
            scoreAnimationTimers.delete(id);
        }
    }, stepTime);
    scoreAnimationTimers.set(id, timer);
}
