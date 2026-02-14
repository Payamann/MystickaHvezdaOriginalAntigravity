/**
 * Favorites tab functionality
 */

import { escapeHtml, apiUrl, authHeaders, getReadingIcon, getReadingTitle } from './shared.js';

export async function loadFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; opacity: 0.6;">Načítání...</p>';

    try {
        const response = await fetch(`${apiUrl()}/user/readings`, {
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to load readings');

        const data = await response.json();
        const favorites = (data.readings || []).filter(r => r.is_favorite);

        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">⭐</div>
                    <h4 class="empty-state__title">Žádné oblíbené výklady</h4>
                    <p class="empty-state__text">Klikněte na ☆ u výkladu pro přidání do oblíbených</p>
                </div>
            `;
            return;
        }

        container.innerHTML = favorites.map(reading => `
            <div class="reading-item card" onclick="viewReading('${escapeHtml(reading.id)}')">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${getReadingIcon(reading.type)}</span>
                        <div>
                            <strong>${escapeHtml(getReadingTitle(reading.type))}</strong>
                            <p class="reading-item__date">
                                ${new Date(reading.created_at).toLocaleDateString('cs-CZ', {
            day: 'numeric', month: 'long', year: 'numeric'
        })}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); toggleFavorite('${escapeHtml(reading.id)}', this)" title="Odebrat z oblíbených" aria-label="Odebrat z oblíbených">⭐</button>
                        <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); viewReading('${escapeHtml(reading.id)}')" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading favorites:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">⚠️</div>
                <p class="empty-state__text">Nepodařilo se načíst oblíbené.</p>
            </div>
        `;
    }
}
