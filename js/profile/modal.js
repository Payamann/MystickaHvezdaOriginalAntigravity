/**
 * Modal logic for viewing reading details
 */

import { escapeHtml, apiUrl, authHeaders, authHeadersWithCsrf, getReadingIcon, getReadingLabel, getReadingData, profileIconMarkup } from './shared.js';
import { getAllReadings, updateReading, renderReadings, updateFavoriteSummary } from './readings.js';
import { formatReadingHtml, getFallbackMessage } from '../utils/reading-display.js';

// State
let currentReadingId = null;
let currentReadingIsFavorite = false;
let loadedReadingId = null;
let detailVersion = 0;
let detailRequest = null;
let modalActionPending = false;
let previousFocus = null;
let activeModal = null;
let focusTrapHandler = null;
const readingMutations = new Map();

function readingMutationKey(id) { return `${window.Auth?.user?.id || ''}:${id}`; }

function beginReadingMutation(id) {
    const key = readingMutationKey(id);
    if (readingMutations.has(key)) return null;
    let finish;
    const promise = new Promise(resolve => { finish = resolve; });
    const mutation = { key, promise, finish };
    readingMutations.set(key, mutation);
    return mutation;
}

function finishReadingMutation(mutation) {
    readingMutations.delete(mutation.key);
    mutation.finish();
    updateModalActions();
}

const FEEDBACK_RESONANCE_OPTIONS = [
    { value: 'fits', label: 'Sedí' },
    { value: 'neutral', label: 'Ještě nevím' },
    { value: 'miss', label: 'Netrefilo se' }
];

const FEEDBACK_FOCUS_OPTIONS = [
    { value: 'relationships', label: 'Vztahy' },
    { value: 'work', label: 'Práce' },
    { value: 'energy', label: 'Energie' },
    { value: 'self', label: 'Sebepoznání' },
    { value: 'timing', label: 'Načasování' }
];

export async function viewReading(id) {
    const modal = document.getElementById('reading-modal');
    const content = document.getElementById('reading-modal-content');
    if (!modal || !content) return;

    const version = ++detailVersion;
    detailRequest?.abort();
    const request = new AbortController();
    detailRequest = request;
    currentReadingId = id;
    loadedReadingId = null;
    currentReadingIsFavorite = false;
    modalActionPending = false;
    updateFavoriteButton();
    updateModalActions();
    modal.hidden = false;
    modal.classList.add('is-visible');
    content.setAttribute('aria-busy', 'true');
    content.innerHTML = '<p class="reading-modal__loading" role="status">Načítání...</p>';

    // Trap focus inside modal
    trapFocus(modal);

    try {
        const pending = readingMutations.get(readingMutationKey(id));
        if (pending) {
            await pending.promise;
            if (version !== detailVersion) return;
        }
        const response = await fetch(`${apiUrl()}/user/readings/${encodeURIComponent(id)}`, {
            credentials: 'include',
            headers: authHeaders(),
            signal: request.signal
        });

        if (!response.ok) throw new Error('Failed to fetch reading');

        const data = await response.json();
        if (version !== detailVersion) return;
        const reading = data.reading;
        if (!reading || String(reading.id) !== String(id)) throw new Error('Invalid reading detail');

        content.innerHTML = renderReadingContent(reading);
        bindReadingImageFallbacks(content);
        bindReadingFeedback(content, reading);
        loadedReadingId = id;
        currentReadingIsFavorite = Boolean(reading.is_favorite);
        updateFavoriteButton();

    } catch (error) {
        if (version !== detailVersion) return;
        loadedReadingId = null;
        console.error('Error loading reading:', error);
        content.innerHTML = '<p class="reading-modal__error" role="alert">Nepodařilo se načíst výklad. Zavři detail a zkus ho otevřít znovu.</p>';
    } finally {
        if (version === detailVersion) {
            detailRequest = null;
            content.setAttribute('aria-busy', 'false');
            updateModalActions();
        }
    }
}

export function closeReadingModal() {
    ++detailVersion;
    detailRequest?.abort();
    detailRequest = null;
    const modal = document.getElementById('reading-modal');
    if (modal) {
        modal.classList.remove('is-visible');
        modal.hidden = true;
    }
    currentReadingId = null;
    loadedReadingId = null;
    modalActionPending = false;
    document.getElementById('reading-modal-content')?.setAttribute('aria-busy', 'false');
    updateModalActions();
    releaseFocus();
}

export async function toggleFavoriteModal() {
    if (!canUseModalActions()) return;
    const id = loadedReadingId;
    const version = detailVersion;
    modalActionPending = true;
    updateModalActions();
    try {
        const favoriteState = await toggleFavorite(id);
        if (version !== detailVersion || favoriteState === undefined) return;
        currentReadingIsFavorite = favoriteState;
        updateFavoriteButton();
    } finally {
        if (version === detailVersion) {
            modalActionPending = false;
            updateModalActions();
        }
    }
}

export async function toggleFavorite(id, buttonEl = null) {
    const ownerId = window.Auth?.user?.id;
    const mutation = beginReadingMutation(id);
    if (!mutation) return;
    if (buttonEl) buttonEl.disabled = true;
    try {
        const response = await fetch(`${apiUrl()}/user/readings/${encodeURIComponent(id)}/favorite`, {
            method: 'PATCH',
            credentials: 'include',
            headers: await authHeadersWithCsrf()
        });

        if (!response.ok) throw new Error('Failed to toggle favorite');

        const data = await response.json();
        if (typeof data.is_favorite !== 'boolean') throw new Error('Neplatná odpověď oblíbených.');
        if (ownerId !== window.Auth?.user?.id) return data.is_favorite;
        updateFavoriteSummary(!data.is_favorite, data.is_favorite);

        if (buttonEl) {
            buttonEl.innerHTML = profileIconMarkup('bookmark');
            buttonEl.setAttribute('aria-pressed', String(data.is_favorite));
            buttonEl.title = data.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených';
            buttonEl.setAttribute('aria-label', data.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených');
        }

        // Update local data and re-render readings list if needed
        const allReadings = getAllReadings();
        const reading = allReadings.find(r => r.id === id);
        if (reading) {
            reading.is_favorite = data.is_favorite;
            // We need to trigger stats update - this will be handled by dashboard.js which listens to events
            // but for now let's just update the list UI if it's visible
            renderReadings();
        }

        // Dispatch custom event for stats update
        document.dispatchEvent(new CustomEvent('reading:updated', { detail: { reason: 'favorite', id, isFavorite: data.is_favorite } }));

        return data.is_favorite;

    } catch (error) {
        console.error('Error toggling favorite:', error);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se změnit oblíbené.', 'error');
    } finally {
        finishReadingMutation(mutation);
        if (buttonEl) buttonEl.disabled = false;
    }
}

export async function deleteReading() {
    if (!canUseModalActions()) return;
    const id = loadedReadingId;
    const version = detailVersion;

    if (!confirm('Opravdu chceš smazat tento výklad? Tuto akci nelze vrátit.')) {
        return;
    }

    const mutation = beginReadingMutation(id);
    if (!mutation) return;
    modalActionPending = true;
    const ownerId = window.Auth?.user?.id;
    updateModalActions();
    try {
        const response = await fetch(`${apiUrl()}/user/readings/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: await authHeadersWithCsrf()
        });

        if (!response.ok) throw new Error('Failed to delete reading');
        if (ownerId !== window.Auth?.user?.id) return;

        window.Auth?.showToast?.('Smazáno', 'Výklad byl smazán.', 'success');
        if (version === detailVersion) closeReadingModal();

        // Reload readings to refresh list and stats
        document.dispatchEvent(new CustomEvent('reading:updated', { detail: { reason: 'delete', id } }));

    } catch (error) {
        console.error('Error deleting reading:', error);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se smazat výklad.', 'error');
    } finally {
        finishReadingMutation(mutation);
        if (version === detailVersion) {
            modalActionPending = false;
            updateModalActions();
        }
    }
}

function canUseModalActions() {
    return loadedReadingId !== null && loadedReadingId === currentReadingId && !modalActionPending
        && !readingMutations.has(readingMutationKey(loadedReadingId));
}

function updateModalActions() {
    ['modal-favorite-btn', 'modal-delete-btn'].forEach(id => {
        const button = document.getElementById(id);
        if (button) button.disabled = !canUseModalActions();
    });
}

function updateFavoriteButton() {
    const btn = document.getElementById('modal-favorite-btn');
    if (btn) {
        btn.innerHTML = `${profileIconMarkup('bookmark')} ${currentReadingIsFavorite ? 'V oblíbených' : 'Přidat do oblíbených'}`;
        btn.setAttribute('aria-pressed', String(currentReadingIsFavorite));
        btn.setAttribute('aria-label', currentReadingIsFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených');
    }
}

function trapFocus(modal) {
    if (activeModal === modal) return;
    previousFocus = document.activeElement;
    activeModal = modal;

    const focusable = getFocusableElements(modal);
    const initialFocus = modal.querySelector('.modal__close') || focusable[0] || modal;
    initialFocus.focus();

    focusTrapHandler = (event) => {
        if (!activeModal) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeReadingModal();
            return;
        }

        if (event.key !== 'Tab') return;

        const currentFocusable = getFocusableElements(activeModal);
        if (!currentFocusable.length) {
            event.preventDefault();
            activeModal.focus();
            return;
        }

        const first = currentFocusable[0];
        const last = currentFocusable[currentFocusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    document.addEventListener('keydown', focusTrapHandler);
}

function releaseFocus() {
    if (focusTrapHandler) {
        document.removeEventListener('keydown', focusTrapHandler);
        focusTrapHandler = null;
    }

    activeModal = null;

    if (previousFocus) {
        const readingId = previousFocus.closest('[data-reading-id]')?.dataset.readingId;
        const replacement = [...document.querySelectorAll('[data-reading-action="view"]')].find(button => button.dataset.readingId === readingId && button.offsetParent !== null);
        const focusTarget = previousFocus.isConnected ? previousFocus : replacement || document.querySelector('.profile-tab[aria-selected="true"]');
        focusTarget?.focus();
        previousFocus = null;
    }
}

function getFocusableElements(modal) {
    return Array.from(modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.offsetParent !== null);
}

function bindReadingImageFallbacks(root) {
    root.querySelectorAll('[data-tarot-fallback]').forEach((image) => {
        image.addEventListener('error', () => {
            if (image.dataset.fallbackApplied === '1') return;
            image.dataset.fallbackApplied = '1';
            image.src = '/img/tarot-v2/tarot_card_back.webp';
        });
    });
}

function setReadingFeedbackStatus(panel, message, state = 'neutral') {
    const status = panel?.querySelector?.('.reading-feedback__status');
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
}

async function saveProfileReadingFeedback(readingId, payload, panel, trigger) {
    if (!readingId) return null;

    if (trigger) trigger.disabled = true;
    setReadingFeedbackStatus(panel, 'Ukládám zpětnou vazbu...', 'pending');

    let result = null;
    try {
        if (window.Auth?.saveReadingFeedback) {
            result = await window.Auth.saveReadingFeedback(readingId, {
                ...payload,
                feature: 'profile_history',
                source: 'profile_reading_modal'
            });
        } else {
            const response = await fetch(`${apiUrl()}/user/readings/${encodeURIComponent(readingId)}/feedback`, {
                method: 'PATCH',
                credentials: 'include',
                headers: await authHeadersWithCsrf(true),
                body: JSON.stringify({
                    ...payload,
                    feature: 'profile_history',
                    source: 'profile_reading_modal'
                })
            });
            result = await response.json().catch(() => null);
            if (!response.ok) result = null;
        }

        if (!result?.success) {
            setReadingFeedbackStatus(panel, 'Nepodařilo se uložit. Zkus to znovu.', 'error');
            return null;
        }

        if (result.reading) {
            updateReading(readingId, result.reading);
        }

        document.dispatchEvent(new CustomEvent('reading:updated', { detail: { reason: 'feedback', id: readingId } }));
        setReadingFeedbackStatus(panel, 'Zpětná vazba je uložená.', 'success');
        return result;
    } catch (error) {
        console.warn('Reading feedback unavailable:', error.message);
        setReadingFeedbackStatus(panel, 'Nepodařilo se uložit. Zkus to znovu.', 'error');
        return null;
    } finally {
        if (trigger) trigger.disabled = false;
    }
}

function renderReadingFeedbackPanel(reading) {
    const data = getReadingData(reading || {});
    if (reading?.type === 'journal' || !data || typeof data !== 'object' || Array.isArray(data)) return '';

    const feedback = data.feedback && typeof data.feedback === 'object' && !Array.isArray(data.feedback)
        ? data.feedback
        : {};
    const resonanceChips = FEEDBACK_RESONANCE_OPTIONS.map(option => `
        <button type="button" class="reading-feedback__chip ${feedback.resonance === option.value ? 'is-selected' : ''}" data-feedback-resonance="${option.value}">
            ${escapeHtml(option.label)}
        </button>
    `).join('');
    const focusChips = FEEDBACK_FOCUS_OPTIONS.map(option => `
        <button type="button" class="reading-feedback__chip ${feedback.focus === option.value ? 'is-selected' : ''}" data-feedback-focus="${option.value}">
            ${escapeHtml(option.label)}
        </button>
    `).join('');

    return `
        <section class="reading-feedback" data-reading-feedback="${escapeHtml(reading.id)}">
            <div class="reading-feedback__header">
                <span class="reading-feedback__eyebrow">Zpětná vazba</span>
                <strong>Co má profil brát jako další signál?</strong>
            </div>
            <div class="reading-feedback__chips" aria-label="Zpětná vazba k výkladu">
                ${resonanceChips}
            </div>
            <div class="reading-feedback__chips" aria-label="Téma pro paměť rituálu">
                ${focusChips}
            </div>
            <div class="reading-feedback__actions">
                <button type="button" class="btn btn--glass btn--sm" data-feedback-next-action="journal">Zapsat reflexi</button>
                <a class="btn btn--glass btn--sm" href="tarot.html?source=profile_feedback&feature=another_reading" data-feedback-next-action="another_reading">Navázat výkladem</a>
            </div>
            <p class="reading-feedback__status" aria-live="polite"></p>
        </section>
    `;
}

function focusJournalFromModal() {
    closeReadingModal();
    const input = document.getElementById('journal-input');
    if (!input) return;

    window.history.replaceState(null, '', '#journal-input');
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => input.focus(), 250);
}

function bindReadingFeedback(root, reading) {
    const panel = root.querySelector('[data-reading-feedback]');
    if (!panel) return;

    panel.addEventListener('click', async (event) => {
        const resonanceBtn = event.target.closest('[data-feedback-resonance]');
        const focusBtn = event.target.closest('[data-feedback-focus]');
        const nextActionEl = event.target.closest('[data-feedback-next-action]');
        const clickedEl = resonanceBtn || focusBtn || nextActionEl;
        if (!clickedEl) return;

        const payload = {};
        if (resonanceBtn) payload.resonance = resonanceBtn.dataset.feedbackResonance;
        if (focusBtn) payload.focus = focusBtn.dataset.feedbackFocus;
        if (nextActionEl) payload.nextAction = nextActionEl.dataset.feedbackNextAction;

        panel.querySelectorAll('.reading-feedback__chip').forEach((chip) => {
            if ((payload.resonance && chip.dataset.feedbackResonance)
                || (payload.focus && chip.dataset.feedbackFocus)) {
                chip.classList.toggle('is-selected', chip === clickedEl);
            }
        });

        if (nextActionEl?.tagName === 'A') {
            event.preventDefault();
            const result = await saveProfileReadingFeedback(reading.id, payload, panel, null);
            if (result?.success) window.location.href = nextActionEl.getAttribute('href');
            return;
        }

        if (payload.nextAction === 'journal') {
            const result = await saveProfileReadingFeedback(reading.id, payload, panel, nextActionEl);
            if (result?.success) focusJournalFromModal();
            return;
        }

        await saveProfileReadingFeedback(reading.id, payload, panel, clickedEl);
    });
}

function formatStructuredFieldLabel(key) {
    const labels = {
        era: 'Období',
        identity: 'Identita',
        karmic_lesson: 'Karmická lekce',
        gifts: 'Dary',
        patterns: 'Vzorce',
        mission: 'Mise',
        message: 'Poselství',
        strengths: 'Silné stránky',
        challenges: 'Výzvy'
    };

    return labels[key] || String(key)
        .replace(/_/g, ' ')
        .replace(/^\w/, (char) => char.toUpperCase());
}

function renderStructuredObjectContent(content) {
    if (!content || typeof content !== 'object') return '';

    return Object.entries(content)
        .filter(([, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
            const displayValue = typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : String(value);

            return `
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${escapeHtml(formatStructuredFieldLabel(key))}</h4>
                    <p class="reading-structured-field__value">${escapeHtml(displayValue).replace(/\n/g, '<br>')}</p>
                </section>
            `;
        })
        .join('');
}

function renderMetricSummary(title, metrics) {
    const items = metrics
        .filter((item) => item.value !== null && item.value !== undefined && item.value !== '')
        .map((item) => `
            <span class="reading-metric">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.value)}</span>
            </span>
        `)
        .join('');

    if (!items) return '';

    return `
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${escapeHtml(title)}</h3>
            <div class="reading-metric-grid">${items}</div>
        </section>
    `;
}

function renderChartSummary(chart) {
    const summary = chart?.summary;
    if (!summary) return '';

    return renderMetricSummary('Vypočtená mapa', [
        { label: 'Slunce', value: summary.sunSign },
        { label: 'Měsíc', value: summary.moonSign },
        { label: 'Ascendent', value: summary.ascendantSign || 'nevypočten' },
        { label: 'Dominantní živel', value: summary.dominantElement },
        { label: 'Modalita', value: summary.dominantQuality }
    ]);
}

function renderSynastrySummary(data) {
    const scores = data?.synastry?.scores || data?.scores;
    if (!scores) return '';

    return renderMetricSummary('Skóre vztahu', [
        { label: 'Osoba 1', value: data.person1?.name },
        { label: 'Osoba 2', value: data.person2?.name },
        { label: 'Celkem', value: `${scores.total ?? scores.totalScore ?? '--'} %` },
        { label: 'Emoce', value: `${scores.emotion ?? scores.emotionScore ?? '--'} %` },
        { label: 'Komunikace', value: `${scores.communication ?? scores.commScore ?? '--'} %` },
        { label: 'Vášeň', value: `${scores.passion ?? scores.passionScore ?? '--'} %` },
        { label: 'Stabilita', value: `${scores.stability ?? scores.stabilityScore ?? '--'} %` }
    ]);
}

function renderAstrocartographySummary(astrocartography) {
    if (!astrocartography || typeof astrocartography !== 'object') return '';

    const recommendations = Array.isArray(astrocartography.recommendations)
        ? astrocartography.recommendations.slice(0, 3)
        : [];
    const lines = Array.isArray(astrocartography.angularLines)
        ? astrocartography.angularLines.slice(0, 4)
        : [];

    const recommendationHtml = recommendations.map((item) => `
        <li>
            <strong>${escapeHtml(item.city || 'Místo')}</strong>
            <span>${escapeHtml(item.score ?? '--')} / 100 · ${escapeHtml(item.primaryPlanet?.name || 'planeta')}</span>
        </li>
    `).join('');
    const lineHtml = lines.map((line) => `
        <li>
            <strong>${escapeHtml(line.planetName || 'Planeta')} ${escapeHtml(line.angle || '')}</strong>
            <span>${escapeHtml(line.longitude ?? '--')}°</span>
        </li>
    `).join('');

    if (!recommendationHtml && !lineHtml) return '';

    return `
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">Astro mapa</h3>
            ${recommendationHtml ? `<ul class="reading-summary-list">${recommendationHtml}</ul>` : ''}
            ${lineHtml ? `<ul class="reading-summary-list reading-summary-list--compact">${lineHtml}</ul>` : ''}
        </section>
    `;
}

function renderReadingContent(reading) {
    const date = new Date(reading.created_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let contentHtml = `
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${getReadingIcon(reading.type)}</span>
            <h2 class="reading-detail__title">${escapeHtml(getReadingLabel(reading))}</h2>
            <p class="reading-detail__date">${date}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `;

    const data = getReadingData(reading) || {};
    if (data?.fallback) contentHtml += `<p class="result-context-notice">${escapeHtml(getFallbackMessage())}</p>`;
    if (typeof data?.question === 'string' && data.question) {
        contentHtml += `<div class="reading-question"><small class="reading-question__label">Tvoje otázka</small><p class="reading-question__text">${escapeHtml(data.question)}</p></div>`;
    }
    if (typeof data?.intention === 'string' && data.intention && data.intention !== data.question) {
        contentHtml += `<div class="reading-question"><small class="reading-question__label">Původní záměr</small><p class="reading-question__text">${escapeHtml(data.intention)}</p></div>`;
    }
    if (data?.rune && typeof data.rune === 'object') {
        contentHtml += `<section class="reading-summary-panel"><h3>${escapeHtml(data.rune.symbol || '')} ${escapeHtml(data.rune.name || 'Runa')}</h3><p>${escapeHtml(data.rune.meaning || '')}</p></section>`;
    }
    if (data?.card && typeof data.card === 'object' && reading.type !== 'tarot') {
        contentHtml += `<section class="reading-summary-panel"><h3>${escapeHtml(data.card.name || 'Karta')}</h3><p>${escapeHtml(data.card.theme || '')}</p><p>${escapeHtml(data.card.message || '')}</p></section>`;
    }
    if (data?.totem) {
        contentHtml += `<section class="reading-summary-panel"><h3>Původní symbol</h3>${typeof data.totem === 'object' ? renderStructuredObjectContent(data.totem) : `<p>${escapeHtml(data.totem)}</p>`}</section>`;
    }
    if (data && typeof data === 'object') {
        if (reading.type === 'synastry') {
            contentHtml += renderSynastrySummary(data);
        }
        if (reading.type === 'numerology') {
            contentHtml += renderMetricSummary('Vypočtená čísla', [
                { label: 'Životní cesta', value: data.lifePath },
                { label: 'Osud', value: data.destiny },
                { label: 'Duše', value: data.soul },
                { label: 'Osobnost', value: data.personality }
            ]);
        }
        contentHtml += renderChartSummary(data.chart || data.synastry?.person1?.chart);
        if (reading.type === 'astrocartography') {
            contentHtml += renderAstrocartographySummary(data.astrocartography);
        }
    }

    function getTarotImageByName(name, image) {
        if (typeof image === 'string' && /^\/?img\/tarot-v2\/[a-z0-9_-]+\.webp$/i.test(image)) return image;
        if (!name || typeof name !== 'string') return 'img/tarot-v2/tarot_card_back.webp';
        const normalized = name.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/ /g, '_')
            .replace(/[^a-z0-9_]/g, '');
        return `img/tarot-v2/tarot_${normalized}.webp`;
    }

    const tarotCards = Array.isArray(data.cards) ? data.cards
        : reading.type === 'tarot' && (data.card_name || data.cardName) ? [{ name: data.card_name || data.cardName }] : null;
    if (typeof data === 'string') {
        contentHtml += `<div class="reading-plain-text">${escapeHtml(data).replace(/\n/g, '<br>')}</div>`;
    } else if (reading.type === 'tarot' && tarotCards?.length) {
        contentHtml += '<div class="reading-tarot-grid">';
        tarotCards.forEach(savedCard => {
            const card = typeof savedCard === 'string' ? { name: savedCard } : savedCard || {};
            const imagePath = getTarotImageByName(card.name, card.image);
            contentHtml += `
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${escapeHtml(imagePath)}"
                              alt="${escapeHtml(card.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${escapeHtml(card.name)}</p>
                    ${card.position ? `<small class="reading-tarot-card__position">${escapeHtml(card.position)}</small>` : ''}
                    ${card.meaning ? `<p>${escapeHtml(card.meaning)}</p>` : ''}
                </div>
            `;
        });
        contentHtml += `</div>`;

        const summary = data.response || data.interpretation || data.answer;
        if (summary) {
            const escapedSummary = typeof summary === 'object'
                ? renderStructuredObjectContent(summary)
                : formatReadingHtml(summary);
            contentHtml += `
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">VÝKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${escapedSummary}
                    </div>
                </div>
            `;
        }
        tarotCards.forEach(savedCard => {
            if (!savedCard || typeof savedCard !== 'object' || !savedCard.interpretation) return;
            contentHtml += `<details class="reading-card-reference" ${!summary && tarotCards.length === 1 ? 'open' : ''}>
                <summary>Význam karty ${escapeHtml(savedCard.name)}${savedCard.position ? ` · ${escapeHtml(savedCard.position)}` : ''}</summary>
                <div class="reading-interpretation__text">${typeof savedCard.interpretation === 'object' ? renderStructuredObjectContent(savedCard.interpretation) : formatReadingHtml(savedCard.interpretation)}</div>
            </details>`;
        });
    } else if (reading.type === 'horoscope' && (data.text || data.prediction)) {
        const text = data.text || data.prediction;
        const periodMap = { 'daily': 'Denní horoskop', 'weekly': 'Týdenní horoskop', 'monthly': 'Měsíční horoskop' };
        const periodLabel = periodMap[data.period] || data.period || 'Horoskop';

        contentHtml += `
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${escapeHtml(data.sign || 'Znamení')}</h3>
                <span class="reading-horoscope-header__period">${escapeHtml(periodLabel)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${typeof text === 'object' ? renderStructuredObjectContent(text) : formatReadingHtml(text)}
            </div>
        `;

        if (data.affirmation) {
            contentHtml += `<section class="reading-summary-panel"><h4>Podnět k zamyšlení</h4><p>${escapeHtml(data.affirmation)}</p></section>`;
        }

        if (data.luckyNumbers) {
            contentHtml += `
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">Šťastná čísla</span>
                    <span class="reading-lucky-numbers__value">${escapeHtml(data.luckyNumbers.toString())}</span>
                </div>
            `;
        }
    } else if (data.answer) {
        contentHtml += `
            <div class="reading-answer">
                ${escapeHtml(data.answer)}
            </div>
        `;
    } else if (data.interpretation || data.response || data.text || data.result) {
        let content = data.interpretation || data.response || data.text || data.result;

        if (typeof content === 'string') {
            const sanitized = formatReadingHtml(content);
            contentHtml += `<div class="formatted-content reading-formatted-content">${sanitized}</div>`;
        } else {
            contentHtml += `<div class="reading-structured">${renderStructuredObjectContent(content)}</div>`;
        }
    } else {
        contentHtml += `<pre class="reading-json">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    }

    contentHtml += `</div>`;
    contentHtml += renderReadingFeedbackPanel(reading);
    return contentHtml;
}
