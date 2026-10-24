(function () {
    const PAGE_SIZE = 12;
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

    let allCards = [];
    let activeFilter = 'all';
    let visibleCount = PAGE_SIZE;

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

    function buildCard(card) {
        const detail = detailHref(card.name);

        return `
            <article class="tarot-meaning-card" data-group="${escapeHtml(card.group)}" data-card="${escapeHtml(card.name)}">
                <div class="tarot-meaning-card__image">
                    <img loading="lazy" src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)} tarot karta" width="180" height="300">
                </div>
                <div class="tarot-meaning-card__body">
                    <div class="tarot-meaning-card__meta">${escapeHtml(card.groupLabel)}</div>
                    <h3><a href="${escapeHtml(detail)}">${escapeHtml(card.name)}</a></h3>
                    <p class="tarot-meaning-card__meaning">${escapeHtml(card.meaning)}</p>
                    <p>${escapeHtml(getFirstSentence(card.interpretation))}</p>
                    <a href="${escapeHtml(detail)}" class="tarot-meaning-card__link">Význam karty</a>
                    <a href="tarot.html?source=tarot_meaning_card&card=${encodeURIComponent(card.name)}" class="tarot-meaning-card__link">Vyložit tarot s touto energií</a>
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
        const loadMoreButton = document.querySelector('[data-tarot-load-more]');
        if (!grid) return;

        const query = normalize(searchInput?.value || '');
        const visibleCards = allCards.filter((card) => {
            const matchesGroup = activeFilter === 'all' || card.group === activeFilter;
            const matchesQuery = !query || card.searchText.includes(query);
            return matchesGroup && matchesQuery;
        });

        const shownCards = visibleCards.slice(0, visibleCount);
        grid.innerHTML = shownCards.map(buildCard).join('');
        bindImageFallbacks(grid);

        if (count) {
            const total = visibleCards.length;
            const noun = total === 1 ? 'karta' : total >= 2 && total <= 4 ? 'karty' : 'karet';
            count.textContent = shownCards.length < total
                ? `Zobrazeno ${shownCards.length} z ${total} karet`
                : `${total} ${noun}`;
        }

        if (loadMoreButton) loadMoreButton.hidden = shownCards.length >= visibleCards.length;

        if (noResults) {
            noResults.hidden = visibleCards.length !== 0;
        }

        updateFilterButtons();
    }

    async function loadCards() {
        const loading = document.querySelector('[data-tarot-meaning-loading]');
        const error = document.querySelector('[data-tarot-meaning-error]');
        const loadMoreButton = document.querySelector('[data-tarot-load-more]');
        const enhancedControls = Array.from(document.querySelectorAll('[data-tarot-meaning-controls]'));
        if (loading) loading.hidden = false;
        if (loadMoreButton) loadMoreButton.hidden = true;
        // Keep the maintained editorial summary when filtering regenerates the cards.
        const editorialByName = new Map(Array.from(document.querySelectorAll('.tarot-meaning-card[data-card]'))
            .map((entry) => [entry.dataset.card,
                { meaning: entry.querySelector('.tarot-meaning-card__meaning')?.textContent?.trim(),
                interpretation: entry.querySelector('.tarot-meaning-card__body > p:not(.tarot-meaning-card__meaning)')?.textContent?.trim() }]));

        try {
            const response = await fetch('/data/tarot-cards.json?v=20261007-deck-v2', { cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            allCards = Object.entries(data).map(([name, card]) => {
                const group = getCardGroup(name);
                const enriched = {
                    name,
                    group,
                    groupLabel: groupLabels[group] || 'Tarot',
                    image: card.image || 'img/tarot-v2/tarot_card_back.webp',
                    meaning: editorialByName.get(name)?.meaning || card.meaning || '',
                    interpretation: editorialByName.get(name)?.interpretation || card.interpretation || ''
                };
                return {
                    ...enriched,
                    searchText: getCardSearchText(enriched)
                };
            });

            if (loading) loading.hidden = true;
            // The statically rendered cards remain intact until the data is ready.
            // Keep this enhancement disabled when the request fails; the full catalog
            // remains usable as ordinary links without a half-working filter UI.
            enhancedControls.forEach((control) => { control.hidden = false; });
            renderCards();
        } catch (loadError) {
            console.error('Nepodařilo se načíst významy tarotových karet:', loadError);
            if (loading) loading.hidden = true;
            if (error) error.hidden = false;
            if (loadMoreButton) loadMoreButton.hidden = true;
        }
    }

    function bindControls() {
        const searchInput = document.getElementById('tarot-card-search');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                visibleCount = PAGE_SIZE;
                renderCards();
            });
        }

        document.querySelectorAll('[data-tarot-filter]').forEach((button) => {
            button.addEventListener('click', () => {
                activeFilter = button.dataset.tarotFilter || 'all';
                visibleCount = PAGE_SIZE;
                renderCards();
                window.MH_ANALYTICS?.trackAction?.('tarot_meaning_filter_used', {
                    filter: activeFilter,
                    source: 'tarot_meaning_hub'
                });
            });
        });

        document.querySelector('[data-tarot-load-more]')?.addEventListener('click', () => {
            visibleCount += PAGE_SIZE;
            renderCards();
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
