document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    const setMeta = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute('content', value);
    };

    const setText = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    };

    const setHtml = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.innerHTML = value;
    };

    if (path.endsWith('/mentor.html') || path.endsWith('mentor.html')) {
        document.title = 'Hvězdný Průvodce | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Hvězdný průvodce jako navazující AI chat pro vztahy, rozhodování a osobní témata. Pomůže pojmenovat otázky a další kroky bez slibů pevného osudu.');
        setMeta('meta[property="og:title"]', 'Hvězdný Průvodce | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Navazující AI chat pro vztahy, rozhodování a osobní témata. Praktický rámec pro další krok, ne pevná předpověď.');
        setText('.hero__title', 'Hvězdný Průvodce');
        setText('.hero__subtitle', 'Polož otázku o vztazích, práci nebo dalším směru. Automatický průvodce nabídne podněty k zamyšlení podle situace, kterou popíšeš.');
        setText('.chat-header h2, .chat-header h3', 'Hvězdný Průvodce');
    }

    if (path.endsWith('/tarot.html') || path.endsWith('tarot.html')) {
        document.title = 'Tarot online: výklad z 78 karet | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Vyber si tarot online z 78 karet: jedna karta zdarma, celý tříkartový výklad a Keltský kříž v členství. Symboly a podněty pro vlastní další krok.');
        setMeta('meta[property="og:title"]', 'Tarot online: výklad z 78 karet | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Jedna karta zdarma; celý tříkartový výklad a Keltský kříž v členství. Významy 78 karet a podněty pro vlastní zamyšlení.');
        setHtml('.hero__title', 'Tarotové <span class="text-gradient">výklady</span>');
        setText('.hero__subtitle', 'Jedna karta zdarma, nebo celý vícekartový výklad v členství. Vyber si podle otázky a porovnej symboly karet s tím, co o své situaci skutečně víš.');
    }

    if (path.endsWith('/numerologie.html') || path.endsWith('numerologie.html')) {
        document.title = 'Numerologie online: životní číslo a osud | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Numerologie online zdarma: vypočítej životní cestu a prohlédni si čtyři hodnoty z rodného jména a data narození. Symbolická témata a volitelný AI výklad.');
        setMeta('meta[property="og:title"]', 'Numerologie online: životní číslo a osud | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Spočítej životní cestu a prohlédni si čtyři numerologické hodnoty jako symbolická témata. Členský AI výklad pracuje jen s těmito čísly.');
        setHtml('.hero__title', '<span class="text-gradient">Numerologie</span>');
        setText('.hero__subtitle', 'Zadej rodné jméno a datum narození. Čtyři vypočtené hodnoty si můžeš prohlédnout jako symbolická témata k zamyšlení.');
        setText('.card__title', 'Vypočítej svá čísla');
        const profileToggle = document.querySelector('label[title]');
        if (profileToggle) profileToggle.setAttribute('title', 'Použít údaje z mého profilu');
    }

    if (path.endsWith('/partnerska-shoda.html') || path.endsWith('partnerska-shoda.html')) {
        document.title = 'Partnerská shoda znamení online | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Porovnej dvě znamení a vztahovou dynamiku. Základní výklad zdarma, hlubší rozpad jako navazující osobní krok.');
        setMeta('meta[property="og:title"]', 'Partnerská shoda znamení online | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Porovnej dvě znamení a vztahovou dynamiku. Základní výklad zdarma, hlubší rozpad jako navazující osobní krok.');
        setHtml('.hero__title', 'Partnerská <span class="text-gradient">shoda</span>');
        setText('.hero__subtitle', 'Porovnejte dvě energie, podívejte se na emoce, komunikaci i vášeň a zjistěte, kde se opravdu potkáváte.');
    }
});
