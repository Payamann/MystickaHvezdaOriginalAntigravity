/**
 * Modal logic for viewing reading details
 */

import { escapeHtml, apiUrl, authHeaders, getReadingIcon, getReadingTitle } from './shared.js';
import { getAllReadings, updateReading, renderReadings, loadReadings } from './readings.js';
import { loadFavorites } from './favorites.js';

// State
let currentReadingId = null;
let currentReadingIsFavorite = false;
let previousFocus = null;
let activeModal = null;
let focusTrapHandler = null;

export async function viewReading(id) {
    const modal = document.getElementById('reading-modal');
    const content = document.getElementById('reading-modal-content');
    if (!modal || !content) return;

    currentReadingId = id;
    modal.hidden = false;
    modal.classList.add('is-visible');
    content.innerHTML = '<p class="reading-modal__loading">Načítání...</p>';

    // Trap focus inside modal
    trapFocus(modal);

    try {
        const response = await fetch(`${apiUrl()}/user/readings/${id}`, {
            credentials: 'include',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch reading');

        const data = await response.json();
        const reading = data.reading;

        currentReadingIsFavorite = reading.is_favorite;
        updateFavoriteButton();

        content.innerHTML = renderReadingContent(reading);
        bindReadingImageFallbacks(content);

    } catch (error) {
        console.error('Error loading reading:', error);
        content.innerHTML = '<p class="reading-modal__error">Nepodařilo se načíst výklad.</p>';
    }
}

export function closeReadingModal() {
    const modal = document.getElementById('reading-modal');
    if (modal) {
        modal.classList.remove('is-visible');
        modal.hidden = true;
    }
    currentReadingId = null;
    releaseFocus();
}

export async function toggleFavoriteModal() {
    if (!currentReadingId) return;
    await toggleFavorite(currentReadingId);
    currentReadingIsFavorite = !currentReadingIsFavorite;
    updateFavoriteButton();
}

export async function toggleFavorite(id, buttonEl = null) {
    try {
        const response = await fetch(`${apiUrl()}/user/readings/${id}/favorite`, {
            method: 'PATCH',
            credentials: 'include',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to toggle favorite');

        const data = await response.json();

        if (buttonEl) {
            buttonEl.textContent = data.is_favorite ? '⭐' : '☆';
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
        document.dispatchEvent(new CustomEvent('reading:updated', { detail: { readings: allReadings } }));

        // Refresh favorites tab if visible
        const favoritesTab = document.getElementById('tab-favorites');
        if (favoritesTab && favoritesTab.classList.contains('is-active')) {
            loadFavorites();
        }

    } catch (error) {
        console.error('Error toggling favorite:', error);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se změnit oblíbené.', 'error');
    }
}

export async function deleteReading() {
    if (!currentReadingId) return;

    if (!confirm('Opravdu chcete smazat tento výklad? Tuto akci nelze vrátit.')) {
        return;
    }

    try {
        const response = await fetch(`${apiUrl()}/user/readings/${currentReadingId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete reading');

        window.Auth?.showToast?.('Smazáno', 'Výklad byl smazán.', 'success');
        closeReadingModal();

        // Reload readings to refresh list and stats
        const readings = await loadReadings();
        document.dispatchEvent(new CustomEvent('reading:updated', { detail: { readings } }));

    } catch (error) {
        console.error('Error deleting reading:', error);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se smazat výklad.', 'error');
    }
}

function updateFavoriteButton() {
    const btn = document.getElementById('modal-favorite-btn');
    if (btn) {
        btn.textContent = currentReadingIsFavorite ? '⭐ V oblíbených' : '☆ Přidat do oblíbených';
        btn.setAttribute('aria-label', currentReadingIsFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených');
    }
}

function trapFocus(modal) {
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
        previousFocus.focus();
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
            image.src = '/img/tarot/tarot_placeholder.webp';
        });
    });
}

function renderReadingContent(reading) {
    const date = new Date(reading.created_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let contentHtml = `
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${getReadingIcon(reading.type)}</span>
            <h2 class="reading-detail__title">${escapeHtml(getReadingTitle(reading.type))}</h2>
            <p class="reading-detail__date">${date}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `;

    const data = reading.data || {};

    function getTarotImageByName(name) {
        if (!name) return 'img/tarot/tarot_placeholder.webp';
        const normalized = name.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/ /g, '_');
        return `img/tarot/tarot_${normalized}.webp`;
    }

    if (reading.type === 'tarot' && data.cards) {
        contentHtml += '<div class="reading-tarot-grid">';
        data.cards.forEach(card => {
            const imagePath = getTarotImageByName(card.name);
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
                </div>
            `;
        });
        contentHtml += `</div>`;

        const summary = data.response || data.interpretation;
        if (summary) {
            contentHtml += `
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">VÝKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${summary.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
        }
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
                ${escapeHtml(text)}
            </div>
        `;

        if (data.luckyNumbers) {
            contentHtml += `
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">Šťastná čísla</span>
                    <span class="reading-lucky-numbers__value">${escapeHtml(data.luckyNumbers.toString())}</span>
                </div>
            `;
        }
    } else if (data.answer) {
        if (data.question) {
            contentHtml += `
                <div class="reading-question">
                    <small class="reading-question__label">Otázka</small>
                    <p class="reading-question__text">"${escapeHtml(data.question)}"</p>
                </div>
            `;
        }
        contentHtml += `
            <div class="reading-answer">
                ${escapeHtml(data.answer)}
            </div>
        `;
    } else if (data.interpretation || data.text || data.result) {
        let content = data.interpretation || data.text || data.result;

        if (typeof content === 'string') {
            const sanitized = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(content) : content;
            contentHtml += `<div class="formatted-content reading-formatted-content">${sanitized}</div>`;
        } else {
            contentHtml += `<p class="reading-plain-text">${escapeHtml(content)}</p>`;
        }
    } else {
        contentHtml += `<pre class="reading-json">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    }

    contentHtml += `</div>`;
    return contentHtml;
}
