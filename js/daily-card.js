// js/daily-card.js
(function () {
    const CARDS = [
        { name: 'Andělé Ochránci', emoji: '👼', keyword: 'Ochrana', text: "Ochrana může být připomenutím, co ti pomáhá cítit se bezpečně. Kde můžeš dnes nastavit hranici nebo požádat o podporu?", link: 'andelska-cisla.html' },
        { name: 'Hojnost', emoji: '🌟', keyword: 'Prosperita', text: "Hojnost může připomenout různé zdroje, které máš: čas, dovednosti i lidi kolem sebe. Co z nich chceš využít nebo chránit?", link: 'hojnost.html' },
        { name: 'Nový začátek', emoji: '🌱', keyword: 'Obnova', text: "Nový začátek nemusí znamenat velký obrat. Co můžeš začít jinak v malém a podle svých možností?", link: 'tarot-blazen.html' },
        { name: 'Vnitřní mír', emoji: '☮️', keyword: 'Klid', text: "Klid nemusí přijít na povel. Co ti právě teď může přinést trochu prostoru, nebo co potřebuješ odložit?", link: 'anahata.html' },
        { name: 'Odvaha', emoji: '🦁', keyword: 'Síla', text: "Odvaha nemusí být bez strachu. Co bys chtěl říct nebo zkusit, pokud je to bezpečné a dává ti to smysl?", link: 'tiwaz.html' },
        { name: 'Láska', emoji: '❤️', keyword: 'Spojení', text: "Láska může znamenat blízkost, respekt i péči o sebe. Co teď potřebuješ ve vztazích vyjádřit nebo chránit?", link: 'anahata.html' },
        { name: 'Intuice', emoji: '🔮', keyword: 'Vhled', text: "První dojem je jedna informace, ne jistota. U důležité volby si dej čas a doplň ho fakty.", link: 'muladhara.html' },
        { name: 'Transformace', emoji: '🦋', keyword: 'Změna', text: "Změna nemusí být snadná ani žádoucí. Co chceš zachovat a co se dá upravit podle okolností?", link: 'reinkarnace.html' },
        { name: 'Vděčnost', emoji: '🙏', keyword: 'Hojnost', text: "Vděčnost může upozornit na něco, čeho si ceníš, aniž by popírala těžkosti. Co ti dnes dává oporu?", link: 'synchronicita.html' },
        { name: 'Harmonie', emoji: '⚖️', keyword: 'Rovnováha', text: "Rovnováha neznamená mít všechno stejně. Kde během dne potřebuješ víc času nebo jasnější hranici?", link: 'karma.html' },
        { name: 'Vůdce', emoji: '👑', keyword: 'Vedení', text: "Vedení může začít nasloucháním a jasnou dohodou. Kde můžeš převzít odpovědnost a kde ji sdílet?", link: 'velka-arkana.html' },
        { name: 'Propojení', emoji: '🌐', keyword: 'Síť', text: "Propojení může mít mnoho podob. Který kontakt by ti dělal radost, pokud máš chuť se ozvat?", link: 'synchronicita.html' },
        { name: 'Hojení', emoji: '💚', keyword: 'Uzdravení', text: "Hojení není slib ani povinnost cítit se lépe. Jakou podporu nebo péči můžeš bezpečně vyhledat?", link: 'anahata.html' },
        { name: 'Moudrost', emoji: '🦉', keyword: 'Poznání', text: "Moudrost může vyrůstat ze zkušenosti i nových informací. Co ještě potřebuješ vědět, než se rozhodneš?", link: 'akasicke-zaznamy.html' },
        { name: 'Radost', emoji: '😊', keyword: 'Lehkost', text: "Radost nemusí přijít sama ani být povinností. Je dnes něco malého, co tě těší nebo by ti ulevilo?", link: 'mala-arkana.html' },
        { name: 'Průlom', emoji: '⚡', keyword: 'Zjevení', text: "Průlom není zaručený. Když se něco zaseklo, můžeš pojmenovat překážku nebo požádat o pohled zvenčí.", link: 'aspekty.html' },
        { name: 'Důvěra', emoji: '🤝', keyword: 'Víra', text: "Důvěra neznamená vzdát se kontroly nad vším. Kde můžeš postupovat podle ověřených informací a vlastních hranic?", link: 'nativni-karta.html' },
        { name: 'Kreativita', emoji: '🎨', keyword: 'Tvorba', text: "Tvořivost může začít drobným pokusem bez nároku na výsledek. Co by sis rád zkusil?", link: 'svadhisthana.html' },
        { name: 'Uvolnění', emoji: '🌊', keyword: 'Tok', text: "Uvolnění neznamená zapomenout, odpustit ani zůstat v těžké situaci. Co už nechceš nést sám?", link: 'lucidni-sen.html' },
        { name: 'Záměr', emoji: '🎯', keyword: 'Fokus', text: "Záměr může pomoct vybrat směr, ale neurčuje výsledek. Který další krok je v tvých možnostech?", link: 'aspekty.html' },
        { name: 'Kořeny', emoji: '🌳', keyword: 'Stabilita', text: "Kořeny mohou připomenout, co ti dává oporu. Které hodnoty nebo vztahy chceš zachovat?", link: 'muladhara.html' },
        { name: 'Zrcadlo', emoji: '🪞', keyword: 'Reflexe', text: "Zrcadlo může otevřít otázku, co v tobě situace probouzí. Reakce druhých ale není důkazem o tvé vině.", link: 'karmicky-uzel.html' },
        { name: 'Přijetí', emoji: '🌸', keyword: 'Soucit', text: "Přijetí neznamená souhlasit ani vzdát se změny. Co můžeš uznat tak, jak to je, a jakou hranici potřebuješ?", link: 'anahata.html' },
        { name: 'Zázrak', emoji: '✨', keyword: 'Požehnání', text: "Zázrak jako symbol může připomenout nečekaný okamžik radosti. Náhodám nemusíš přisuzovat skrytý význam.", link: 'synchronicita.html' },
        { name: 'Přátelství', emoji: '🤗', keyword: 'Komunita', text: "Přátelství může potřebovat různé množství kontaktu. Pokud máš chuť se ozvat, je někdo, komu bys rád napsal?", link: 'synchronicita.html' },
        { name: 'Ohraničení', emoji: '🛡️', keyword: 'Hranice', text: "Hranice pomáhají pojmenovat, co je pro tebe přijatelné. Kde by ti pomohla jasná a bezpečná dohoda?", link: 'saturnosky-navrat.html' },
        { name: 'Vizionář', emoji: '🔭', keyword: 'Vize', text: "Vize je možnost přemýšlet o budoucnosti, ne předpověď. Co chceš zkusit a jaký malý krok je proveditelný?", link: 'draci-uzly.html' },
        { name: 'Hravost', emoji: '🎭', keyword: 'Spontánnost', text: "Hravost může být drobnou změnou v běžném dni. Co by bylo příjemné a nepřidalo další povinnost?", link: 'tarot-blazen.html' },
        { name: 'Propojení se zemí', emoji: '🌍', keyword: 'Příroda', text: "Pobyt venku některým lidem vyhovuje, jiným ne. Jaký způsob odpočinku ti dnes sedí?", link: 'muladhara.html' },
        { name: 'Paradox', emoji: '🌙', keyword: 'Tajemství', text: "Nejistota nemusí mít hned odpověď. Co už víš a co zatím může zůstat otevřené?", link: 'velka-arkana.html' },
        { name: 'Vítěz', emoji: '🏆', keyword: 'Úspěch', text: "Ocenění pokroku nemusí znamenat vítězství nad ostatními. Který konkrétní krok se ti povedl a co ti pomohlo?", link: 'fehu.html' },
    ];

    const CARD_IMAGES = {
        'Andělé Ochránci': 'andele-ochranci',
        'Hojnost': 'hojnost',
        'Nový začátek': 'novy-zacatek',
        'Vnitřní mír': 'vnitrni-mir',
        'Odvaha': 'odvaha',
        'Láska': 'laska',
        'Intuice': 'intuice',
        'Transformace': 'transformace',
        'Vděčnost': 'vdecnost',
        'Harmonie': 'harmonie',
        'Vůdce': 'vudce',
        'Propojení': 'propojeni',
        'Hojení': 'hojeni',
        'Moudrost': 'moudrost',
        'Radost': 'radost',
        'Průlom': 'prulom',
        'Důvěra': 'duvera',
        'Kreativita': 'kreativita',
        'Uvolnění': 'uvolneni',
        'Záměr': 'zamer',
        'Kořeny': 'koreny',
        'Zrcadlo': 'zrcadlo',
        'Přijetí': 'prijeti',
        'Zázrak': 'zazrak',
        'Přátelství': 'pratelstvi',
        'Ohraničení': 'ohraniceni',
        'Vizionář': 'vizionar',
        'Hravost': 'hravost',
        'Propojení se zemí': 'propojen-se-zemi',
        'Paradox': 'paradox',
        'Vítěz': 'vitez'
    };

    function getCardSlug(card) {
        return CARD_IMAGES[card?.name] || '';
    }

    function rememberDailyCard(card) {
        if (!card) return;

        try {
            localStorage.setItem('mh_kdd_card', JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                slug: getCardSlug(card),
                card
            }));
        } catch (error) {
            if (window.MH_DEBUG) console.debug('Daily card persistence failed:', error);
        }
    }

    function buildAngelCardsUrl(source, card, feature = 'daily_angel_card') {
        const url = new URL('/andelske-karty.html', window.location.origin);
        const slug = getCardSlug(card);

        url.searchParams.set('source', source);
        url.searchParams.set('feature', feature);
        if (slug) url.searchParams.set('daily_card', slug);

        return `${url.pathname}${url.search}`;
    }

    function trackDailyCardDetail(source, card, destination) {
        window.MH_ANALYTICS?.trackCTA?.(source, {
            card_name: card.name,
            feature: 'daily_angel_card',
            destination
        });
    }

    function setTemporaryButtonLabel(button, label) {
        if (!button) return;

        const originalHtml = button.dataset.defaultHtml || button.innerHTML;
        button.dataset.defaultHtml = originalHtml;
        button.textContent = label;

        window.setTimeout(() => {
            button.innerHTML = button.dataset.defaultHtml || originalHtml;
        }, 2200);
    }

    async function copyTextToClipboard(text) {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                if (window.MH_DEBUG) console.debug('Clipboard API copy failed, trying textarea fallback:', error);
            }
        }

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.className = 'kdd-share-copy-buffer';

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        try {
            return document.execCommand('copy');
        } catch (error) {
            if (window.MH_DEBUG) console.debug('Textarea copy fallback failed:', error);
            return false;
        } finally {
            textarea.remove();
        }
    }

    function showManualShareFallback(button, shareUrl) {
        if (!button || !shareUrl) return;

        const container = button.closest('div') || button.parentElement;
        if (!container) return;

        let fallback = container.querySelector('.kdd-share-fallback');
        if (!fallback) {
            fallback = document.createElement('div');
            fallback.className = 'kdd-share-fallback';
            fallback.setAttribute('role', 'status');
            fallback.innerHTML = `
                <span>Odkaz je připravený ke zkopírování:</span>
                <input type="text" readonly aria-label="Odkaz pro sdílení karty dne">
            `;
            container.appendChild(fallback);
        }

        const input = fallback.querySelector('input');
        if (!input) return;

        input.value = shareUrl;
        fallback.hidden = false;
        input.focus();
        input.select();
    }

    async function shareCard(card, button) {
        if (!card) return;

        const shareUrl = `${window.location.origin}${buildAngelCardsUrl('homepage_daily_card_share', card)}`;
        const sharePayload = {
            title: `Karta dne: ${card.name}`,
            text: `Moje dnešní karta je ${card.name} (${card.keyword}). ${card.text}`,
            url: shareUrl
        };

        window.MH_ANALYTICS?.trackCTA?.('homepage_daily_card_share', {
            card_name: card.name,
            feature: 'daily_angel_card',
            destination: shareUrl
        });

        const shareText = `${sharePayload.title}\n\n${sharePayload.text}\n${sharePayload.url}`;

        try {
            if (navigator.share) {
                try {
                    await navigator.share(sharePayload);
                    setTemporaryButtonLabel(button, 'Sdíleno');
                    return;
                } catch (shareError) {
                    if (shareError?.name === 'AbortError') return;
                    if (window.MH_DEBUG) console.debug('Web Share API failed, trying clipboard fallback:', shareError);
                }
            }

            const copied = await copyTextToClipboard(shareText);
            if (copied) {
                setTemporaryButtonLabel(button, 'Zkopírováno');
            } else {
                showManualShareFallback(button, shareUrl);
                setTemporaryButtonLabel(button, 'Odkaz připraven');
            }
        } catch (error) {
            if (window.MH_DEBUG) console.debug('Daily card share failed:', error);
            showManualShareFallback(button, shareUrl);
            setTemporaryButtonLabel(button, 'Odkaz připraven');
        }
    }

    function renderCardSymbol(target, card) {
        if (!target || !card) return;

        const slug = getCardSlug(card);
        target.textContent = '';

        if (!slug) {
            target.textContent = card.emoji;
            return;
        }

        const image = new Image();
        image.className = 'kdd-card-image';
        image.src = `/img/daily-cards/${slug}.webp`;
        image.alt = `${card.name} - ${card.keyword}`;
        image.loading = 'lazy';
        image.fetchPriority = 'low';
        image.decoding = 'async';
        target.appendChild(image);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const el = id => document.getElementById(id);
        const cardContainer = el('kdd-card');
        const inner = el('kdd-inner');
        if (!cardContainer || !inner) return;

        const setInlineBlockVisible = (element, visible) => {
            if (!element) return;
            element.hidden = !visible;
            element.classList.toggle('mh-inline-block-visible', visible);
        };

        const setBlockVisible = (element, visible) => {
            if (!element) return;
            element.hidden = !visible;
            element.classList.toggle('mh-block-visible', visible);
        };

        // LocalStorage keys
        const KEY_DATE = 'mh_kdd_date';
        const KEY_INDEX = 'mh_kdd_index';
        const KEY_STREAK = 'mh_kdd_streak';

        const getTodayStr = () => {
            const d = new Date();
            return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        };

        // Yesterday for streak calculating
        const getYesterdayStr = () => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        };

        const todayStr = getTodayStr();
        const yesterdayStr = getYesterdayStr();

        let lastDate = localStorage.getItem(KEY_DATE);
        let streakCount = parseInt(localStorage.getItem(KEY_STREAK) || '0', 10);
        let cardIndex = -1;
        // removed auto-reveal flag

        if (lastDate === todayStr) {
            // Already initialized today (user might not have flipped it yet, or they did)
            cardIndex = parseInt(localStorage.getItem(KEY_INDEX), 10);
        } else {
            // New day, assign a specific new card for today, but do NOT increment streak until flipped
            cardIndex = Math.floor(Math.random() * CARDS.length);
            localStorage.setItem(KEY_INDEX, cardIndex.toString());
            // Intentionally not setting KEY_DATE here yet, so we know if they flipped it or not.
            // If they just visit and don't flip, they might come back later today to flip.
            // Actually, setting KEY_DATE is fine so they don't get a different card if they refresh without flipping.
            localStorage.setItem(KEY_DATE, todayStr);
        }

        // Safety fallback
        if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= CARDS.length) {
            cardIndex = 0;
        }

        const card = CARDS[cardIndex];
        let cardVisualRendered = false;
        rememberDailyCard(card);
        cardContainer.setAttribute('role', 'button');
        cardContainer.tabIndex = 0;
        cardContainer.setAttribute('aria-label', 'Odhalit dnešní kartu dne');

        // Poplate content
        if (el('kdd-name')) el('kdd-name').textContent = card.name;
        if (el('kdd-keyword')) el('kdd-keyword').textContent = card.keyword;
        if (el('kdd-text')) el('kdd-text').textContent = card.text;

        const renderCardVisual = () => {
            if (cardVisualRendered) return;
            cardVisualRendered = true;
            renderCardSymbol(el('kdd-emoji'), card);
            el('kdd-front')?.classList.add('kdd-front--image-ready');
        };

        const detailLink = el('kdd-lexicon-link');
        if (detailLink) {
            detailLink.href = buildAngelCardsUrl('homepage_daily_card_detail', card);
            detailLink.addEventListener('click', () => {
                trackDailyCardDetail('homepage_daily_card_detail', card, detailLink.href);
            });
        }

        const fullReadingLink = el('kdd-full-reading-link');
        if (fullReadingLink) {
            fullReadingLink.href = buildAngelCardsUrl('homepage_daily_card_full_reading', card, 'andelske_karty_hluboky_vhled');
            fullReadingLink.addEventListener('click', () => {
                window.MH_ANALYTICS?.trackCTA?.('homepage_daily_card_full_reading', {
                    card_name: card.name,
                    feature: 'andelske_karty_hluboky_vhled',
                    destination: fullReadingLink.href
                });
            });
        }

        // Update streak badge
        const badge = el('kdd-streak-badge');
        if (badge && streakCount > 0) {
            setInlineBlockVisible(badge, true);
            const streakCountEl = el('kdd-streak-count');
            if (streakCountEl) streakCountEl.textContent = streakCount;
        }

        // Web Share API
        const shareBtn = el('kdd-share-btn');
        if (shareBtn) {
            setInlineBlockVisible(shareBtn, true);
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                shareCard(card, shareBtn);
            });
        }

        // Reveal UI Logic
        const revealCard = () => {
            // If already flipped, do nothing
            if (inner.classList.contains('kdd-inner--flipped')) return;
            renderCardVisual();

            // They flipped it! Now increment the streak if appropriate.
            // We need a separate flag so we don't increment multiple times a day if they refresh and flip again.
            const KEY_LAST_FLIP_DATE = 'mh_kdd_last_flip_date';
            let lastFlip = localStorage.getItem(KEY_LAST_FLIP_DATE);

            if (lastFlip !== todayStr) {
                // First flip of the day! Handle streak logic.
                if (lastFlip === yesterdayStr) {
                    streakCount++;
                } else if (lastFlip !== todayStr) { // Only reset if they missed a day, and it's not today.
                    streakCount = 1;
                }
                localStorage.setItem(KEY_STREAK, streakCount.toString());
                localStorage.setItem(KEY_LAST_FLIP_DATE, todayStr);

                // Update badge UI since it might have changed
                const badge = el('kdd-streak-badge');
                if (badge && streakCount > 0) {
                    setInlineBlockVisible(badge, true);
                    const streakCountEl = el('kdd-streak-count');
                    if (streakCountEl) streakCountEl.textContent = streakCount;
                }
            }

            // Always animate the flip (no immediate reveal on page load)
            inner.classList.add('kdd-inner--flipped');
            cardContainer.title = 'Otevřít v Andělských kartách';
            cardContainer.setAttribute('aria-label', `Otevřít denní symbol ${card.name} v Andělských kartách`);

            setTimeout(() => {
                if (el('kdd-hint')) el('kdd-hint').hidden = true;
                const msg = el('kdd-message');
                if (msg) {
                    setBlockVisible(msg, true);
                    msg.classList.add('kdd-message--visible');
                }
            }, 400);
        };

        // We removed auto-reveal "if (cardWasAlreadyRevealedToday) { revealCard(true); }"
        // Card is always faced down on initial load.

        const openCardDetail = () => {
            const destination = buildAngelCardsUrl('homepage_daily_card_card_click', card);
            trackDailyCardDetail('homepage_daily_card_card_click', card, destination);
            window.location.href = destination;
        };

        const activateCard = () => {
            if (inner.classList.contains('kdd-inner--flipped')) {
                openCardDetail();
                return;
            }
            revealCard();
        };

        cardContainer.addEventListener('click', activateCard);
        cardContainer.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            activateCard();
        });
    });
})();
