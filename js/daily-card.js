// js/daily-card.js
(function () {
    const CARDS = [
        { name: 'Andělé Ochránci', emoji: '👼', keyword: 'Ochrana', text: 'Dnes jste obklopeni neviditelnou ochranou. Důvěřujte svému vnitřnímu hlasu a nebojte se udělat první krok. Andělé vás provázejí.', link: 'andelska-cisla.html' },
        { name: 'Hojnost', emoji: '🌟', keyword: 'Prosperita', text: 'Energie hojnosti proudí vaším životem. Otevřete se přijímání – ať už jde o lásku, příležitosti nebo uznání. Jste toho hodni.', link: 'hojnost.html' },
        { name: 'Nový začátek', emoji: '🌱', keyword: 'Obnova', text: 'Jitřní energie nese poselství čerstvého startu. Co jste odkládali, nyní dostává zelenou. Důvěřujte procesu a jděte vpřed.', link: 'tarot-blazen.html' },
        { name: 'Vnitřní mír', emoji: '☮️', keyword: 'Klid', text: 'Dnešní den volá po ztišení. Věnujte chvíli sobě, svému dechu a vnitřnímu prostoru. Z klidu vychází ta nejlepší rozhodnutí.', link: 'anahata.html' },
        { name: 'Odvaha', emoji: '🦁', keyword: 'Síla', text: 'Hvězdy vám dnes přidávají na odvaze. Je čas říct ano věcem, které jste se dosud báli. Vaše srdce zná správný směr.', link: 'tiwaz.html' },
        { name: 'Láska', emoji: '❤️', keyword: 'Spojení', text: 'Energie dne je prodchnuta láskou. Ať jde o vztah, přátelství nebo vztah k sobě – otevřete své srdce a lásku přijměte i dejte.', link: 'anahata.html' },
        { name: 'Intuice', emoji: '🔮', keyword: 'Vhled', text: 'Váš šestý smysl je dnes obzvláště aktivní. Věřte prvním pocitům a nalézejte odpovědi uvnitř sebe, ne jen ve vnějším světě.', link: 'muladhara.html' },
        { name: 'Transformace', emoji: '🦋', keyword: 'Změna', text: 'Jako motýl procházíte proměnou. Nenechte se vystrašit tím, co se rozpadá – to, co přichází, je krásnější. Přijměte změnu s otevřenou náručí.', link: 'reinkarnace.html' },
        { name: 'Vděčnost', emoji: '🙏', keyword: 'Hojnost', text: 'Zastavte se a všimněte si všeho, za co můžete být vděční. Vděčnost otevírá dveře dalším darům. Dnešní den ocení i ty nejmenší věci.', link: 'synchronicita.html' },
        { name: 'Harmonie', emoji: '⚖️', keyword: 'Rovnováha', text: 'Hledejte rovnováhu ve všech oblastech svého života. Harmonie přichází z vyrovnání vnitřního a vnějšího světa. Nenásilí a klid jsou vaše síla.', link: 'karma.html' },
        { name: 'Vůdce', emoji: '👑', keyword: 'Vedení', text: 'Dnes vás ostatní přirozeně sledují. Vaše slova a činy mají větší váhu, než si myslíte. Buďte lídrem, jakým byste chtěli mít vzor.', link: 'velka-arkana.html' },
        { name: 'Propojení', emoji: '🌐', keyword: 'Síť', text: 'Dnešní energia posiluje vaše vztahy a propojení s druhými. Nebojte se oslovit starého přítele nebo navázat nové kontakty – vesmír to podporuje.', link: 'synchronicita.html' },
        { name: 'Hojení', emoji: '💚', keyword: 'Uzdravení', text: 'Zelená energie hojení prostupuje vaším tělem i duší. Je čas pustit staré rány a dovolit si plně se uzdravit. Jste na správné cestě.', link: 'anahata.html' },
        { name: 'Moudrost', emoji: '🦉', keyword: 'Poznání', text: 'Dnes vám jsou k dispozici hluboká moudrost a vhled. Naslouchejte starším, čtěte mezi řádky a hledejte smysl za povrchem věcí.', link: 'akasicke-zaznamy.html' },
        { name: 'Radost', emoji: '😊', keyword: 'Lehkost', text: 'Dnes si dovolte být lehcí a radostní. Hrej si, smějte se, užijte si okamžik. Radost je vaším přirozeným stavem a právem.', link: 'mala-arkana.html' },
        { name: 'Průlom', emoji: '⚡', keyword: 'Zjevení', text: 'Dnes může přijít nečekané zjevení nebo průlom v situaci, která se zdála zablokovaná. Buďte otevření a pozorní – osvícení přichází náhle.', link: 'aspekty.html' },
        { name: 'Důvěra', emoji: '🤝', keyword: 'Víra', text: 'Důvěřujte procesu, i když nevidíte celý obraz. Vesmír pracuje za kulisami ve váš prospěch. Pusťte kontrolu a uvěřte, že vše dopadne dobře.', link: 'nativni-karta.html' },
        { name: 'Kreativita', emoji: '🎨', keyword: 'Tvorba', text: 'Vaše kreativní energie je dnes na vrcholu. Vraťte se k projektu, který jste odkládali, nebo vyzkoušejte něco zcela nového. Tvořte!', link: 'svadhisthana.html' },
        { name: 'Uvolnění', emoji: '🌊', keyword: 'Tok', text: 'Přestaňte zadržovat dech a plavte s proudem. Uvolnění napětí a odporu vám otvírá cestu k snadnějšímu a radostnějšímu životu.', link: 'lucidni-sen.html' },
        { name: 'Záměr', emoji: '🎯', keyword: 'Fokus', text: 'Jasně si definujte, co chcete. Dnešní energie podporuje záměry a manifesty. Napište si cíl nebo ho vyslovte nahlas – vesmír naslouchá.', link: 'aspekty.html' },
        { name: 'Kořeny', emoji: '🌳', keyword: 'Stabilita', text: 'Ukotví se ke svým kořenům – rodině, hodnotám, tradici. Síla vyrůstá ze stability a hlubokého zakotvení. Dnes océňte, odkud pocházíte.', link: 'muladhara.html' },
        { name: 'Zrcadlo', emoji: '🪞', keyword: 'Reflexe', text: 'Cokoliv vás dnes na druhých dráždí nebo nadchne, je zrcadlem vašeho vlastního nitra. Den pro sebereflexi a hluboké pochopení sebe sama.', link: 'karmicky-uzel.html' },
        { name: 'Přijetí', emoji: '🌸', keyword: 'Soucit', text: 'Přijměte sebe i druhé přesně takovými, jací jsou. Dnešní den volá po soucitu namísto souzení. Z přijetí roste skutečná láska.', link: 'anahata.html' },
        { name: 'Zázrak', emoji: '✨', keyword: 'Požehnání', text: 'Otevřete oči pro malé zázraky kolem sebe. Dnes je den, kdy se vesmír dává o sobě vědět skrze synchronicity a náhody. Žádné není.', link: 'synchronicita.html' },
        { name: 'Přátelství', emoji: '🤗', keyword: 'Komunita', text: 'Vaši přátelé jsou vaší rodinou, kterou si sami volíte. Dnes se ozvěte těm, na které myslíte. Jedno upřímné slovo může změnit celý den.', link: 'synchronicita.html' },
        { name: 'Ohraničení', emoji: '🛡️', keyword: 'Hranice', text: 'Naučit se říkat ne je akt lásky k sobě samému. Dnes posilujte zdravé hranice – bez viny, bez omluv. Vaše energie je darem, ne poviností.', link: 'saturnosky-navrat.html' },
        { name: 'Vizionář', emoji: '🔭', keyword: 'Vize', text: 'Povzneste pohled nad každodennost. Jaká je vaše velká vize? Dnešní den přeje snění, plánování a nastavování smělých cílů.', link: 'draci-uzly.html' },
        { name: 'Hravost', emoji: '🎭', keyword: 'Spontánnost', text: 'Je čas přerušit rutinu a vnést do dne trochu překvapení. Buďte spontánní, hraví, nebojte se vypadat trochu bláznivě. Život je příliš krátký na vážnost.', link: 'tarot-blazen.html' },
        { name: 'Propojen se zemí', emoji: '🌍', keyword: 'Zemění', text: 'Vyjděte ven, dotkněte se přírody, zhluboka dýchejte. Zemský magnetismus vám dodá sílu a jasnost mysli. Příroda je vaším nejlepším lékem.', link: 'muladhara.html' },
        { name: 'Paradox', emoji: '🌙', keyword: 'Tajemství', text: 'Ne vše musí být ihned vysvětleno. Dnes se smiřte s nejistotou a mysteriem. Pravda má mnoho vrstev – ponořte se do hlubiny bez strachu.', link: 'velka-arkana.html' },
        { name: 'Vítěz', emoji: '🏆', keyword: 'Úspěch', text: 'Vaše vytrvalost byla oceněna. Dnes celebrujte svůj pokrok – i ten nejmenší úspěch si zaslouží uznání. Jste na správné cestě k vítězství.', link: 'fehu.html' },
    ];

    document.addEventListener('DOMContentLoaded', () => {
        const el = id => document.getElementById(id);
        const cardContainer = el('kdd-card');
        const inner = el('kdd-inner');
        if (!cardContainer || !inner) return;

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
        let cardWasAlreadyRevealedToday = false;

        if (lastDate === todayStr) {
            // Already drew today
            cardIndex = parseInt(localStorage.getItem(KEY_INDEX), 10);
            cardWasAlreadyRevealedToday = true;
        } else {
            // New day, new card!
            cardIndex = Math.floor(Math.random() * CARDS.length);
            localStorage.setItem(KEY_INDEX, cardIndex.toString());
            localStorage.setItem(KEY_DATE, todayStr);

            if (lastDate === yesterdayStr) {
                streakCount++;
            } else {
                streakCount = 1; // Reset streak
            }
            localStorage.setItem(KEY_STREAK, streakCount.toString());
        }

        // Safety fallback
        if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= CARDS.length) {
            cardIndex = 0;
        }

        const card = CARDS[cardIndex];

        // Poplate content
        if (el('kdd-emoji')) el('kdd-emoji').textContent = card.emoji;
        if (el('kdd-name')) el('kdd-name').textContent = card.name;
        if (el('kdd-keyword')) el('kdd-keyword').textContent = card.keyword;
        if (el('kdd-text')) el('kdd-text').textContent = card.text;

        if (el('kdd-lexicon-link')) {
            el('kdd-lexicon-link').href = `slovnik/${card.link}`;
        }

        // Update streak badge
        const badge = el('kdd-streak-badge');
        if (badge && streakCount > 0) {
            badge.style.display = 'inline-block';
            const streakCountEl = el('kdd-streak-count');
            if (streakCountEl) streakCountEl.textContent = streakCount;
        }

        // Web Share API
        const shareBtn = el('kdd-share-btn');
        if (shareBtn && navigator.share) {
            shareBtn.style.display = 'inline-block';
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigator.share({
                    title: 'Mystická Hvězda - Moje Karta Dne',
                    text: `Moje dnešní karta je ${card.name} (${card.emoji}). Zjisti, jakou zprávu mají hvězdy připravenou pro tebe!`,
                    url: 'https://mystickahvezda.cz'
                }).catch(err => console.log('Share error:', err));
            });
        }

        // Reveal UI Logic
        const revealCard = (isImmediate = false) => {
            if (inner.style.transform.includes('rotateY(180deg)')) return;

            if (isImmediate) {
                // Disable transition for instantaneous reveal on reload
                const oldTransition = inner.style.transition;
                inner.style.transition = 'none';
                inner.style.transform = 'rotateY(180deg)';
                inner.style.webkitTransform = 'rotateY(180deg)';
                // Force reflow
                void inner.offsetWidth;
                inner.style.transition = oldTransition;

                const msg = el('kdd-message');
                if (el('kdd-hint')) el('kdd-hint').style.display = 'none';
                if (msg) msg.style.display = 'block';
            } else {
                inner.style.transform = 'rotateY(180deg)';
                inner.style.webkitTransform = 'rotateY(180deg)';
                setTimeout(() => {
                    if (el('kdd-hint')) el('kdd-hint').style.display = 'none';
                    const msg = el('kdd-message');
                    if (msg) {
                        msg.style.display = 'block';
                        msg.style.animation = 'fadeIn 0.5s ease';
                    }
                }, 400);
            }
        };

        if (cardWasAlreadyRevealedToday) {
            // If the user already drew a card today, reveal immediately to not lose state
            revealCard(true);
        }

        cardContainer.addEventListener('click', () => revealCard(false));
    });
})();
