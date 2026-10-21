/**
 * Reading history management
 */

import { profileIconMarkup, escapeHtml, apiUrl, authHeaders, getReadingIcon, getReadingLabel, getReadingPreview, READING_FILTERS } from './shared.js';

// State
let allReadings = [];
let currentFilter = 'all';
let displayedCount = 0;
let visibleReadings = [];
let serverPage = 1;
let serverTotal = 0;
let serverPages = 0;
let readingSummary = null;
let requestVersion = 0;
let loadingMore = false;
let loadingMoreVersion = 0;
const PAGE_SIZE = 10;
let emptyHistoryViewTracked = false;

let activationHeroViewTracked = false;

// Getter for allReadings (used by modal.js)
export function getAllReadings() {
    return allReadings;
}

export function getReadingSummary() { return readingSummary; }

export function resetReadingsState() {
    ++requestVersion;
    invalidateLoadingMore();
    loadingMore = false;
    allReadings = [];
    visibleReadings = [];
    readingSummary = null;
    currentFilter = 'all';
    displayedCount = serverPage = serverTotal = serverPages = 0;
    document.getElementById('readings-list')?.replaceChildren();
}

export function initReadingFilters() {
    const select = document.getElementById('readings-filter');
    if (!select) return;
    select.innerHTML = READING_FILTERS.map(filter => `<option value="${filter.value}">${filter.label}</option>`).join('');
}

export function updateFavoriteSummary(wasFavorite, isFavorite) {
    if (readingSummary && wasFavorite !== isFavorite) {
        readingSummary.favorites = Math.max(0, readingSummary.favorites + (isFavorite ? 1 : -1));
    }
}

async function fetchPage(page, filter = 'all', summary = false) {
    const query = new URLSearchParams({ page: String(page), limit: '20' });
    if (filter !== 'all') query.set('type', (READING_FILTERS.find(item => item.value === filter)?.types || [filter]).join(','));
    if (summary) query.set('summary', 'true');
    const response = await fetch(`${apiUrl()}/user/readings?${query}`, { credentials: 'include', headers: authHeaders() });
    if (!response.ok) throw new Error('Nepodařilo se načíst historii.');
    const data = await response.json();
    if (!data.success || !Array.isArray(data.readings)) throw new Error('Nepodařilo se načíst historii.');
    return data;
}

function acceptPage(data, append = false) {
    const merge = (previous, next) => [...new Map([...previous, ...next].map(reading => [reading.id, reading])).values()];
    visibleReadings = append ? merge(visibleReadings, data.readings) : data.readings;
    allReadings = merge(allReadings, data.readings);
    serverPage = data.pagination?.page || 1;
    serverTotal = data.pagination?.total ?? visibleReadings.length;
    serverPages = data.pagination?.totalPages || 1;
    if (data.summary) readingSummary = data.summary;
}

// Setter for updating a reading (used by modal.js)
export function updateReading(id, updates) {
    const reading = allReadings.find(r => r.id === id);
    if (reading) {
        Object.assign(reading, updates);
    }
}

export async function loadReadings({ preserveFilter = false } = {}) {
    const container = document.getElementById('readings-list');
    const version = ++requestVersion;
    invalidateLoadingMore();

    try {
        if (!preserveFilter) currentFilter = 'all';
        const filter = currentFilter;
        const select = document.getElementById('readings-filter');
        if (select) select.value = filter;
        const [data, summaryData] = await Promise.all([
            fetchPage(1, filter, filter === 'all'),
            filter === 'all' ? null : fetchPage(1, 'all', true)
        ]);
        if (version !== requestVersion) return allReadings;
        allReadings = summaryData?.readings || [];
        acceptPage(data);
        if (summaryData?.summary) readingSummary = summaryData.summary;
        displayedCount = PAGE_SIZE;

        renderReadings();
        return allReadings;

    } catch (error) {
        if (version !== requestVersion) return allReadings;
        readingSummary = null;
        console.error('Error loading readings:', error);
        updatePagination(0, 0);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">${profileIconMarkup('warning')}</div>
                    <p class="empty-state__text">Nepodařilo se načíst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `;
            container.querySelector('[data-readings-action="reload"]')?.addEventListener('click', () => location.reload());
        }
        return [];
    }
}

export async function handleFilterChange(e) {
    currentFilter = e.target.value;
    const version = ++requestVersion;
    invalidateLoadingMore();
    const container = document.getElementById('readings-list');
    if (container) container.innerHTML = '<p class="profile-loading" role="status">Načítání…</p>';
    updatePagination(0, 0);
    try {
        const data = await fetchPage(1, currentFilter);
        if (version !== requestVersion) return;
        acceptPage(data);
        displayedCount = PAGE_SIZE;
        renderReadings();
    } catch {
        if (version !== requestVersion) return;
        if (container) {
            container.innerHTML = '<p role="alert">Nepodařilo se načíst historii.</p><button type="button" class="btn btn--glass btn--sm" data-readings-action="retry-filter">Zkusit znovu</button>';
            container.querySelector('button')?.addEventListener('click', () => handleFilterChange({ target: { value: currentFilter } }));
        }
    }
}

function getFilteredReadings() {
    return visibleReadings;
}

function renderActivationHero() {
    if (!activationHeroViewTracked) {
        activationHeroViewTracked = true;
        window.MH_ANALYTICS?.trackEvent?.('profile_activation_viewed', {
            source: 'profile_history',
            feature: 'profile_history'
        });
    }

    return `
        <div class="card glass-card profile-activation-hero">
            <div class="profile-activation-hero__icon" aria-hidden="true"><svg class="mh-symbol" viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg></div>
            <h4 class="profile-activation-hero__title">Tvůj deník čeká na první výklad</h4>
            <p class="profile-activation-hero__lead">Výklady se ukládají sem, takže se k nim kdykoliv vrátíš a příště na ně navážeš dalším krokem.</p>
            <div class="profile-activation-hero__grid">
                <a href="tarot-ano-ne.html?source=profile_activation&feature=tarot_yes_no" class="profile-activation-hero__card" data-analytics-cta="profile_activation_tarot_yes_no" data-analytics-feature="tarot_yes_no">
                    <strong>Tarot ano/ne</strong>
                    <span>Rychlá odpověď na jednu konkrétní otázku.</span>
                </a>
                <a href="tarot-karta-dne.html?source=profile_activation" class="profile-activation-hero__card" data-analytics-cta="profile_activation_card_of_day" data-analytics-feature="tarot_daily_card_profile_save">
                    <strong>Karta dne</strong>
                    <span>Jeden symbol, který nastaví směr pro dnešek.</span>
                </a>
                <a href="horoskopy.html?source=profile_activation" class="profile-activation-hero__card" data-analytics-cta="profile_activation_daily_horoscope" data-analytics-feature="daily_guidance">
                    <strong>Denní horoskop</strong>
                    <span>Osobní vedení pro tvoje znamení na dnešek.</span>
                </a>
            </div>
        </div>
    `;
}

export function renderReadings() {
    const container = document.getElementById('readings-list');
    if (!container) return;

    const filtered = getFilteredReadings();

    if (currentFilter === 'all' && serverTotal === 0) {
        container.innerHTML = renderActivationHero();
        updatePagination(0, 0);
        return;
    }

    if (filtered.length === 0) {
        if (currentFilter === 'all' && !emptyHistoryViewTracked) {
            emptyHistoryViewTracked = true;
            window.MH_ANALYTICS?.trackEvent?.('profile_empty_history_viewed', {
                source: 'profile_history',
                feature: 'profile_history'
            });
        }

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">${profileIconMarkup('book')}</div>
                <h4 class="empty-state__title">${currentFilter === 'all' ? 'Deník výkladů zatím čeká na první odpověď' : 'Tady zatím není žádný výklad tohoto typu'}</h4>
                <p class="empty-state__text">${currentFilter === 'all'
                    ? 'Tady se budou držet tvoje otázky, odpovědi a opakující se témata. Začni krátkým výkladem, ať má profil první signál pro návrat.'
                    : 'Filtr je prázdný. Zkus jiný typ výkladu nebo se vrať na celou historii.'}</p>
                ${currentFilter === 'all' ? `
                    <div class="empty-state__actions">
                        <a href="tarot-ano-ne.html?source=profile_history_empty&feature=tarot_yes_no&intent=yes_no" class="btn btn--primary btn--sm" data-analytics-cta="profile_empty_tarot_yes_no" data-analytics-feature="tarot_yes_no">Tarot ano/ne</a>
                        <a href="tarot-tri-karty.html?source=profile_history_empty&feature=tarot_multi_card&intent=three_cards" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_three_cards" data-analytics-feature="tarot_multi_card">Tři karty</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule&intent=yes_no_question" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_crystal_ball" data-analytics-feature="kristalova_koule">Křišťálová koule</a>
                    </div>
                ` : ''}
            </div>
        `;
        updatePagination(0, 0);
        return;
    }

    // Show paginated results
    const toShow = filtered.slice(0, displayedCount);

    container.innerHTML = `${toShow.map(reading => `
        <div class="reading-item card" data-reading-id="${escapeHtml(reading.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${getReadingIcon(reading.type)}</span>
                    <div>
                        <strong>${escapeHtml(getReadingLabel(reading))}</strong>
                        ${getReadingPreview(reading) ? `<p class="reading-item__preview">${escapeHtml(getReadingPreview(reading))}</p>` : ''}
                        <p class="reading-item__date">
                            ${new Date(reading.created_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${escapeHtml(reading.id)}"
                        title="${reading.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}"
                        aria-label="${reading.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}" aria-pressed="${Boolean(reading.is_favorite)}">
                        ${profileIconMarkup('bookmark')}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${escapeHtml(reading.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join('')}`;

    updatePagination(toShow.length, serverTotal);
}

export async function showMoreReadings() {
    if (loadingMore) return;
    const version = requestVersion;
    const loadMoreVersion = ++loadingMoreVersion;
    const button = document.getElementById('readings-load-more');
    loadingMore = true;
    if (button) { button.disabled = true; button.textContent = 'Načítání…'; }
    try {
        if (displayedCount >= visibleReadings.length && serverPage < serverPages) {
            const data = await fetchPage(serverPage + 1, currentFilter);
            if (version !== requestVersion) return;
            acceptPage(data, true);
        }
        displayedCount += PAGE_SIZE;
        renderReadings();
    } catch {
        if (version === requestVersion && button) button.textContent = 'Načtení selhalo · zkusit znovu';
    } finally {
        if (loadMoreVersion === loadingMoreVersion) {
            loadingMore = false;
            if (version === requestVersion) {
                document.getElementById('readings-load-more')?.removeAttribute('disabled');
            }
        }
    }
}

function invalidateLoadingMore() {
    loadingMoreVersion += 1;
    loadingMore = false;
    document.getElementById('readings-load-more')?.removeAttribute('disabled');
}

function updatePagination(shown, total) {
    const paginationEl = document.getElementById('readings-pagination');
    if (!paginationEl) return;

    if (shown < total) {
        paginationEl.hidden = false;
        paginationEl.classList.add('profile-block-visible');
        const btn = document.getElementById('readings-load-more');
        if (btn) btn.textContent = `Načíst další (${total - shown} zbývá)`;
    } else {
        paginationEl.hidden = true;
        paginationEl.classList.remove('profile-block-visible');
    }
}
