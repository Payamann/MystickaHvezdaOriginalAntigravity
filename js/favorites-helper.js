/**
 * Toggle favorite status for a reading
 * @param {string} readingId - The ID of the reading
 * @param {string} buttonId - The ID of the button element
 */
async function toggleFavorite(readingId, buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn || !readingId) return;

    const language = document.documentElement.lang.toLowerCase().split('-')[0];
    const copy = {
        cs: { favorite: 'Oblíbené', add: 'Přidat do oblíbených', added: 'Přidáno do oblíbených', removed: 'Odebráno z oblíbených', error: 'Nepodařilo se uložit' },
        sk: { favorite: 'Obľúbené', add: 'Pridať medzi obľúbené', added: 'Pridané medzi obľúbené', removed: 'Odstránené z obľúbených', error: 'Nepodarilo sa uložiť' },
        pl: { favorite: 'Ulubione', add: 'Dodaj do ulubionych', added: 'Dodano do ulubionych', removed: 'Usunięto z ulubionych', error: 'Nie udało się zapisać' }
    }[language] || { favorite: 'Oblíbené', add: 'Přidat do oblíbených', added: 'Přidáno do oblíbených', removed: 'Odebráno z oblíbených', error: 'Nepodařilo se uložit' };

    try {
        const apiUrl = window.API_CONFIG?.BASE_URL || '/api';
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        const response = await fetch(`${apiUrl}/user/readings/${readingId}/favorite`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            }
        });

        if (!response.ok) throw new Error('Failed to toggle favorite');

        const data = await response.json();
        const isFavorite = data.is_favorite;

        // Update button
        const icon = btn.querySelector('.favorite-icon');
        if (isFavorite) {
            if (icon) icon.textContent = '⭐';
            btn.innerHTML = `<span class="favorite-icon">⭐</span> ${copy.favorite}`;
            btn.classList.remove('btn--glass');
            btn.classList.add('btn--primary');
        } else {
            if (icon) icon.textContent = '☆';
            btn.innerHTML = `<span class="favorite-icon">☆</span> ${copy.add}`;
            btn.classList.remove('btn--primary');
            btn.classList.add('btn--glass');
        }

        // Toast notification
        if (window.showToast) {
            window.showToast(isFavorite ? `⭐ ${copy.added}` : copy.removed);
        }

    } catch (error) {
        console.error('Error toggling favorite:', error);
        if (window.showToast) {
            window.showToast(`❌ ${copy.error}`, 'error');
        }
    }
}

// Expose globally for use across reading pages
window.toggleFavorite = toggleFavorite;
