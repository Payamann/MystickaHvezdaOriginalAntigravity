/**
 * Runes Logic
 * Handles rune drawing, shuffling animation, and AI interpretations.
 */

import { showFallbackNotice, formatReadingHtml } from './utils/reading-display.js';
import { getPragueDateKey } from './utils/prague-date.js';

let runesData = [];
let drawnRune = null;
let runeDrawInProgress = false;
let runeReadingGeneration = 0;
let runeReadingAbortController = null;
let activeRuneReadingSession = null;
let displayedRuneReadingSession = null;
let observedRuneSession = null;
let activeRuneIntentionRequest = null;
let runePageInitializationInProgress = false;
let runePageInitialized = false;
let runeDrawButtonLabel = 'Vytáhnout Runu Dne';
const RUNES_DEEP_FEATURE = 'runy_hluboky_vyklad';
const RUNES_PAYMENT_REASSURANCE = 'Cena se zobraz\u00ed ve Stripe p\u0159ed potvrzen\u00edm. Zru\u0161en\u00ed najde\u0161 v profilu.';
const RUNE_SHUFFLE_DURATION_MS = 700;

function captureRuneSession() {
    const isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());
    return { isLoggedIn, userId: isLoggedIn ? window.Auth?.user?.id : null };
}

function hasSameRuneSession(session) {
    const current = captureRuneSession();
    if (current.isLoggedIn !== session?.isLoggedIn) return false;
    if (!current.isLoggedIn) return true;
    return typeof session.userId === 'string' && session.userId.length > 0 && current.userId === session.userId;
}

function clearRuneIntentionDependentResult() {
    const response = document.getElementById('ai-response-container');
    if (response) {
        response.hidden = true;
        response.classList.remove('mh-block-visible', 'runes-upgrade-preview');
        response.replaceChildren();
    }
    document.getElementById('runes-deep-error')?.remove();
    document.getElementById('favorite-rune-action')?.remove();

    const premiumUpsell = document.getElementById('premium-upsell');
    if (premiumUpsell) premiumUpsell.hidden = false;
    displayedRuneReadingSession = null;

    try {
        sessionStorage.removeItem('pendingRuneContext');
    } catch {
        // Storage is optional; the visible result has already been cleared.
    }
}

function clearRuneSessionData() {
    releaseRuneIntentionInput(activeRuneIntentionRequest);
    const intention = document.getElementById('rune-intention');
    if (intention) intention.value = '';

    clearRuneIntentionDependentResult();
    const deepReadBtn = document.getElementById('btn-deep-reading');
    if (deepReadBtn) {
        deepReadBtn.disabled = false;
        deepReadBtn.removeAttribute('aria-busy');
        deepReadBtn.textContent = 'Získat symbolický výklad';
    }
}

function releaseRuneIntentionInput(request) {
    if (!request || activeRuneIntentionRequest !== request) return;

    activeRuneIntentionRequest = null;
    request.input.disabled = request.previousDisabled;
    if (request.previousBusy === null || request.previousBusy === undefined) {
        request.input.removeAttribute('aria-busy');
    } else {
        request.input.setAttribute('aria-busy', request.previousBusy);
    }
}

function setRuneDrawStatus(message) {
    const status = document.getElementById('rune-draw-status');
    if (status) status.textContent = String(message || '');
}

function showRuneDataLoadError() {
    const pouch = document.querySelector('.rune-pouch-container');
    if (!pouch) return;

    const alert = document.createElement('div');
    alert.id = 'rune-data-error';
    alert.className = 'rune-data-error';
    alert.setAttribute('role', 'alert');

    const message = document.createElement('p');
    message.textContent = 'Runy se nepodařilo načíst. Zkontroluj připojení a zkus to znovu.';

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn btn--glass';
    retry.textContent = 'Načíst runy znovu';
    retry.addEventListener('click', () => {
        retry.disabled = true;
        retry.textContent = 'Načítám runy…';
        void initializeRunePage();
    });

    alert.append(message, retry);
    pouch.appendChild(alert);
}

function invalidateRuneSessionChange() {
    const current = captureRuneSession();
    const observedChanged = observedRuneSession && !hasSameRuneSession(observedRuneSession);
    const activeChanged = activeRuneReadingSession && !hasSameRuneSession(activeRuneReadingSession);
    const displayedChanged = displayedRuneReadingSession && !hasSameRuneSession(displayedRuneReadingSession);
    observedRuneSession = current;
    if (!observedChanged && !activeChanged && !displayedChanged) return;

    if (activeChanged) {
        runeReadingGeneration += 1;
        runeReadingAbortController?.abort();
        runeReadingAbortController = null;
        activeRuneReadingSession = null;
    }
    clearRuneSessionData();
}

function isCurrentRuneRequest(generation, session) {
    if (generation !== runeReadingGeneration) return false;
    if (hasSameRuneSession(session)) return true;
    invalidateRuneSessionChange();
    return false;
}

document.addEventListener('auth:changed', invalidateRuneSessionChange);
window.addEventListener('storage', (event) => {
    if (event.key === 'auth_user') invalidateRuneSessionChange();
});
observedRuneSession = captureRuneSession();

function apiBase() {
    return window.API_CONFIG?.BASE_URL || '/api';
}

async function buildJsonHeaders() {
    const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
    return {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
    };
}

function buildRuneUpgradeUrl(source, feature) {
    const pricingUrl = new URL('/cenik.html', window.location.origin);
    pricingUrl.searchParams.set('plan', 'pruvodce');
    pricingUrl.searchParams.set('source', source);
    pricingUrl.searchParams.set('feature', feature);
    pricingUrl.searchParams.set('entry_source', source);
    pricingUrl.searchParams.set('entry_feature', feature);
    return `${pricingUrl.pathname}${pricingUrl.search}`;
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
}

function startRuneUpgradeFlow(source, feature, redirect = '/runy.html') {
    window.MH_ANALYTICS?.trackCTA?.(source, {
        plan_id: 'pruvodce',
        feature
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout('pruvodce', {
            source,
            feature,
            metadata: {
                entry_source: source,
                entry_feature: feature
            },
            redirect,
            authMode: 'register'
        });
        return;
    }

    window.location.href = buildRuneUpgradeUrl(source, feature);
}

function showRuneUpgradePreview(source = 'runes_inline_gate', intention = '') {
    const aiContainer = document.getElementById('ai-response-container');
    if (!aiContainer || !drawnRune) return;

    const escapedRuneName = escapeHtml(drawnRune.name || 'vyta\u017Een\u00E1 runa');
    const escapedRuneMeaning = escapeHtml(drawnRune.meaning || '');
    const escapedIntention = escapeHtml(intention || 'tv\u016Fj aktu\u00E1ln\u00ED z\u00E1m\u011Br');

    aiContainer.hidden = false;
    aiContainer.classList.add('mh-block-visible', 'runes-upgrade-preview');
    aiContainer.innerHTML = `
        <h4>Odemknout hlubok\u00FD v\u00FDklad runy ${escapedRuneName}</h4>
        <p>Z\u00E1kladn\u00ED poselstv\u00ED u\u017E m\u00E1\u0161. Pln\u00FD v\u00FDklad propojuje runu, tv\u016Fj z\u00E1m\u011Br a konkr\u00E9tn\u00ED dal\u0161\u00ED krok pro dne\u0161ek.</p>
        <div class="runes-upgrade-preview__sample">
            <strong>N\u00E1hled odem\u010Den\u00E9 \u010D\u00E1sti:</strong>
            <span>Pro z\u00E1m\u011Br \u201E${escapedIntention}\u201C by se otev\u0159el osobn\u00ED v\u00FDklad, jak energie ${escapedRuneName}${escapedRuneMeaning ? ` (${escapedRuneMeaning})` : ''} mluv\u00ED do tv\u00E9 situace.</span>
        </div>
        <div class="runes-upgrade-preview__actions">
            <button type="button" class="btn btn--gold runes-upgrade-preview__cta">Odemknout v\u00FDklad runy</button>
            <button type="button" class="btn btn--ghost runes-upgrade-preview__free">Z\u016Fstat u runy zdarma</button>
        </div>
        <p class="runes-upgrade-preview__reassurance">${RUNES_PAYMENT_REASSURANCE}</p>
    `;

    window.MH_ANALYTICS?.trackAction?.('paywall_viewed', {
        source,
        feature: RUNES_DEEP_FEATURE,
        plan_id: 'pruvodce',
        rune: drawnRune.name || '',
        has_intention: Boolean(intention)
    });

    aiContainer.querySelector('.runes-upgrade-preview__cta')?.addEventListener('click', () => {
        startRuneUpgradeFlow(source, RUNES_DEEP_FEATURE);
    });

    aiContainer.querySelector('.runes-upgrade-preview__free')?.addEventListener('click', () => {
        window.MH_ANALYTICS?.trackAction?.('paywall_dismissed', {
            source,
            feature: RUNES_DEEP_FEATURE
        });
        aiContainer.hidden = true;
        aiContainer.classList.remove('mh-block-visible', 'runes-upgrade-preview');
    });

    aiContainer.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}
function appendRuneFavoriteAction(container, readingId) {
    if (!container || !readingId) return;

    document.getElementById('favorite-rune-action')?.remove();

    const action = document.createElement('div');
    action.id = 'favorite-rune-action';
    action.className = 'text-center favorite-reading-action mt-md';
    action.innerHTML = `
        <button id="favorite-rune-btn" type="button" aria-pressed="false" class="btn btn--glass favorite-reading-action__button">
            <svg class="mh-symbol mh-symbol--inline favorite-icon" viewBox="0 0 48 48" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg> Přidat do oblíbených
        </button>
    `;
    container.appendChild(action);

    action.querySelector('#favorite-rune-btn')?.addEventListener('click', async () => {
        if (typeof window.toggleFavorite === 'function') {
            await window.toggleFavorite(readingId, 'favorite-rune-btn');
        }
    });
}

async function saveRuneReading({ response = null, intention = '', fallback = false, session = captureRuneSession() } = {}) {
    if (!drawnRune || !window.Auth?.saveReading) return null;

    if (!session.isLoggedIn) {
        window.Auth.showToast?.('Přihlášení vyžadováno', 'Pro uložení runy se prosím přihlaste.', 'info');
        startRuneUpgradeFlow('runes_save_gate', 'runy_ulozeni', '/runy.html');
        return null;
    }

    const readingOwnerId = session.userId;
    if (typeof readingOwnerId !== 'string' || !readingOwnerId) return null;
    if (!hasSameRuneSession(session)) return null;

    document.querySelector('[data-reading-save-error]')?.remove();

    let saveResult = null;
    try {
        saveResult = await window.Auth.saveReading('runes', {
            rune: {
                name: drawnRune.name,
                symbol: drawnRune.symbol,
                meaning: drawnRune.meaning,
                element: drawnRune.element
            },
            intention,
            response,
            fallback
        }, readingOwnerId);
    } catch (saveError) {
        console.warn('Rune reading save failed:', saveError.message);
    }

    if (!hasSameRuneSession(session)) return null;

    if (saveResult?.id) {
        document.querySelector('[data-reading-save-error]')?.remove();
        window.Auth.showToast?.('Uloženo', 'Runový výklad je uložený v profilu.', 'success');
    } else {
        const result = document.getElementById('rune-result');
        if (result && !result.querySelector('[data-reading-save-error]')) {
            const notice = document.createElement('p');
            notice.className = 'result-context-notice';
            notice.dataset.readingSaveError = 'true';
            notice.setAttribute('role', 'status');
            notice.textContent = 'Výsledek zůstává na stránce, ale nepodařilo se ho uložit do profilu.';
            result.appendChild(notice);
        }
    }

    return saveResult;
}

document.addEventListener('DOMContentLoaded', () => {
    const drawBtn = document.getElementById('btn-draw');
    runeDrawButtonLabel = drawBtn?.textContent?.trim() || runeDrawButtonLabel;
    void initializeRunePage();
});

async function initializeRunePage() {
    if (runePageInitializationInProgress || runePageInitialized) return;
    runePageInitializationInProgress = true;

    const drawBtn = document.getElementById('btn-draw');
    if (drawBtn) {
        drawBtn.hidden = false;
        drawBtn.disabled = true;
        drawBtn.textContent = 'Načítám runy…';
        drawBtn.setAttribute('aria-busy', 'true');
    }
    document.getElementById('rune-data-error')?.remove();
    setRuneDrawStatus('Načítám runy.');

    // Load and validate the rune database before enabling the draw control.
    try {
        const res = await fetch('/data/runes.json');
        if (!res.ok) throw new Error('Nepodařilo se načíst databázi run.');
        const data = await res.json();
        const usableRunes = Array.isArray(data)
            ? data.filter((rune) => rune && typeof rune.name === 'string' && rune.name.trim() && typeof rune.symbol === 'string')
            : [];
        if (usableRunes.length === 0) throw new Error('Databáze run neobsahuje použitelné symboly.');
        runesData = usableRunes;
        observedRuneSession = captureRuneSession();
    } catch (error) {
        console.error('Error loading runes:', error);
        runePageInitializationInProgress = false;
        if (drawBtn) {
            drawBtn.disabled = true;
            drawBtn.hidden = true;
            drawBtn.removeAttribute('aria-busy');
        }
        setRuneDrawStatus('');
        showRuneDataLoadError();
        return;
    }
    runePageInitializationInProgress = false;

    // 2. Initial setup
    const runeEl = document.getElementById('active-rune');
    const deepReadBtn = document.getElementById('btn-deep-reading');
    const intentionInput = document.getElementById('rune-intention');
    const saveBtn = document.getElementById('btn-save');
    const shareBtn = document.getElementById('btn-share');

    if (drawBtn) {
        drawBtn.disabled = false;
        drawBtn.textContent = runeDrawButtonLabel;
        drawBtn.removeAttribute('aria-busy');
    }
    setRuneDrawStatus('');

    // 3. Check Daily Lock
    checkDailyLock();
    restorePendingRuneContext();

    // 4. Attach listeners
    if (drawBtn) {
        drawBtn.addEventListener('click', drawRune);
    }

    if (deepReadBtn) {
        deepReadBtn.addEventListener('click', requestDeepReading);
    }

    if (intentionInput) {
        intentionInput.addEventListener('input', clearRuneIntentionDependentResult);
        intentionInput.addEventListener('change', clearRuneIntentionDependentResult);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!drawnRune) {
                window.Auth?.showToast?.('Nejdřív vytáhněte runu', 'Uložit lze až konkrétní runový výklad.', 'info');
                return;
            }

            try {
                const saveResult = await saveRuneReading({
                    intention: document.getElementById('rune-intention')?.value?.trim() || ''
                });
                if (saveResult?.id) {
                    appendRuneFavoriteAction(document.getElementById('rune-result'), saveResult.id);
                }
            } catch (error) {
                console.error('Rune save failed:', error);
                window.Auth?.showToast?.('Chyba', 'Runu se nepodařilo uložit.', 'error');
            }
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', shareRune);
    }
    runePageInitialized = true;
}

function drawRuneImage(rune) {
    const shareImage = window.MH_SHARE_IMAGE;
    const canvas = shareImage.createCanvas();
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const seed = String(rune.name || '').length * 41 + String(rune.meaning || '').length;

    shareImage.drawBrandBackground(ctx, canvas, seed);

    ctx.fillStyle = '#d0b17c';
    ctx.font = '700 52px Cinzel, Georgia, serif';
    ctx.fillText('RUNA DNE', centerX, 244);

    ctx.fillStyle = 'rgba(208,177,124,0.12)';
    ctx.fillRect(centerX - 170, 320, 340, 340);
    ctx.strokeStyle = 'rgba(208,177,124,0.58)';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - 170, 320, 340, 340);

    ctx.fillStyle = '#e9e3d7';
    ctx.font = '700 220px Georgia, serif';
    ctx.fillText(rune.symbol || 'ᚠ', centerX, 570);

    ctx.font = '700 62px Cinzel, Georgia, serif';
    ctx.fillText(rune.name || '', centerX, 770);

    ctx.fillStyle = 'rgba(208,177,124,0.86)';
    ctx.fillRect(170, 810, 740, 3);

    if (rune.meaning) {
        ctx.fillStyle = '#e9e3d7';
        ctx.font = '500 38px Inter, Arial, sans-serif';
        shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, rune.meaning, 840), centerX, 890, 50, 5, 840);
    }

    shareImage.drawFooter(ctx, canvas, 'mystickahvezda.cz/runy.html',
        'Vytáhni si runu, která tě dnes provází.');

    return canvas;
}

async function shareRune() {
    if (!drawnRune) return;

    if (window.MH_SHARE_IMAGE?.shareOrDownload) {
        try {
            const canvas = drawRuneImage(drawnRune);
            await window.MH_SHARE_IMAGE.shareOrDownload({
                canvas,
                fileName: 'runa-dne.png',
                shareTitle: `Moje runa dne: ${drawnRune.name}`,
                shareText: `Dnes mě provází runa ${drawnRune.name} (${drawnRune.symbol}). Vytáhni si tu svoji na mystickahvezda.cz`,
                eventBase: 'rune_image',
                metadata: {
                    source: 'rune_result',
                    feature: 'runy_hluboky_vyklad',
                    rune_name: String(drawnRune.name || '').slice(0, 80)
                }
            });
            return;
        } catch (error) {
            console.warn('[Runy] Image share failed, falling back to text share:', error.message);
        }
    }

    const shareTitle = `Runa dne: ${drawnRune.name}`;
    const shareText = `Dnešní symbolická runa: ${drawnRune.name} (${drawnRune.symbol}). ${drawnRune.meaning} Vytáhni si svou na mystickahvezda.cz/runy.html.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
        }).catch(console.warn);
    } else {
        navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n${shareUrl}`).then(() => {
            alert('Odkaz a poselství byly zkopírovány do schránky! Můžete je vložit přátelům.');
        }).catch(err => {
            console.error('Clipboard failed', err);
        });
    }
}

function stashPendingRuneContext(intention) {
    try {
        const rune = runesData.find(item => item.name === drawnRune?.name && item.symbol === drawnRune?.symbol);
        if (!rune) return;
        sessionStorage.setItem('pendingRuneContext', JSON.stringify({
            date: getPragueDateKey(),
            rune,
            ownerId: window.Auth?.user?.id || null,
            intention
        }));
    } catch (error) {
        console.warn('Rune context could not be kept for the return:', error);
    }
}

function restorePendingRuneContext() {
    try {
        const saved = sessionStorage.getItem('pendingRuneContext');
        if (!saved) return;
        sessionStorage.removeItem('pendingRuneContext');
        const pending = JSON.parse(saved);
        const today = getPragueDateKey();
        if (pending?.date !== today || typeof pending.intention !== 'string') return;
        if (pending.ownerId && pending.ownerId !== window.Auth?.user?.id) return;
        const rune = runesData.find(item => item.name === pending.rune?.name && item.symbol === pending.rune?.symbol);
        if (!rune || (drawnRune && drawnRune.name !== rune.name)) return;
        const input = document.getElementById('rune-intention');
        if (!input) return;

        drawnRune = rune;
        localStorage.setItem('runeDaily', JSON.stringify({ date: today, runeData: rune }));
        revealPreDrawnRune();
        input.value = pending.intention;
    } catch (error) {
        console.warn('Rune context could not be restored:', error);
    }
}

function checkDailyLock() {
    const today = getPragueDateKey();
    let savedDataStr;
    try {
        savedDataStr = localStorage.getItem('runeDaily');
    } catch (error) {
        console.warn('Daily rune lock is unavailable in this browser:', error);
        return;
    }

    if (savedDataStr) {
        try {
            const savedData = JSON.parse(savedDataStr);
            if (savedData.date === today && savedData.runeData) {
                drawnRune = savedData.runeData;
                revealPreDrawnRune();
            } else {
                localStorage.removeItem('runeDaily');
            }
        } catch (e) {
            console.error('Error parsing daily rune:', e);
            try { localStorage.removeItem('runeDaily'); } catch {}
        }
    }
}

function revealPreDrawnRune() {
    const runeEl = document.getElementById('active-rune');
    const drawBtn = document.getElementById('btn-draw');

    if (runeEl) {
        runeEl.classList.remove('hidden');
        document.getElementById('rune-symbol').textContent = drawnRune.symbol;
        runeEl.classList.add('rune-stone--drawn');
    }

    if (drawBtn) {
        drawBtn.hidden = true;
    }

    showResultData();
}

async function drawRune() {
    if (drawnRune || runeDrawInProgress) return; // Already drawn or shuffling
    runeDrawInProgress = true;

    const runeEl = document.getElementById('active-rune');
    const drawBtn = document.getElementById('btn-draw');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Keep the visible control available as the loading indicator.
    if (drawBtn) {
        drawBtn.disabled = true;
        drawBtn.hidden = false;
        drawBtn.textContent = 'Míchám runu…';
        drawBtn.setAttribute('aria-busy', 'true');
    }
    setRuneDrawStatus('Míchám runu dne.');

    try {
        // The visible stone should actually shuffle during the brief reveal.
        if (!prefersReducedMotion && runeEl) {
            runeEl.classList.add('shuffling');
            await new Promise(resolve => setTimeout(resolve, RUNE_SHUFFLE_DURATION_MS));
        }

        // Pick random
        const randomIndex = Math.floor(Math.random() * runesData.length);
        drawnRune = runesData[randomIndex];

        // Remove shuffling
        if (runeEl) {
            runeEl.classList.remove('hidden', 'rune-stone--disabled', 'shuffling');
            runeEl.classList.add('rune-stone--drawn');
            document.getElementById('rune-symbol').textContent = drawnRune.symbol;
        }
        if (drawBtn) drawBtn.hidden = true;
        setRuneDrawStatus(`Dnešní runa: ${drawnRune.name}.`);

        // Save to local storage
        const today = getPragueDateKey();
        try {
            localStorage.setItem('runeDaily', JSON.stringify({
                date: today,
                runeData: drawnRune
            }));
        } catch (storageError) {
            console.warn('Daily rune could not be persisted:', storageError);
            window.Auth?.showToast?.('Runa je vytažená', 'Prohlížeč si dnešní tah nemusí zapamatovat.', 'info');
        }
        // Show results
        showResultData();
    } catch (error) {
        console.error('Rune draw failed:', error);
        if (!drawnRune) {
            window.Auth?.showToast?.('Chyba', 'Runu se nepodařilo vytáhnout. Zkus to prosím znovu.', 'error');
            setRuneDrawStatus('Runu se nepodařilo vytáhnout. Zkus to znovu.');
        }
    } finally {
        runeDrawInProgress = false;
        runeEl?.classList.remove('shuffling');
        drawBtn?.removeAttribute('aria-busy');
        if (!drawnRune) {
            if (drawBtn) {
                drawBtn.disabled = false;
                drawBtn.hidden = false;
                drawBtn.textContent = runeDrawButtonLabel;
            }
        }
    }
}

function showResultData() {
    const resultFrame = document.getElementById('rune-result');
    if (!resultFrame) return;

    document.getElementById('rune-name').textContent = `${drawnRune.name} ${drawnRune.symbol}`;
    document.getElementById('rune-meaning').textContent = drawnRune.meaning;
    document.getElementById('rune-desc').textContent = drawnRune.description;

    // Show frame nicely
    resultFrame.classList.add('visible');

    // Scroll to it on mobile if needed
    setTimeout(() => {
        resultFrame.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    }, 300);
}

async function requestDeepReading() {
    const initialSession = captureRuneSession();
    if (!initialSession.isLoggedIn) {
        displayedRuneReadingSession = initialSession;
        const intention = document.getElementById('rune-intention')?.value || '';
        stashPendingRuneContext(intention);
        window.Auth?.showToast?.('V\u00FDklad je zam\u010Den\u00FD', 'Runa dne z\u016Fst\u00E1v\u00E1 zdarma. Osobn\u00ED v\u00FDklad je sou\u010D\u00E1st\u00ED \u010Dlenstv\u00ED.', 'info');
        showRuneUpgradePreview('runes_auth_gate', intention.trim());
        return;
    }

    const intentionInput = document.getElementById('rune-intention');
    const intention = intentionInput ? intentionInput.value.trim() : '';
    const btn = document.getElementById('btn-deep-reading');
    const aiContainer = document.getElementById('ai-response-container');
    const originUpsell = document.getElementById('premium-upsell');

    if (!drawnRune || !btn || !aiContainer || btn.disabled) return;
    clearRuneIntentionDependentResult();
    const requestSession = captureRuneSession();
    if (typeof requestSession.userId !== 'string' || !requestSession.userId) return;
    const requestRune = drawnRune;
    const requestGeneration = ++runeReadingGeneration;
    const requestAbortController = new AbortController();
    runeReadingAbortController?.abort();
    runeReadingAbortController = requestAbortController;
    activeRuneReadingSession = requestSession;
    const intentionRequest = intentionInput ? {
        input: intentionInput,
        previousDisabled: intentionInput.disabled,
        previousBusy: intentionInput.getAttribute('aria-busy')
    } : null;
    if (intentionRequest) {
        activeRuneIntentionRequest = intentionRequest;
        intentionInput.disabled = true;
        intentionInput.setAttribute('aria-busy', 'true');
    }
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = 'Připravuje se výklad… <div class="loading__spinner loading__spinner--inline" aria-hidden="true"></div>';
    const error = document.getElementById('runes-deep-error');
    error?.remove();

    try {
        const headers = await buildJsonHeaders();
        if (!isCurrentRuneRequest(requestGeneration, requestSession)) return;
        const response = await fetch(`${apiBase()}/runes`, {
            method: 'POST',
            credentials: 'include',
            signal: requestAbortController.signal,
            headers,
            body: JSON.stringify({
                rune: requestRune,
                intention
            }),
        });

        if (!isCurrentRuneRequest(requestGeneration, requestSession)) return;
        const data = await response.json();
        if (!isCurrentRuneRequest(requestGeneration, requestSession)) return;

        if (response.status === 401 || response.status === 402 || response.status === 403) {
            stashPendingRuneContext(intention);
            window.Auth?.showToast?.('\u010Clenstv\u00ED vy\u017Eadov\u00E1no', 'Osobn\u00ED v\u00FDklad runy je sou\u010D\u00E1st\u00ED \u010Dlenstv\u00ED Mystick\u00E9 Hv\u011Bzdy.', 'info');
            displayedRuneReadingSession = requestSession;
            showRuneUpgradePreview('runes_premium_gate', intention);
            return;
        }

        if (!data.success) {
            throw new Error(data.error || 'Neznámá chyba API');
        }

        displayedRuneReadingSession = requestSession;
        // Hide upsell block
        if (originUpsell) originUpsell.hidden = true;

        // Show response safely
        aiContainer.hidden = false;
        aiContainer.classList.remove('runes-upgrade-preview');
        aiContainer.classList.add('mh-block-visible');
        aiContainer.innerHTML = formatReadingHtml(data.response);
        showFallbackNotice(aiContainer, data.fallback);

        const saveResult = await saveRuneReading({
            response: data.response,
            intention,
            fallback: !!data.fallback,
            session: requestSession
        });
        if (!isCurrentRuneRequest(requestGeneration, requestSession)) return;

        if (saveResult?.id) {
            appendRuneFavoriteAction(aiContainer, saveResult.id);
        }

        aiContainer.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });

    } catch (error) {
        if (error?.name === 'AbortError' || !isCurrentRuneRequest(requestGeneration, requestSession)) return;
        console.error('Deep read failed:', error);
        displayedRuneReadingSession = requestSession;
        const message = document.createElement('p');
        message.id = 'runes-deep-error';
        message.setAttribute('role', 'alert');
        message.textContent = 'Výklad se nepodařilo načíst. Runa i záměr zůstávají zachované. Zkus požadavek znovu.';
        btn.insertAdjacentElement('beforebegin', message);
    } finally {
        if (requestGeneration === runeReadingGeneration) {
            btn.disabled = false;
            btn.removeAttribute('aria-busy');
            btn.textContent = 'Získat symbolický výklad';
            activeRuneReadingSession = null;
        }
        releaseRuneIntentionInput(intentionRequest);
        if (runeReadingAbortController === requestAbortController) runeReadingAbortController = null;
    }
}
