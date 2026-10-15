/**
 * Favorites tab functionality
 */

import { profileIconMarkup, escapeHtml, apiUrl, authHeaders, getReadingIcon, getReadingLabel, getReadingPreview } from './shared.js';
import { getReadingSummary } from './readings.js';

let favoritesRequest = 0;

export function resetFavoritesState() {
    ++favoritesRequest;
    document.getElementById('favorites-list')?.replaceChildren();
}

function renderEmptyFavorites(readingCount = 0) {
    const hasReadings = readingCount > 0;

    return `
        <div class="empty-state">
            <div class="empty-state__icon">${profileIconMarkup('bookmark')}</div>
            <h4 class="empty-state__title">${hasReadings ? 'Vyber si první výklad pro návrat' : 'Oblíbené zatím čekají na první návrat'}</h4>
            <p class="empty-state__text">${hasReadings
        ? 'Označ si v historii výklad, ke kterému se chceš vrátit. Tady ho pak najdeš po ruce.'
        : 'Po prvním výkladu si můžeš uložit do oblíbených to, k čemu se chceš vracet.'}</p>
            <div class="empty-state__actions">
                ${hasReadings
        ? '<button type="button" class="btn btn--primary btn--sm" data-profile-tab-target="history">Otevřít historii</button>'
        : '<a href="tarot.html?source=profile_favorites_empty&feature=tarot" class="btn btn--primary btn--sm">Tarot</a><a href="horoskopy.html?source=profile_favorites_empty&feature=daily_guidance" class="btn btn--glass btn--sm">Denní horoskop</a>'}
            </div>
        </div>
    `;
}

export async function loadFavorites(page = 1, version = null) {
    if (version === null) version = ++favoritesRequest;
    const container = document.getElementById('favorites-list');
    if (!container) return;

    if (page === 1) container.innerHTML = '<p class="profile-loading" role="status">Načítání…</p>';

    try {
        const response = await fetch(`${apiUrl()}/user/readings?favorites=true&page=${page}&limit=20`, {
            credentials: 'include',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to load readings');

        const data = await response.json();
        if (!data.success || !Array.isArray(data.readings)) throw new Error('Invalid favorites response');
        if (version !== favoritesRequest) return;
        const readings = data.readings || [];
        const favorites = readings;

        if (favorites.length === 0) {
            if (page === 1) container.innerHTML = renderEmptyFavorites(getReadingSummary()?.total || 0);
            return;
        }

        container.querySelector('[data-favorites-more]')?.remove();
        const markup = favorites.map(reading => `
            <div class="reading-item card" data-reading-id="${escapeHtml(reading.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${getReadingIcon(reading.type)}</span>
                        <div>
                            <strong>${escapeHtml(getReadingLabel(reading))}</strong>
                            ${getReadingPreview(reading) ? `<p class="reading-item__preview">${escapeHtml(getReadingPreview(reading))}</p>` : ''}
                            <p class="reading-item__date">
                                ${new Date(reading.created_at).toLocaleDateString('cs-CZ', {
            day: 'numeric', month: 'long', year: 'numeric'
        })}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${escapeHtml(reading.id)}" title="Odebrat z oblíbených" aria-label="Odebrat z oblíbených">${profileIconMarkup('bookmark')}</button>
                        <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${escapeHtml(reading.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join('');
        if (page === 1) container.innerHTML = markup;
        else container.insertAdjacentHTML('beforeend', markup);
        if (page < (data.pagination?.totalPages || 1)) {
            container.insertAdjacentHTML('beforeend', '<button type="button" class="btn btn--glass btn--sm" data-favorites-more>Načíst další oblíbené</button>');
            const more = container.querySelector('[data-favorites-more]');
            more?.addEventListener('click', async () => {
                more.disabled = true;
                await loadFavorites(page + 1, version);
                if (more.isConnected) more.disabled = false;
            });
        }
        window.lucide?.createIcons?.();

    } catch (error) {
        console.error('Error loading favorites:', error);
        if (version !== favoritesRequest) return;
        if (page > 1) {
            const more = container.querySelector('[data-favorites-more]');
            if (more) more.textContent = 'Načtení selhalo · zkusit znovu';
            return;
        }
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">${profileIconMarkup('warning')}</div>
                <p class="empty-state__text">Nepodařilo se načíst oblíbené.</p>
                <button type="button" class="btn btn--glass btn--sm" data-favorites-retry>Zkusit znovu</button>
            </div>
        `;
        container.querySelector('[data-favorites-retry]')?.addEventListener('click', () => loadFavorites());
    }
}
