/**
 * Mystická Hvězda - Tarot Reading (Predefined Interpretations)
 * Beautiful animations with instant card readings
 */

import { showFallbackNotice, formatReadingHtml } from './utils/reading-display.js';
import { savedTarotCards, tarotCardPosition } from './utils/tarot-reading-data.js';
import { getPragueDateKey } from './utils/prague-date.js';

// Tarot Card Data (Loaded from JSON)
let TAROT_CARDS = {};
// Convert to array for backward compatibility
let TAROT_CARDS_ARRAY = [];
let tarotDataLoading = false;
let tarotInitialized = false;
let originalTarotDeckMarkup = null;
let tarotSpreadButtonDisabledStates = null;
let tarotDeckHint = null;
let originalTarotDeckHintText = '';
let tarotReadingInProgress = false;
let tarotReadingGeneration = 0;
let tarotReadingOwnerId = null;
let tarotSummaryAbortController = null;
let activeTarotReadingSession = null;
let displayedTarotReadingSession = null;
let observedTarotReadingSession = null;
let tarotReadingSessionInitialized = Boolean(window.Auth);
const TAROT_PAYMENT_REASSURANCE = 'Cena se zobraz\u00ed ve Stripe p\u0159ed potvrzen\u00edm. Zru\u0161en\u00ed najdete v profilu.';
const TAROT_YES_NO_UPGRADE_CONTEXT_KEY = 'mh_tarot_yes_no_upgrade_context';
const TAROT_YES_NO_UPGRADE_CONTEXT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function captureTarotReadingSession() {
    const isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());
    return { isLoggedIn, userId: isLoggedIn ? window.Auth?.user?.id : null };
}

function hasSameTarotReadingSession(session) {
    const current = captureTarotReadingSession();
    if (current.isLoggedIn !== session?.isLoggedIn) return false;
    if (!current.isLoggedIn) return true;
    return typeof session.userId === 'string' && session.userId.length > 0 && current.userId === session.userId;
}

function setTarotReadingStatus(message) {
    const status = document.getElementById('tarot-reading-status');
    if (status) status.textContent = message;
}

function showTarotReadingSaveNotice(anchor) {
    if (!anchor?.parentElement) return;
    anchor.parentElement.querySelectorAll('[data-reading-save-error]').forEach((notice) => notice.remove());
    const notice = document.createElement('p');
    notice.dataset.readingSaveError = 'true';
    notice.className = 'result-context-notice tarot-reading-save-error';
    notice.setAttribute('role', 'status');
    notice.textContent = 'Výklad zůstává dostupný tady, ale nepodařilo se ho uložit do profilu.';
    anchor.insertAdjacentElement('afterend', notice);
}

function clearTarotSessionResult() {
    setTarotReadingStatus('');
    const results = document.getElementById('tarot-results');
    if (results) {
        results.classList.add('hidden');
        results.innerHTML = '';
    }
    const deck = document.querySelector('.tarot-deck');
    deck?.classList.remove('shaking', 'tarot-deck--shuffle-scale');
    document.getElementById('tarot-yes-no-resume-context')?.remove();
    document.body.classList.remove('tarot-yes-no-resume-active');
    window.currentTarotReadingId = null;
    displayedTarotReadingSession = null;
    try {
        localStorage.removeItem(TAROT_YES_NO_UPGRADE_CONTEXT_KEY);
    } catch {
        // Clearing visible reading content does not depend on optional storage.
    }
}

function invalidateTarotSessionChange() {
    const current = captureTarotReadingSession();
    if (!tarotReadingSessionInitialized) {
        observedTarotReadingSession = current;
        tarotReadingSessionInitialized = true;
        return;
    }
    const observedChanged = observedTarotReadingSession && !hasSameTarotReadingSession(observedTarotReadingSession);
    const activeChanged = activeTarotReadingSession && !hasSameTarotReadingSession(activeTarotReadingSession);
    const displayedChanged = displayedTarotReadingSession && !hasSameTarotReadingSession(displayedTarotReadingSession);
    observedTarotReadingSession = current;
    if (!observedChanged && !activeChanged && !displayedChanged) return;

    tarotReadingGeneration += 1;
    tarotSummaryAbortController?.abort();
    tarotSummaryAbortController = null;
    activeTarotReadingSession = null;
    clearTarotSessionResult();
}

function isCurrentTarotReading(generation, session) {
    if (generation !== tarotReadingGeneration) return false;
    if (hasSameTarotReadingSession(session)) return true;
    invalidateTarotSessionChange();
    return false;
}

document.addEventListener('auth:changed', invalidateTarotSessionChange);
window.addEventListener('storage', event => {
    if (event.key === 'auth_user') invalidateTarotSessionChange();
});
observedTarotReadingSession = captureTarotReadingSession();

function getTarotPlanForSpread(spreadType) {
    return 'pruvodce';
}

function getTarotFeatureForSpread(spreadType) {
    return spreadType === 'Celtic Cross' ? 'tarot_celtic_cross' : 'tarot_multi_card';
}

function cleanTarotContextValue(value, maxLength = 120) {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).trim();
    if (!cleaned) return null;
    return cleaned.slice(0, maxLength);
}

function getTarotEntryContext() {
    const params = new URLSearchParams(window.location.search);
    const context = {};
    const entrySource = cleanTarotContextValue(params.get('entry_source')) || cleanTarotContextValue(params.get('source'));
    const entryFeature = cleanTarotContextValue(params.get('entry_feature')) || cleanTarotContextValue(params.get('feature'));
    const requestedCard = cleanTarotContextValue(getRequestedTarotCardName());
    const rawCard = cleanTarotContextValue(params.get('card'));

    if (entrySource) context.entry_source = entrySource;
    if (entryFeature) context.entry_feature = entryFeature;

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((key) => {
        const value = cleanTarotContextValue(params.get(key));
        if (value) context[key] = value;
    });

    if (requestedCard) context.requested_card = requestedCard;
    if (rawCard && rawCard !== requestedCard) context.card_param = rawCard;

    return context;
}

function appendTarotEntryContextToUrl(url) {
    const context = getTarotEntryContext();

    if (context.requested_card) {
        url.searchParams.set('card', context.requested_card);
    } else if (context.card_param) {
        url.searchParams.set('card', context.card_param);
    }

    if (context.entry_source) url.searchParams.set('entry_source', context.entry_source);
    if (context.entry_feature) url.searchParams.set('entry_feature', context.entry_feature);

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((key) => {
        if (context[key]) url.searchParams.set(key, context[key]);
    });

    return context;
}

function buildTarotUpgradeUrl(spreadType, source = 'tarot_inline_upsell') {
    const planId = getTarotPlanForSpread(spreadType);
    const feature = getTarotFeatureForSpread(spreadType);
    const authUrl = new URL('/prihlaseni.html', window.location.origin);
    authUrl.searchParams.set('mode', 'register');
    authUrl.searchParams.set('redirect', '/cenik.html');
    authUrl.searchParams.set('plan', planId);
    authUrl.searchParams.set('source', source);
    authUrl.searchParams.set('feature', feature);
    const entryContext = appendTarotEntryContextToUrl(authUrl);
    authUrl.searchParams.set('entry_source', entryContext.entry_source || source);
    authUrl.searchParams.set('entry_feature', entryContext.entry_feature || feature);
    return `${authUrl.pathname}${authUrl.search}`;
}

function buildTarotProfileSignupUrl(spreadType, source = 'tarot_result_save_profile') {
    const feature = getTarotFeatureForSpread(spreadType);
    const authUrl = new URL('/prihlaseni.html', window.location.origin);
    authUrl.searchParams.set('mode', 'register');
    authUrl.searchParams.set('redirect', '/tarot.html');
    authUrl.searchParams.set('source', source);
    authUrl.searchParams.set('feature', feature);
    const entryContext = appendTarotEntryContextToUrl(authUrl);
    authUrl.searchParams.set('entry_source', entryContext.entry_source || source);
    authUrl.searchParams.set('entry_feature', entryContext.entry_feature || feature);
    return `${authUrl.pathname}${authUrl.search}`;
}

async function trackTarotFunnelEvent(eventName, source, spreadType, metadata = {}) {
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
                feature: getTarotFeatureForSpread(spreadType),
                planId: getTarotPlanForSpread(spreadType),
                metadata: {
                    path: window.location.pathname,
                    spread_type: spreadType,
                    ...getTarotEntryContext(),
                    ...metadata
                }
            })
        });
    } catch (error) {
        console.warn('[Tarot funnel] Could not record event:', error.message);
    }
}

function startTarotUpgradeFlow(spreadType, source = 'tarot_inline_upsell') {
    const planId = getTarotPlanForSpread(spreadType);
    const feature = getTarotFeatureForSpread(spreadType);
    const entryContext = getTarotEntryContext();
    const checkoutMetadata = {
        entry_source: entryContext.entry_source || source,
        entry_feature: entryContext.entry_feature || feature,
        ...entryContext
    };
    try {
        window.MH_ANALYTICS?.trackCTA?.(source, {
            plan_id: planId,
            spread_type: spreadType,
            feature,
            ...checkoutMetadata
        });
    } catch (error) {
        console.warn('[Tarot] Upgrade analytics unavailable:', error?.message);
    }

    void trackTarotFunnelEvent('paywall_cta_clicked', source, spreadType, {
        destination: '/cenik.html'
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout(planId, {
            source,
            feature,
            metadata: checkoutMetadata,
            redirect: '/cenik.html',
            authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
        });
        return;
    }

    window.location.href = buildTarotUpgradeUrl(spreadType, source);
}

function getTarotUpgradeLabel(spreadType, context = 'teaser') {
    if (spreadType === 'Celtic Cross') return 'Odemknout Keltský kříž';
    if (context === 'locked_card') return 'Odemknout zbývající karty';
    return 'Odemknout celý tarotový výklad';
}

function getTarotPaymentReassuranceHtml() {
    return `<p class="tarot-upgrade-reassurance">${TAROT_PAYMENT_REASSURANCE}</p>`;
}

function getTarotUpgradeCopy(spreadType) {
    const copy = {
        'Tři karty': {
            title: 'Odemkněte celý tříkartový výklad',
            body: 'První karta ukázala začátek příběhu. Zbývající dvě karty doplní aktuální vliv a nejbližší krok, aby výklad dával praktický smysl.'
        },
        'Celtic Cross': {
            title: 'Odemkněte celý Keltský kříž',
            body: 'Keltský kříž dává sílu až jako deset pozic: situace, výzva, skryté vlivy, postoj, okolí i možný výsledek.'
        }
    };

    return copy[spreadType] || {
        title: 'Odemkněte hlubší tarotový výklad',
        body: 'Pokračujte do celého výkladu s více kartami a jasnějším kontextem pro další krok.'
    };
}

function bindTarotImageFallbacks(root) {
    root.querySelectorAll('.tarot-card-image').forEach((image) => {
        image.addEventListener('error', () => {
            if (image.dataset.fallbackApplied === '1') return;
            image.dataset.fallbackApplied = '1';
            image.src = '/img/tarot-v2/tarot_card_back.webp';
        });
    });
}

function normalizeTarotCardName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function getRequestedTarotCardName() {
    const rawCard = new URLSearchParams(window.location.search).get('card');
    if (!rawCard) return null;

    const directMatch = TAROT_CARDS[rawCard] ? rawCard : null;
    if (directMatch) return directMatch;

    const normalizedCard = normalizeTarotCardName(rawCard);
    return TAROT_CARDS_ARRAY.find((name) => normalizeTarotCardName(name) === normalizedCard) || null;
}

function getRequestedSpreadType() {
    const params = new URLSearchParams(window.location.search);
    const requested = normalizeTarotCardName([
        params.get('spread'),
        params.get('intent'),
        params.get('feature')
    ].filter(Boolean).join(' '));

    if (!requested) return null;
    if (requested.includes('celtic') || requested.includes('keltsky') || requested.includes('tarot_celtic_cross')) {
        return 'Celtic Cross';
    }
    if (requested.includes('three') || requested.includes('tri') || requested.includes('3') || requested.includes('tarot_multi_card')) {
        return 'Tři karty';
    }

    return null;
}

function readTarotYesNoUpgradeContext() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('resume') !== 'tarot_yes_no') return null;

    try {
        const raw = localStorage.getItem(TAROT_YES_NO_UPGRADE_CONTEXT_KEY);
        if (!raw) return null;

        const context = JSON.parse(raw);
        const createdAt = Number(context?.createdAt || 0);
        const question = String(context?.question || '').trim().slice(0, 500);
        const answerLabel = String(context?.answerLabel || '').trim().slice(0, 80);
        if (!question || !answerLabel || !Number.isFinite(createdAt) || createdAt <= 0 || createdAt > Date.now()
            || Date.now() - createdAt > TAROT_YES_NO_UPGRADE_CONTEXT_MAX_AGE_MS) {
            localStorage.removeItem(TAROT_YES_NO_UPGRADE_CONTEXT_KEY);
            return null;
        }

        return {
            ...context,
            question,
            answerLabel,
            resultText: String(context.resultText || '').trim().slice(0, 800),
            cardName: String(context.cardName || '').trim().slice(0, 120),
            locale: context.locale === 'sk' ? 'sk' : 'cs'
        };
    } catch (error) {
        console.warn('[Tarot] Could not read ANO/NE continuation context:', error?.message || error);
        try {
            localStorage.removeItem(TAROT_YES_NO_UPGRADE_CONTEXT_KEY);
        } catch {}
        return null;
    }
}

function renderTarotYesNoResumeContext(context) {
    if (!context || document.getElementById('tarot-yes-no-resume-context')) return;

    const spreadGrid = document.querySelector('.t-spread-grid');
    if (!spreadGrid?.parentElement) return;

    const isSlovak = context.locale === 'sk';
    document.body.classList.add('tarot-yes-no-resume-active');
    const banner = document.createElement('aside');
    banner.id = 'tarot-yes-no-resume-context';
    banner.className = 'tarot-yes-no-resume-context';
    banner.setAttribute('aria-labelledby', 'tarot-yes-no-resume-title');

    const eyebrow = document.createElement('span');
    eyebrow.className = 'tarot-yes-no-resume-context__eyebrow';
    eyebrow.textContent = isSlovak ? 'Tvoja otázka zostáva s tebou' : 'Tvoje otázka zůstává s tebou';

    const title = document.createElement('h2');
    title.id = 'tarot-yes-no-resume-title';
    title.textContent = isSlovak ? 'Teraz doplň súvislosti troma kartami' : 'Teď doplň souvislosti třemi kartami';

    const question = document.createElement('p');
    question.className = 'tarot-yes-no-resume-context__question';
    question.textContent = `„${context.question}“`;

    const answer = document.createElement('p');
    answer.className = 'tarot-yes-no-resume-context__answer';
    answer.textContent = isSlovak
        ? `Rýchla odpoveď: ${context.answerLabel}. Výklad je nastavený na tri karty.`
        : `Rychlá odpověď: ${context.answerLabel}. Výklad je nastavený na tři karty.`;

    banner.append(eyebrow, title, question, answer);
    spreadGrid.parentElement.insertBefore(banner, spreadGrid);
}

function renderRequestedCardContext(cardName) {
    if (!cardName || document.getElementById('tarot-card-context')) return;

    const deckContainer = document.querySelector('.tarot-deck');
    const sectionContainer = deckContainer?.closest('.section')?.querySelector('.container');
    const card = TAROT_CARDS[cardName];
    if (!sectionContainer || !card) return;

    const context = document.createElement('div');
    context.id = 'tarot-card-context';
    context.className = 'tarot-card-context';
    context.innerHTML = `
        <span>Výklad navazuje na kartu z katalogu</span>
        <strong>${escapeHtml(cardName)}</strong>
        <p>${escapeHtml(card.meaning || 'Tato karta bude použita jako výchozí energie pro výklad jedné karty.')}</p>
    `;
    sectionContainer.prepend(context);
}

document.addEventListener('DOMContentLoaded', () => {
    const deckContainer = document.querySelector('.tarot-deck');
    originalTarotDeckMarkup = deckContainer?.innerHTML ?? null;
    tarotDeckHint = deckContainer?.previousElementSibling?.matches('p')
        ? deckContainer.previousElementSibling
        : null;
    originalTarotDeckHintText = tarotDeckHint?.textContent || '';
    const spreadButtons = [...document.querySelectorAll('.spread-trigger')];
    tarotSpreadButtonDisabledStates = spreadButtons.map((button) => button.disabled);
    void initializeTarotData();
});

async function initializeTarotData() {
    if (tarotDataLoading || tarotInitialized) return;

    tarotDataLoading = true;
    const spreadButtons = [...document.querySelectorAll('.spread-trigger')];
    if (tarotSpreadButtonDisabledStates === null) {
        tarotSpreadButtonDisabledStates = spreadButtons.map((button) => button.disabled);
    }
    spreadButtons.forEach((button) => { button.disabled = true; });
    document.querySelector('.tarot-deck')?.setAttribute('aria-busy', 'true');
    if (tarotDeckHint) tarotDeckHint.textContent = 'Načítám balíček karet…';
    setTarotReadingStatus('Načítám tarotové karty.');

    try {
        const loaded = await loadTarotData();
        if (!loaded) return;

        const deckContainer = document.querySelector('.tarot-deck');
        if (deckContainer && originalTarotDeckMarkup !== null) {
            deckContainer.innerHTML = originalTarotDeckMarkup;
        }
        if (!tarotInitialized) {
            initTarot();
            tarotInitialized = true;
        }
        spreadButtons.forEach((button, index) => {
            button.disabled = tarotSpreadButtonDisabledStates[index] ?? false;
        });
        document.querySelector('.tarot-deck')?.removeAttribute('aria-busy');
        if (tarotDeckHint) tarotDeckHint.textContent = originalTarotDeckHintText;
        setTarotReadingStatus('');
    } finally {
        tarotDataLoading = false;
    }
}

async function loadTarotData() {
    try {
        const response = await fetch('/data/tarot-cards.json?v=20261007-deck-v2', { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to load tarot data');
        const cards = await response.json();
        const cardNames = cards && typeof cards === 'object' && !Array.isArray(cards)
            ? Object.keys(cards)
            : [];
        const cardsWithImages = cardNames.filter((name) => typeof cards[name]?.image === 'string' && cards[name].image.trim());
        if (cardsWithImages.length < 10) throw new Error('Tarot card data is insufficient for every spread');

        TAROT_CARDS = cards;
        TAROT_CARDS_ARRAY = cardNames;
        if (window.MH_DEBUG) console.debug('Tarot data loaded:', TAROT_CARDS_ARRAY.length, 'cards');
        return true;
    } catch (error) {
        console.error('Failed to load tarot cards:', error);
        const container = document.querySelector('.tarot-deck');
        if (tarotDeckHint) tarotDeckHint.textContent = 'Balíček se nepodařilo načíst.';
        if (container) {
            container.removeAttribute('aria-busy');
            const alert = document.createElement('div');
            alert.className = 'text-center tarot-load-error';
            alert.setAttribute('role', 'alert');

            const message = document.createElement('p');
            message.textContent = 'Nepodařilo se načíst tarotové karty. Zkontroluj připojení a zkus to znovu.';

            const retry = document.createElement('button');
            retry.type = 'button';
            retry.className = 'btn btn--glass';
            retry.textContent = 'Načíst karty znovu';
            retry.addEventListener('click', () => {
                retry.disabled = true;
                retry.textContent = 'Načítám karty…';
                if (tarotDeckHint) tarotDeckHint.textContent = 'Znovu načítám balíček karet…';
                void initializeTarotData();
            });

            alert.append(message, retry);
            container.replaceChildren(alert);
        }
        setTarotReadingStatus('');
        return false;
    }
}

function initTarot() {
    const spreadButtons = document.querySelectorAll('.spread-trigger');
    const spreadCards = document.querySelectorAll('.t-spread-card');
    const deckContainer = document.querySelector('.tarot-deck');

    if (!deckContainer) return;

    const requestedCardName = getRequestedTarotCardName();
    renderRequestedCardContext(requestedCardName);
    const tarotYesNoContext = readTarotYesNoUpgradeContext();
    renderTarotYesNoResumeContext(tarotYesNoContext);

    // Create Results Container if not exists
    let resultsContainer = document.getElementById('tarot-results');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'tarot-results';
        resultsContainer.className = 'container hidden tarot-results';
        const parentSection = deckContainer.closest('.section');
        if (parentSection) {
            parentSection.after(resultsContainer);
        } else {
            document.body.appendChild(resultsContainer);
        }
    }

    function selectSpreadCard(card) {
        if (!card) return false;

        spreadCards.forEach(c => {
            c.classList.remove('featured');
            const btn = c.querySelector('.btn');
            if (btn) {
                btn.classList.remove('btn--primary');
                btn.classList.add('btn--glass');
            }
        });

        card.classList.add('featured');
        const btn = card.querySelector('.btn');
        if (btn) {
            btn.classList.remove('btn--glass');
            btn.classList.add('btn--primary');
        }
        return true;
    }

    function selectSpreadType(spreadType) {
        if (!spreadType) return false;
        const target = [...spreadCards].find(card =>
            card.querySelector('.spread-trigger')?.dataset.spreadType === spreadType
        );
        return selectSpreadCard(target);
    }

    spreadCards.forEach(card => {
        card.addEventListener('click', () => {
            selectSpreadCard(card);
        });
    });

    selectSpreadType(getRequestedSpreadType());
    if (tarotYesNoContext) {
        const threeCardButton = [...spreadButtons]
            .find(button => button.dataset.spreadType === 'Tři karty');
        if (threeCardButton) {
            threeCardButton.textContent = tarotYesNoContext.locale === 'sk'
                ? 'Nadviazať troma kartami'
                : 'Navázat třemi kartami';
        }
    }

    spreadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (tarotReadingInProgress) return;

            const spreadType = btn.dataset.spreadType;

            // PREMIUM CHECK - SOFT GATE UPDATE
            // If spread is NOT 'Jedna karta', we verify premium but allow free users to "try" (view 1st card)
            let isSoftGated = false;

            if (spreadType !== 'Jedna karta') {
                if (!window.Auth || !window.Auth.isLoggedIn()) {
                    window.Auth?.showToast('Přihlášení vyžadováno', 'Pro výklad více karet se prosím přihlaste.', 'info');
                    void trackTarotFunnelEvent('paywall_viewed', 'tarot_auth_gate', spreadType, {
                        gate_reason: 'auth_required'
                    });
                    startTarotUpgradeFlow(spreadType, 'tarot_auth_gate');
                    return;
                }

                if (!window.Auth?.isPremium()) {
                    isSoftGated = true;

                    // Check daily limit for free teaser
                    const today = getPragueDateKey();
                    let usage = {};
                    try {
                        usage = JSON.parse(localStorage.getItem('tarot_free_usage') || '{}');
                    } catch {
                        // The preview is a soft gate; blocked browser storage must not break the reading.
                    }

                    if (usage.date === today && usage.count >= 1) {
                        window.Auth.showToast('Limit vyčerpán', 'Dnešní ukázka zdarma už byla vyčerpána. Celý výklad a další karty odemknete přes ceník.', 'error');
                        void trackTarotFunnelEvent('paywall_viewed', 'tarot_limit_gate', spreadType, {
                            gate_reason: 'free_limit'
                        });
                        startTarotUpgradeFlow(spreadType, 'tarot_limit_gate');
                        return;
                    }

                    // Increment usage
                    try {
                        localStorage.setItem('tarot_free_usage', JSON.stringify({ date: today, count: 1 }));
                    } catch {
                        // Continue with the one-card preview if this browser cannot persist the local marker.
                    }
                }
            }

            // Ensure visual selection matches what we clicked
            const parentCard = btn.closest('.t-spread-card');
            if (parentCard && !parentCard.classList.contains('featured')) {
                parentCard.click(); // Trigger selection logic programmatically
            }

            if (spreadType) {
                startReading(spreadType, isSoftGated);
            }
        });
    });

    // Add click listeners to deck cards
    const deckCards = deckContainer.querySelectorAll('.tarot-card');
    deckCards.forEach(card => {
        card.classList.add('tarot-card--clickable');
        card.addEventListener('click', () => {
            if (tarotReadingInProgress) return;

            // Route deck starts through the visible spread CTA so auth, limits, and paywall tracking stay consistent.
            const selectedBtn = document.querySelector('.t-spread-card.featured .btn');
            if (selectedBtn) {
                selectedBtn.click();
                return;
            }

            startReading('Jedna karta');
        });
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTarotProfileSignupHtml(spreadType) {
    if (window.Auth?.isLoggedIn?.()) return '';

    const source = 'tarot_result_save_profile';
    const feature = getTarotFeatureForSpread(spreadType);
    const signupUrl = buildTarotProfileSignupUrl(spreadType, source);

    return `
        <div class="tarot-profile-cta" aria-label="Registrace profilu zdarma po tarotovem vykladu">
            <p class="tarot-profile-cta__eyebrow">Profil zdarma</p>
            <h3>Chce&scaron; se k v&yacute;klad&#367;m vracet?</h3>
            <p>V profilu zdarma nav&aacute;&zcaron;e&scaron; na dne&scaron;n&iacute; karty osobn&#283;j&scaron;&iacute;mi v&yacute;klady a denn&iacute;m veden&iacute;m. Bez platebn&iacute; karty.</p>
            <a href="${signupUrl}"
               class="btn btn--secondary tarot-profile-cta__button"
               data-analytics-cta="${source}"
               data-analytics-feature="${feature}"
               data-analytics-intent="free_profile_after_result">Vytvo&#345;it profil zdarma</a>
        </div>
    `;
}

async function startReading(spreadType, isSoftGated = false) {
    const deckContainer = document.querySelector('.tarot-deck');
    if (!deckContainer || tarotReadingInProgress) return;
    invalidateTarotSessionChange();
    const readingSession = captureTarotReadingSession();
    tarotReadingInProgress = true;
    const readingGeneration = ++tarotReadingGeneration;
    tarotReadingOwnerId = readingSession.isLoggedIn ? readingSession.userId || null : null;
    activeTarotReadingSession = readingSession;
    displayedTarotReadingSession = null;
    const previousResults = document.getElementById('tarot-results');
    if (previousResults) {
        previousResults.classList.add('hidden');
        previousResults.innerHTML = '';
    }
    window.currentTarotReadingId = null;
    setTarotReadingStatus('Míchám karty pro výklad.');
    tarotSummaryAbortController?.abort();
    tarotSummaryAbortController = null;
    const triggerButtons = [...document.querySelectorAll('.spread-trigger')];
    const previousDisabledStates = triggerButtons.map((button) => button.disabled);
    triggerButtons.forEach((button) => {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
    });
    deckContainer.setAttribute('aria-busy', 'true');

    try {
        await completeTarotReading(spreadType, isSoftGated, deckContainer, readingGeneration, tarotReadingOwnerId, readingSession);
    } finally {
        tarotReadingInProgress = false;
        triggerButtons.forEach((button, index) => {
            button.disabled = previousDisabledStates[index];
            button.removeAttribute('aria-busy');
        });
        deckContainer.removeAttribute('aria-busy');
        if (activeTarotReadingSession === readingSession) activeTarotReadingSession = null;
    }
}

async function completeTarotReading(spreadType, isSoftGated, deckContainer, readingGeneration, readingOwnerId = null, readingSession = captureTarotReadingSession()) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const waitForPresentation = (duration) => prefersReducedMotion
        ? Promise.resolve()
        : new Promise(resolve => window.setTimeout(resolve, duration));
    const tarotYesNoContext = spreadType === 'Tři karty'
        ? readTarotYesNoUpgradeContext()
        : null;

    // First scroll to deck so user can see the shuffle animation
    deckContainer.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    await waitForPresentation(300);
    if (!isCurrentTarotReading(readingGeneration, readingSession)) return;

    // 1. Shuffle Animation - make it more visible
    deckContainer.classList.add('tarot-deck--shuffle-scale');
    deckContainer.classList.add('shaking');
    await waitForPresentation(1500); // Longer shuffle
    if (!isCurrentTarotReading(readingGeneration, readingSession)) return;
    deckContainer.classList.remove('shaking');
    deckContainer.classList.remove('tarot-deck--shuffle-scale');

    // Small pause after shuffle
    await waitForPresentation(300);
    if (!isCurrentTarotReading(readingGeneration, readingSession)) return;

    // 2. Draw Cards - only from cards that have images
    const cardsWithImages = TAROT_CARDS_ARRAY.filter(name => TAROT_CARDS[name].image);

    // Determine number of cards based on spread type
    let numCards = 1;
    if (spreadType === 'Tři karty') numCards = 3;
    if (spreadType === 'Celtic Cross') numCards = 10;

    const drawnCardNames = [];
    const requestedCardName = getRequestedTarotCardName();

    if (spreadType === 'Jedna karta' && requestedCardName && cardsWithImages.includes(requestedCardName)) {
        drawnCardNames.push(requestedCardName);
        window.MH_ANALYTICS?.trackAction?.('tarot_card_context_used', {
            source: 'tarot_card_parameter',
            card: requestedCardName,
            spread_type: spreadType,
            ...getTarotEntryContext()
        });
    }

    while (drawnCardNames.length < numCards && drawnCardNames.length < cardsWithImages.length) {
        const randomCard = cardsWithImages[Math.floor(Math.random() * cardsWithImages.length)];
        if (!drawnCardNames.includes(randomCard)) drawnCardNames.push(randomCard);
    }

    // Get card data
    const drawnCards = drawnCardNames.map(name => ({
        name,
        ...TAROT_CARDS[name]
    }));

    // 3. Show Cards with Flip Animation
    const resultsContainer = document.getElementById('tarot-results');
    if (!resultsContainer) return;

    // Use responsive grid class based on number of cards
    // For Celtic Cross (10 cards), we might want a different grid or just standard grid-5 wrap
    const gridClass = numCards === 1 ? 'grid-1' : (numCards <= 3 ? `grid-${numCards}` : 'grid-5');
    const upgradeCopy = getTarotUpgradeCopy(spreadType);
    const resumeContextHtml = tarotYesNoContext ? `
        <div class="tarot-results-resume-context">
            <span>${tarotYesNoContext.locale === 'sk' ? 'Výklad k tvojej otázke' : 'Výklad k tvé otázce'}</span>
            <strong>„${escapeHtml(tarotYesNoContext.question)}“</strong>
            <p>${tarotYesNoContext.locale === 'sk' ? 'Rýchla odpoveď' : 'Rychlá odpověď'}: ${escapeHtml(tarotYesNoContext.answerLabel)}</p>
        </div>
    ` : '';

    // Build initial layout (cards face down)
    resultsContainer.innerHTML = `
        <div class="text-center">
            <h3 class="mb-lg tarot-results__title">Tvé vylosované karty</h3>
            ${resumeContextHtml}
            <div class="tarot-spread grid ${gridClass} tarot-results__spread">
                ${drawnCards.map((card, index) => {
        const isLocked = isSoftGated && index > 0;
        return `
                    <div class="tarot-flip-card ${isLocked ? 'locked-card' : ''}" data-index="${index}">
                        <div class="tarot-flip-inner">
                            <div class="tarot-flip-front">
                                <img src="img/tarot-v2/tarot_card_back.webp" alt="Rub tarotové karty">
                            </div>
                            <div class="tarot-flip-back ${card.image ? 'has-image' : ''}">
                                ${isLocked ? `
                                    <div class="premium-lock-overlay tarot-card-lock">
                                        <div class="lock-icon tarot-card-lock__icon" aria-hidden="true"><svg class="mh-symbol" viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><use href="/img/icons/mh-symbols.svg#lock"></use></svg></div>
                                        <h2 class="tarot-card-lock__title">${escapeHtml(upgradeCopy.title)}</h2>
                                        <p class="tarot-card-lock__copy">
                                            ${escapeHtml(upgradeCopy.body)}
                                        </p>
                                        <a href="${buildTarotUpgradeUrl(spreadType, 'tarot_locked_card')}" class="btn btn--primary tarot-upgrade-btn">${getTarotUpgradeLabel(spreadType, 'locked_card')}</a>
                                        ${getTarotPaymentReassuranceHtml()}
                                    </div>
                                    <img src="img/tarot-v2/tarot_card_back.webp" class="tarot-card-image--locked" alt="Rub tarotové karty">
                                ` : (card.image ? `
                                    <img src="${card.image}" alt="${escapeHtml(card.name)}" class="tarot-card-image" loading="lazy">
                                ` : `
                                    <div class="tarot-card-content">
                                        <span class="tarot-card-emoji">${card.emoji}</span>
                                        <h4 class="tarot-card-name">${escapeHtml(card.name)}</h4>
                                        <p class="tarot-card-meaning">${escapeHtml(card.meaning)}</p>
                                    </div>
                                `)}
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
            <div id="interpretations-container" class="tarot-interpretations"></div>
             ${isSoftGated ? `
                <div class="text-center mt-xl p-lg tarot-soft-gate">
                    <h3 class="tarot-soft-gate__title">${escapeHtml(upgradeCopy.title)}</h3>
                    <p class="mb-lg">${escapeHtml(upgradeCopy.body)}</p>
                    <a href="${buildTarotUpgradeUrl(spreadType, 'tarot_teaser_banner')}" class="btn btn--primary tarot-upgrade-btn">${getTarotUpgradeLabel(spreadType, 'teaser')}</a>
                    ${getTarotPaymentReassuranceHtml()}
                </div>
            ` : ''}
        </div>
    `;

    resultsContainer.classList.remove('hidden');
    displayedTarotReadingSession = readingSession;
    bindTarotImageFallbacks(resultsContainer);
    if (isSoftGated) {
        window.MH_ANALYTICS?.trackAction?.('tarot_soft_gate_viewed', {
            source: 'tarot_teaser_banner',
            feature: getTarotFeatureForSpread(spreadType),
            plan_id: getTarotPlanForSpread(spreadType),
            spread_type: spreadType,
            ...getTarotEntryContext(),
            cards_total: numCards,
            cards_locked: Math.max(0, numCards - 1)
        });
        void trackTarotFunnelEvent('paywall_viewed', 'tarot_teaser_banner', spreadType, {
            gate_reason: 'teaser_after_free_card',
            cards_total: numCards,
            cards_locked: Math.max(0, numCards - 1)
        });
    }
    resultsContainer.querySelectorAll('.tarot-upgrade-btn').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const source = link.closest('.premium-lock-overlay') ? 'tarot_locked_card' : 'tarot_teaser_banner';
            startTarotUpgradeFlow(spreadType, source);
        });
    });

    // Now scroll to results
    await waitForPresentation(100);
    if (!isCurrentTarotReading(readingGeneration, readingSession)) return;
    resultsContainer.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

    // 4. Trigger flip animation for each card sequentially
    const flipCards = resultsContainer.querySelectorAll('.tarot-flip-card');

    for (let i = 0; i < flipCards.length; i++) {
        await waitForPresentation(600); // Delay between flips
        if (!isCurrentTarotReading(readingGeneration, readingSession)) return;
        flipCards[i].classList.add('flipped');

        // Sound effect removed (invalid audio data)
    }

    // 5. After all cards flipped, show interpretations
    await waitForPresentation(800);
    if (!isCurrentTarotReading(readingGeneration, readingSession)) return;

    const interpretationsContainer = document.getElementById('interpretations-container');

    // Build interpretations HTML with PROFESSIONAL UI DESIGN
    let interpretationsHtml = drawnCards.map((card, index) => {
        if (isSoftGated && index > 0) return ''; // Skip interpretation for locked cards

        const positionLabel = numCards > 1 ? tarotCardPosition(spreadType, index) : '';

        // Determine Arcana Type
        const isMajor = Object.keys(TAROT_CARDS).indexOf(card.name) < 22;

        if (window.Templates) {
            return window.Templates.renderTarotResult(card, index, isMajor, positionLabel);
        } else {
            console.error('Templates library missing');
            return '';
        }
    }).join('');

    // Add final summary for multi-card spreads - different layouts based on spread type
    // Add final summary for multi-card spreads
    if (numCards > 1 && window.Templates && !isSoftGated) {
        if (spreadType === 'Tři karty') {
            interpretationsHtml += window.Templates.renderSummary3Card(drawnCards);
        } else if (spreadType === 'Celtic Cross') {
            interpretationsHtml += window.Templates.renderSummaryCeltic(drawnCards);
        } else {
            interpretationsHtml += window.Templates.renderSummaryDefault(drawnCards);
        }
    }

    // IMPORTANT: Set innerHTML FIRST, then trigger async AI summary
    interpretationsContainer.innerHTML = interpretationsHtml;
    interpretationsContainer.insertAdjacentHTML('afterend', getTarotProfileSignupHtml(spreadType));
    if (numCards === 1 && !isSoftGated) {
        const offerTemplate = document.getElementById('tarot-relationship-offer');
        if (offerTemplate) {
            interpretationsContainer.after(offerTemplate.content.cloneNode(true));
            document.dispatchEvent(new Event('mh:relationship-offers-ready'));
        }
    }

    if (tarotYesNoContext && !isSoftGated) {
        try {
            localStorage.removeItem(TAROT_YES_NO_UPGRADE_CONTEXT_KEY);
        } catch {}
        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_continuation_completed', {
            source: 'tarot_yes_no_resume',
            feature: 'tarot_multi_card',
            spread_type: spreadType,
            answer_label: tarotYesNoContext.answerLabel,
            locale: tarotYesNoContext.locale
        });
    }

    if (isSoftGated && numCards > 1) {
        setTarotReadingStatus('Ukázka první karty je připravená. Zbývající výklad je součástí členství.');
    } else if (numCards === 1) {
        setTarotReadingStatus('Výklad jedné karty je připravený.');
    } else {
        setTarotReadingStatus('Karty jsou odkryté. Připravuji společný výklad.');
    }

    // Trigger spiritual summary after DOM is updated
    if (numCards > 1 && !isSoftGated) {
        setTimeout(() => {
            if (isCurrentTarotReading(readingGeneration, readingSession)) {
                void generateEtherealSummary(drawnCards, spreadType, tarotYesNoContext, readingGeneration, readingOwnerId, readingSession);
            }
        }, 500);
    } else {
        // For single-card readings OR gated readings (Card 1 only), save
        // Actually, for gated reading we might not want to save to DB as a "reading" or maybe yes but with incomplete data?
        // Let's save it so they have it in history (as a tease).

        if (window.Auth && window.Auth.saveReading) {
            const cardsData = savedTarotCards(drawnCards.slice(0, isSoftGated ? 1 : undefined), spreadType);

            let saveResult = null;
            try {
                saveResult = await window.Auth.saveReading('tarot', {
                    spreadType: isSoftGated ? `${spreadType} (Ukázka)` : spreadType,
                    cards: cardsData
                }, readingOwnerId);
            } catch (error) {
                console.warn('[Tarot] Could not save reading to profile:', error?.message || error);
            }
            if (!isCurrentTarotReading(readingGeneration, readingSession)) return;

            // Store reading ID and add favorite button
            if (saveResult && saveResult.id) {
                window.currentTarotReadingId = saveResult.id;

                // Add favorite button after interpretations
                const favoriteBtn = document.createElement('div');
                favoriteBtn.className = 'text-center favorite-reading-action';
                favoriteBtn.innerHTML = `
                    <button id="favorite-tarot-btn" type="button" aria-pressed="false" class="btn btn--glass favorite-reading-action__button">
                        <svg class="mh-symbol mh-symbol--inline favorite-icon" viewBox="0 0 48 48" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg> Přidat do oblíbených
                    </button>
                `;
                interpretationsContainer.appendChild(favoriteBtn);

                // Attach listener
                document.getElementById('favorite-tarot-btn').addEventListener('click', async () => {
                    await toggleFavorite(window.currentTarotReadingId, 'favorite-tarot-btn');
                });
            } else {
                showTarotReadingSaveNotice(interpretationsContainer);
            }
        }
    }
}

/**
 * Generates an ethereal summary for the tarot reading
 * @param {Array} cards - Array of drawn card objects
 * @param {String} spreadType - Type of spread used
 */
async function generateEtherealSummary(cards, spreadType, continuationContext = null, readingGeneration = tarotReadingGeneration, readingOwnerId = tarotReadingOwnerId, readingSession = displayedTarotReadingSession) {
    const summaryContainer = document.getElementById('ethereal-tarot-summary');
    if (!summaryContainer || summaryContainer.dataset.loading === 'true' || !isCurrentTarotReading(readingGeneration, readingSession)) return;
    const abortController = new AbortController();
    tarotSummaryAbortController?.abort();
    tarotSummaryAbortController = abortController;
    summaryContainer.dataset.loading = 'true';
    summaryContainer.setAttribute('aria-busy', 'true');
    setTarotReadingStatus('Připravuji společný výklad karet.');

    try {
        // Prepare card data for API
        const savedCards = savedTarotCards(cards, spreadType);
        const cardsData = savedCards.map(({ name, position, meaning }) => ({ name, position, meaning }));

        // Detect current language
        const path = window.location.pathname;
        let currentLang = 'cs';
        if (path.includes('/sk/')) currentLang = 'sk';
        else if (path.includes('/pl/')) currentLang = 'pl';

        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!isCurrentTarotReading(readingGeneration, readingSession) || !summaryContainer.isConnected) return;
        const response = await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/tarot-summary`, {
            method: 'POST',
            credentials: 'include',
            signal: abortController.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({
                spreadType,
                cards: cardsData,
                lang: continuationContext?.locale || currentLang,
                question: continuationContext?.question || null,
                previousAnswer: continuationContext?.answerLabel || null
            })
        });

        if (!isCurrentTarotReading(readingGeneration, readingSession) || !summaryContainer.isConnected) return;
        const data = await response.json();

        if (!isCurrentTarotReading(readingGeneration, readingSession) || !summaryContainer.isConnected) return;
        if (response.ok && data.success && typeof data.response === 'string') {
            summaryContainer.innerHTML = formatReadingHtml(data.response);
            showFallbackNotice(summaryContainer, data.fallback);
            setTarotReadingStatus(data.fallback
                ? 'Základní společný výklad je připravený.'
                : 'Společný výklad je připravený.');

            // Save to history if logged in and store reading ID
            if (window.Auth && window.Auth.saveReading) {
                if (!isCurrentTarotReading(readingGeneration, readingSession) || !summaryContainer.isConnected) return;
                let saveResult = null;
                try {
                    saveResult = await window.Auth.saveReading('tarot', {
                        spreadType,
                        cards: savedCards,
                        response: data.response,
                        fallback: !!data.fallback,
                        ...(continuationContext ? {
                            question: continuationContext.question,
                            previousAnswer: continuationContext.answerLabel,
                            continuedFrom: 'tarot_yes_no'
                        } : {})
                    }, readingOwnerId);
                } catch (error) {
                    console.warn('[Tarot] Could not save summary to profile:', error?.message || error);
                }
                if (!isCurrentTarotReading(readingGeneration, readingSession) || !summaryContainer.isConnected) return;

                // Store reading ID globally for favorite button
                if (saveResult && saveResult.id) {
                    window.currentTarotReadingId = saveResult.id;

                    // Add favorite button after summary
                    const favoriteBtn = document.createElement('div');
                    favoriteBtn.className = 'text-center favorite-reading-action';
                    favoriteBtn.innerHTML = `
                        <button id="favorite-tarot-btn" type="button" aria-pressed="false" class="btn btn--glass favorite-reading-action__button">
                            <svg class="mh-symbol mh-symbol--inline favorite-icon" viewBox="0 0 48 48" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg> Přidat do oblíbených
                        </button>
                    `;
                    summaryContainer.parentElement.appendChild(favoriteBtn);

                    // Attach listener
                    favoriteBtn.querySelector('#favorite-tarot-btn').addEventListener('click', async () => {
                        await toggleFavorite(saveResult.id, 'favorite-tarot-btn');
                    });
                } else {
                    showTarotReadingSaveNotice(summaryContainer);
                }
            }
            summaryContainer.parentElement.classList.add('fade-in');
        } else {
            throw new Error(data.error || 'Failed to generate summary');
        }

    } catch (error) {
        if (error?.name === 'AbortError' || !isCurrentTarotReading(readingGeneration, readingSession) || !summaryContainer.isConnected) return;
        console.error('AI Summary Error:', error);
        setTarotReadingStatus('');
        summaryContainer.innerHTML = `
            <p class="text-center tarot-summary-error" role="alert">
                Souhrn se nepodařilo načíst. Vytažené karty i jejich významy zůstávají dostupné.
            </p>
        `;
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'btn btn--glass';
        retry.textContent = 'Zkusit souhrn znovu';
        retry.addEventListener('click', () => {
            if (summaryContainer.dataset.loading === 'true') return;
            retry.disabled = true;
            void generateEtherealSummary(cards, spreadType, continuationContext, readingGeneration, readingOwnerId, readingSession);
        });
        summaryContainer.appendChild(retry);
    } finally {
        if (summaryContainer.isConnected && summaryContainer.dataset.loading === 'true') {
            summaryContainer.dataset.loading = 'false';
            summaryContainer.setAttribute('aria-busy', 'false');
        }
        if (tarotSummaryAbortController === abortController) tarotSummaryAbortController = null;
    }
}
