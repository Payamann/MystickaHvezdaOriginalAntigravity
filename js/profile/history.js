/**
 * Profile History - Reading history, favorites, and reading detail modal
 */

const API_BASE = () => window.API_CONFIG?.BASE_URL || 'http://localhost:3001/api';

function getReadingIcon(type) {
    const icons = {
        'tarot': '🃏', 'horoscope': '♈', 'natal': '🌌', 'natal-chart': '🌌',
        'numerology': '🔢', 'synastry': '💕', 'crystal': '🔮',
        'crystal-ball': '🔮', 'journal': '📖'
    };
    return icons[type] || '✨';
}

function getReadingTitle(type) {
    const titles = {
        'tarot': 'Tarotový výklad', 'horoscope': 'Horoskop',
        'natal': 'Natální karta', 'natal-chart': 'Natální karta',
        'numerology': 'Numerologie', 'synastry': 'Partnerská shoda',
        'crystal': 'Křišťálová koule', 'crystal-ball': 'Křišťálová koule',
        'journal': 'Manifestační deník'
    };
    return titles[type] || 'Výklad';
}

async function loadReadings() {
    const container = document.getElementById('readings-list');

    try {
        const response = await fetch(`${API_BASE()}/user/readings`, {
            headers: { 'Authorization': `Bearer ${window.Auth?.token}` }
        });

        if (!response.ok) throw new Error('Failed to load readings');

        const data = await response.json();
        const readings = data.readings || [];

        if (readings.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem 1rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🔮</div>
                    <h4 style="margin-bottom: 0.5rem; color: var(--color-starlight);">Zatím nemáte žádné výklady</h4>
                    <p style="opacity: 0.6; margin-bottom: 1.5rem;">Vydejte se na cestu za poznáním hvězd!</p>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <a href="tarot.html" class="btn btn--primary btn--sm">🃏 Tarot</a>
                        <a href="kristalova-koule.html" class="btn btn--glass btn--sm">🔮 Křišťálová koule</a>
                        <a href="horoskopy.html" class="btn btn--glass btn--sm">⭐ Horoskop</a>
                    </div>
                </div>
            `;
            return readings;
        }

        container.innerHTML = readings.map(reading => `
            <div class="reading-item card" style="margin-bottom: 1rem; padding: 1rem; cursor: pointer;" onclick="viewReading('${escapeHtml(reading.id)}')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-size: 2rem;">${getReadingIcon(reading.type)}</span>
                        <div>
                            <strong>${escapeHtml(getReadingTitle(reading.type))}</strong>
                            <p style="margin: 0.25rem 0 0; opacity: 0.7; font-size: 0.85rem;">
                                ${new Date(reading.created_at).toLocaleDateString('cs-CZ', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })}
                            </p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); toggleFavorite('${escapeHtml(reading.id)}', this)" title="${reading.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}">
                            ${reading.is_favorite ? '⭐' : '☆'}
                        </button>
                        <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); viewReading('${escapeHtml(reading.id)}')">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join('');

        return readings;

    } catch (error) {
        console.error('Error loading readings:', error);
        container.innerHTML = `
            <p class="text-center" style="opacity: 0.6;">
                Nepodařilo se načíst historii. <a href="#" onclick="event.preventDefault(); location.reload();">Zkusit znovu</a>
            </p>
        `;
        return [];
    }
}

async function loadFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; opacity: 0.6;">Načítání...</p>';

    try {
        const response = await fetch(`${API_BASE()}/user/readings`, {
            headers: { 'Authorization': `Bearer ${window.Auth?.token}` }
        });

        if (!response.ok) throw new Error('Failed to load readings');

        const data = await response.json();
        const favorites = (data.readings || []).filter(r => r.is_favorite);

        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem 1rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⭐</div>
                    <h4 style="margin-bottom: 0.5rem; color: var(--color-starlight);">Žádné oblíbené výklady</h4>
                    <p style="opacity: 0.6;">Klikněte na ☆ u výkladu pro přidání do oblíbených</p>
                </div>
            `;
            return;
        }

        container.innerHTML = favorites.map(reading => `
            <div class="reading-item card" style="margin-bottom: 1rem; padding: 1rem; cursor: pointer;" onclick="viewReading('${escapeHtml(reading.id)}')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-size: 2rem;">${getReadingIcon(reading.type)}</span>
                        <div>
                            <strong>${escapeHtml(getReadingTitle(reading.type))}</strong>
                            <p style="margin: 0.25rem 0 0; opacity: 0.7; font-size: 0.85rem;">
                                ${new Date(reading.created_at).toLocaleDateString('cs-CZ', {
            day: 'numeric', month: 'long', year: 'numeric'
        })}
                            </p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); toggleFavorite('${escapeHtml(reading.id)}', this)" title="Odebrat z oblíbených">⭐</button>
                        <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); viewReading('${escapeHtml(reading.id)}')">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading favorites:', error);
        container.innerHTML = '<p style="text-align: center; opacity: 0.6;">Nepodařilo se načíst oblíbené.</p>';
    }
}

// Current reading being viewed (for modal actions)
let currentReadingId = null;
let currentReadingIsFavorite = false;

async function viewReading(id) {
    const modal = document.getElementById('reading-modal');
    const content = document.getElementById('reading-modal-content');

    if (!modal || !content) return;

    currentReadingId = id;
    modal.style.display = 'flex';
    content.innerHTML = '<p style="text-align: center; opacity: 0.6;">Načítání...</p>';

    try {
        const response = await fetch(`${API_BASE()}/user/readings/${id}`, {
            headers: { 'Authorization': `Bearer ${window.Auth?.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch reading');

        const data = await response.json();
        const reading = data.reading;

        currentReadingIsFavorite = reading.is_favorite;
        updateFavoriteButton();

        content.innerHTML = renderReadingContent(reading);

    } catch (error) {
        console.error('Error loading reading:', error);
        content.innerHTML = `<p style="color: #e74c3c;">Nepodařilo se načíst výklad.</p>`;
    }
}

function renderReadingContent(reading) {
    const date = new Date(reading.created_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let contentHtml = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <span style="font-size: 3rem;">${getReadingIcon(reading.type)}</span>
            <h2 style="margin: 0.5rem 0;">${escapeHtml(getReadingTitle(reading.type))}</h2>
            <p style="opacity: 0.6; font-size: 0.9rem;">${date}</p>
        </div>
        <div class="reading-content" style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 10px; max-height: 400px; overflow-y: auto;">
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
        contentHtml += `<div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin-bottom: 1.5rem;">`;
        data.cards.forEach(card => {
            const imagePath = getTarotImageByName(card.name);
            contentHtml += `
                <div style="text-align: center; width: 100px; display: flex; flex-direction: column; align-items: center;">
                    <div style="position: relative; width: 80px; height: 120px; margin-bottom: 0.5rem;">
                         <img src="${escapeHtml(imagePath)}"
                              alt="${escapeHtml(card.name)}"
                              onerror="this.onerror=null;this.src='img/tarot/tarot_placeholder.webp';"
                              style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                    </div>
                    <p style="font-size: 0.75rem; margin: 0; font-weight: 600; color: var(--color-mystic-gold); line-height: 1.2;">${escapeHtml(card.name)}</p>
                    ${card.position ? `<small style="font-size: 0.65rem; opacity: 0.7;">${escapeHtml(card.position)}</small>` : ''}
                </div>
            `;
        });
        contentHtml += `</div>`;

        const summary = data.response || data.interpretation;
        if (summary) {
            contentHtml += `
                <div style="background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--color-mystic-gold);">
                    <h4 style="color: var(--color-mystic-gold); margin-bottom: 0.75rem; font-size: 1rem;">VÝKLAD KARET</h4>
                    <div style="line-height: 1.8; font-size: 1rem; color: var(--color-silver-mist);">
                        ${escapeHtml(summary).replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
        }
    } else if (reading.type === 'horoscope' && (data.text || data.prediction)) {
        const text = data.text || data.prediction;
        const periodMap = { 'daily': 'Denní horoskop', 'weekly': 'Týdenní horoskop', 'monthly': 'Měsíční horoskop' };
        const periodLabel = periodMap[data.period] || data.period || 'Horoskop';

        contentHtml += `
            <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: var(--color-mystic-gold); font-size: 1.5rem; margin-bottom: 0.2rem;">${escapeHtml(data.sign || 'Znamení')}</h3>
                <span style="text-transform: uppercase; letter-spacing: 2px; font-size: 0.75rem; opacity: 0.7;">${escapeHtml(periodLabel)}</span>
            </div>
            <div style="font-size: 1.05rem; line-height: 1.8; color: var(--color-starlight); margin-bottom: 1.5rem;">
                ${escapeHtml(text)}
            </div>
        `;

        if (data.luckyNumbers) {
            contentHtml += `
                <div style="background: rgba(212, 175, 55, 0.1); padding: 0.75rem; border-radius: 8px; text-align: center;">
                    <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: var(--color-mystic-gold); margin-bottom: 0.25rem;">Šťastná čísla</span>
                    <span style="font-family: var(--font-heading); font-size: 1.2rem; letter-spacing: 1px;">${escapeHtml(data.luckyNumbers.toString())}</span>
                </div>
            `;
        }
    } else if (data.answer) {
        if (data.question) {
            contentHtml += `
                <div style="margin-bottom: 1.5rem; padding: 1rem; border-left: 3px solid var(--color-mystic-gold); background: rgba(255,255,255,0.03);">
                    <small style="text-transform: uppercase; color: var(--color-mystic-gold); font-size: 0.7rem; display: block; margin-bottom: 0.3rem;">Otázka</small>
                    <p style="font-style: italic; opacity: 0.9; margin: 0; font-family: var(--font-heading); font-size: 1.1rem;">"${escapeHtml(data.question)}"</p>
                </div>
            `;
        }
        contentHtml += `
            <div style="font-size: 1.05rem; line-height: 1.8; color: var(--color-starlight);">
                ${escapeHtml(data.answer)}
            </div>
        `;
    } else if (data.interpretation || data.text || data.result) {
        const textContent = data.interpretation || data.text || data.result;
        contentHtml += `<p style="line-height: 1.7;">${escapeHtml(typeof textContent === 'string' ? textContent : JSON.stringify(textContent))}</p>`;
    } else {
        contentHtml += `<pre style="white-space: pre-wrap; font-size: 0.85rem;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    }

    contentHtml += `</div>`;
    return contentHtml;
}

function closeReadingModal() {
    const modal = document.getElementById('reading-modal');
    if (modal) modal.style.display = 'none';
    currentReadingId = null;
}

function updateFavoriteButton() {
    const btn = document.getElementById('modal-favorite-btn');
    if (btn) {
        btn.textContent = currentReadingIsFavorite ? '⭐ V oblíbených' : '☆ Přidat do oblíbených';
    }
}

async function toggleFavoriteModal() {
    if (!currentReadingId) return;
    await toggleFavorite(currentReadingId);
    currentReadingIsFavorite = !currentReadingIsFavorite;
    updateFavoriteButton();
}

async function toggleFavorite(id, buttonEl = null) {
    try {
        const response = await fetch(`${API_BASE()}/user/readings/${id}/favorite`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${window.Auth?.token}` }
        });

        if (!response.ok) throw new Error('Failed to toggle favorite');

        const data = await response.json();

        if (buttonEl) {
            buttonEl.textContent = data.is_favorite ? '⭐' : '☆';
            buttonEl.title = data.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených';
        }

        const readings = await loadReadings();
        updateStats(readings);

        const favoritesTab = document.getElementById('tab-favorites');
        if (favoritesTab && favoritesTab.style.display !== 'none') {
            loadFavorites();
        }

    } catch (error) {
        console.error('Error toggling favorite:', error);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se změnit oblíbené.', 'error');
    }
}

async function deleteReading() {
    if (!currentReadingId) return;

    if (!confirm('Opravdu chcete smazat tento výklad? Tuto akci nelze vrátit.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE()}/user/readings/${currentReadingId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${window.Auth?.token}` }
        });

        if (!response.ok) throw new Error('Failed to delete reading');

        closeReadingModal();
        window.Auth?.showToast?.('Smazáno', 'Výklad byl úspěšně smazán.', 'success');

        const readings = await loadReadings();
        updateStats(readings);

    } catch (error) {
        console.error('Error deleting reading:', error);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se smazat výklad.', 'error');
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('reading-modal');
    if (e.target === modal) {
        closeReadingModal();
    }
});

// Expose to global scope (needed by inline onclick handlers)
window.loadReadings = loadReadings;
window.loadFavorites = loadFavorites;
window.viewReading = viewReading;
window.closeReadingModal = closeReadingModal;
window.toggleFavorite = toggleFavorite;
window.toggleFavoriteModal = toggleFavoriteModal;
window.deleteReading = deleteReading;
window.getReadingIcon = getReadingIcon;
window.getReadingTitle = getReadingTitle;
