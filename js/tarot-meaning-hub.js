(function () {
    const majorArcana = new Set([
        'Blázen',
        'Mág',
        'Velekněžka',
        'Císařovna',
        'Císař',
        'Velekněz',
        'Milenci',
        'Vůz',
        'Síla',
        'Poustevník',
        'Kolo štěstí',
        'Spravedlnost',
        'Viselec',
        'Smrt',
        'Mírnost',
        'Ďábel',
        'Věž',
        'Hvězda',
        'Luna',
        'Slunce',
        'Soud',
        'Svět'
    ]);

    const groupLabels = {
        major: 'Velká arkána',
        wands: 'Hůlky',
        cups: 'Poháry',
        swords: 'Meče',
        pentacles: 'Pentákly'
    };

    const PAGE_SIZE = 12;
    let allCards = [];
    let activeFilter = 'all';
    let visibleCount = PAGE_SIZE;
    let selectedCardName = '';
    let shouldFocusSelectedCard = false;

    function normalize(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function slugify(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function detailHref(name) {
        return `tarot-vyznam/${slugify(name)}.html`;
    }

    function getCardGroup(name) {
        if (majorArcana.has(name)) return 'major';
        if (name.includes('holí')) return 'wands';
        if (name.includes('pohárů')) return 'cups';
        if (name.includes('mečů')) return 'swords';
        if (name.includes('pentáklů')) return 'pentacles';
        return 'major';
    }

    function getFirstSentence(text) {
        const cleaned = String(text || '').trim();
        if (!cleaned) return '';
        const firstDot = cleaned.indexOf('.');
        if (firstDot === -1) return cleaned.slice(0, 180);
        return cleaned.slice(0, firstDot + 1);
    }

    function getCardSearchText(card) {
        return normalize(`${card.name} ${card.groupLabel} ${card.meaning} ${card.interpretation}`);
    }

    function responsiveCardImageAttributes(imageSrc) {
        const source = String(imageSrc || '');
        if (!/^img\/tarot-v2\/tarot_[^/]+\.webp$/i.test(source)) return '';
        const base = source.slice(0, -'.webp'.length);
        return ` srcset="${escapeHtml(`${base}-240.webp 240w, ${base}-360.webp 360w, ${source} 600w`)}" sizes="(max-width: 560px) 170px, 108px"`;
    }

    function buildCard(card) {
        const detail = detailHref(card.name);
        const isSelected = card.name === selectedCardName;

        return `
            <article class="tarot-meaning-card${isSelected ? ' is-selected' : ''}" data-group="${escapeHtml(card.group)}" data-card="${escapeHtml(card.name)}"${isSelected ? ' tabindex="-1" aria-current="true"' : ''}>
                <div class="tarot-meaning-card__image">
                    <img loading="lazy" src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)} tarot karta" width="180" height="300"${responsiveCardImageAttributes(card.image)}>
                </div>
                <div class="tarot-meaning-card__body">
                    <div class="tarot-meaning-card__meta">${escapeHtml(card.groupLabel)}</div>
                    <h3><a href="${escapeHtml(detail)}">${escapeHtml(card.name)}</a></h3>
                    <p class="tarot-meaning-card__meaning">${escapeHtml(card.meaning)}</p>
                    <p>${escapeHtml(getFirstSentence(card.interpretation))}</p>
                    <a href="${escapeHtml(detail)}" class="tarot-meaning-card__link">Význam karty</a>
                </div>
            </article>
        `;
    }

    function updateFilterButtons() {
        document.querySelectorAll('[data-tarot-filter]').forEach((button) => {
            const isActive = button.dataset.tarotFilter === activeFilter;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    }

    function bindImageFallbacks(grid) {
        grid.querySelectorAll('img').forEach((image) => {
            image.addEventListener('error', () => {
                if (image.dataset.fallbackApplied === '1') return;
                image.dataset.fallbackApplied = '1';
                image.src = 'img/tarot-v2/tarot_card_back.webp';
            });
        });
    }

    function renderCards() {
        const grid = document.querySelector('[data-tarot-meaning-grid]');
        const count = document.getElementById('tarot-card-count');
        const noResults = document.querySelector('[data-tarot-no-results]');
        const searchInput = document.getElementById('tarot-card-search');
        const loadMoreButton = document.getElementById('tarot-cards-load-more');
        if (!grid) return;

        const query = normalize(searchInput?.value || '');
        const visibleCards = allCards.filter((card) => {
            const matchesGroup = activeFilter === 'all' || card.group === activeFilter;
            const matchesQuery = !query || card.searchText.includes(query);
            return matchesGroup && matchesQuery;
        });

        const selectedCard = visibleCards.find((card) => card.name === selectedCardName);
        const selectedIsBeyondBatch = selectedCard && visibleCards.indexOf(selectedCard) >= visibleCount;
        const batchSize = selectedIsBeyondBatch ? Math.max(0, visibleCount - 1) : visibleCount;
        const cardsToRender = visibleCards.slice(0, batchSize);
        if (selectedCard && !cardsToRender.includes(selectedCard)) {
            cardsToRender.push(selectedCard);
        }

        grid.innerHTML = cardsToRender.map(buildCard).join('');
        bindImageFallbacks(grid);

        if (count) {
            const total = visibleCards.length;
            const shown = cardsToRender.length;
            count.textContent = total === shown
                ? `${total} ${total === 1 ? 'karta' : total >= 2 && total <= 4 ? 'karty' : 'karet'}`
                : `${shown} z ${total} karet`;
        }

        if (noResults) {
            noResults.hidden = visibleCards.length !== 0;
        }

        const status = document.getElementById('tarot-cards-load-status');
        if (status) status.textContent = `Zobrazeno ${cardsToRender.length} z ${visibleCards.length} karet.`;

        if (loadMoreButton) {
            const remaining = Math.max(0, visibleCards.length - cardsToRender.length);
            loadMoreButton.hidden = remaining === 0;
            loadMoreButton.textContent = remaining > 0
                ? `Načíst další karty (${remaining})`
                : 'Všechny karty jsou zobrazené';
            loadMoreButton.setAttribute('aria-label', remaining > 0
                ? `Načíst další tarotové karty. Zbývá ${remaining}`
                : 'Všechny tarotové karty jsou zobrazené');
        }

        updateFilterButtons();

        if (shouldFocusSelectedCard && selectedCard) {
            shouldFocusSelectedCard = false;
            requestAnimationFrame(() => {
                const selectedElement = Array.from(grid.querySelectorAll('[data-card]'))
                    .find((entry) => entry.dataset.card === selectedCard.name);
                selectedElement?.focus({ preventScroll: true });
                selectedElement?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
            });
        }
    }

    async function loadCards() {
        const loading = document.querySelector('[data-tarot-meaning-loading]');
        const error = document.querySelector('[data-tarot-meaning-error]');
        try {
            const response = await fetch('/data/tarot-card-hub.json', { cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            allCards = Object.entries(data).map(([name, card]) => {
                const group = getCardGroup(name);
                const enriched = {
                    name,
                    group,
                    groupLabel: groupLabels[group] || 'Tarot',
                    image: card.image || 'img/tarot-v2/tarot_card_back.webp',
                    meaning: card.meaning || '',
                    interpretation: card.interpretation || ''
                };
                return {
                    ...enriched,
                    searchText: getCardSearchText(enriched)
                };
            });

            const cardParam = new URLSearchParams(window.location.search).get('card');
            if (cardParam) {
                const normalizedParam = normalize(cardParam);
                const selected = allCards.find((card) => normalize(card.name) === normalizedParam || slugify(card.name) === slugify(cardParam));
                if (selected) {
                    selectedCardName = selected.name;
                    shouldFocusSelectedCard = true;
                }
            }

            if (loading) loading.hidden = true;
            renderCards();
        } catch (loadError) {
            console.error('Nepodařilo se načíst významy tarotových karet:', loadError);
            if (loading) loading.hidden = true;
            if (error) error.hidden = false;
        }
    }

    function bindControls() {
        const searchInput = document.getElementById('tarot-card-search');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                visibleCount = PAGE_SIZE;
                selectedCardName = '';
                renderCards();
            });
        }

        document.querySelectorAll('[data-tarot-filter]').forEach((button) => {
            button.addEventListener('click', () => {
                activeFilter = button.dataset.tarotFilter || 'all';
                visibleCount = PAGE_SIZE;
                selectedCardName = '';
                renderCards();
                window.MH_ANALYTICS?.trackAction?.('tarot_meaning_filter_used', {
                    filter: activeFilter,
                    source: 'tarot_meaning_hub'
                });
            });
        });

        document.getElementById('tarot-cards-load-more')?.addEventListener('click', () => {
            const previousNames = new Set([...document.querySelectorAll('[data-tarot-meaning-grid] [data-card]')].map(card => card.dataset.card));
            visibleCount += PAGE_SIZE;
            renderCards();
            const firstNewCard = [...document.querySelectorAll('[data-tarot-meaning-grid] [data-card]')].find(card => !previousNames.has(card.dataset.card));
            firstNewCard?.querySelector('h3 a')?.focus({ preventScroll: true });
            firstNewCard?.scrollIntoView({ block: 'start', behavior: 'auto' });
        });
    }

    function init() {
        bindControls();
        void loadCards();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
