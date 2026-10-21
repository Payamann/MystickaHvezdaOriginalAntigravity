/**
 * Toggle favorite status for a reading
 * @param {string} readingId - The ID of the reading
 * @param {string} buttonId - The ID of the button element
 */
async function toggleFavorite(readingId, buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn || !readingId || btn.disabled) return;
    const ownerId = window.Auth?.user?.id;
    if (!window.Auth?.isLoggedIn?.() || typeof ownerId !== 'string' || !ownerId) return;

    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');

    try {
        const apiUrl = window.API_CONFIG?.BASE_URL || '/api';
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!window.Auth?.isLoggedIn?.() || window.Auth?.user?.id !== ownerId) return;

        const response = await fetch(`${apiUrl}/user/readings/${encodeURIComponent(readingId)}/favorite`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({ expectedUserId: ownerId })
        });

        if (!response.ok) throw new Error('Failed to toggle favorite');

        const data = await response.json();
        if (!window.Auth?.isLoggedIn?.() || window.Auth?.user?.id !== ownerId) return;
        const isFavorite = data.is_favorite;
        if (typeof isFavorite !== 'boolean') throw new Error('Favorite response is invalid');

        // Update button
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('class', 'mh-symbol mh-symbol--inline favorite-icon');
        icon.setAttribute('viewBox', '0 0 48 48');
        icon.setAttribute('width', '18');
        icon.setAttribute('height', '18');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('stroke-width', '1.8');
        icon.setAttribute('stroke-linecap', 'round');
        icon.setAttribute('stroke-linejoin', 'round');
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('focusable', 'false');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '/img/icons/mh-symbols.svg#star');
        icon.appendChild(use);

        if (isFavorite) {
            btn.replaceChildren(icon, document.createTextNode('Oblíbené'));
            btn.classList.remove('btn--glass');
            btn.classList.add('btn--primary');
        } else {
            btn.replaceChildren(icon, document.createTextNode('Přidat do oblíbených'));
            btn.classList.remove('btn--primary');
            btn.classList.add('btn--glass');
        }
        btn.setAttribute('aria-pressed', String(isFavorite));

        // Toast notification
        if (window.showToast) {
            window.showToast(isFavorite ? 'Přidáno do oblíbených' : 'Odebráno z oblíbených');
        }

    } catch (error) {
        console.error('Error toggling favorite:', error);
        if (window.showToast) {
            window.showToast('Nepodařilo se uložit oblíbenou položku', 'error');
        }
    } finally {
        if (btn.isConnected) {
            btn.disabled = false;
            btn.removeAttribute('aria-busy');
        }
    }
}

// Expose globally for use across reading pages
window.toggleFavorite = toggleFavorite;
