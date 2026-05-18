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

    if (path.endsWith('/horoskopy.html') || path.endsWith('horoskopy.html')) {
        document.title = 'Horoskop na dnes pro 12 znamení | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Denní horoskop pro Berana až Ryby: témata dne, vztahy, práce a malý krok. Česky online, zdarma, s návazností na lunární fáze.');
        setMeta('meta[property="og:title"]', 'Horoskop na dnes pro 12 znamení | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Vyber si své znamení a získej denní horoskop jako praktický rámec pro vztahy, práci a další krok.');
        setHtml('.hero__title', 'Denní <span class="text-gradient">horoskop</span>');
        setText('.hero__subtitle', 'Astrologický kontext pro dnešní den. Berte ho jako mapu témat a otázek, ne jako pevnou předpověď.');
    }

    if (path.endsWith('/natalni-karta.html') || path.endsWith('natalni-karta.html')) {
        document.title = 'Natální karta online: výklad narození | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Zadej datum, čas a místo narození a získej symbolickou natální kartu s výkladem planet, ascendentu a témat pro sebereflexi.');
        setMeta('meta[property="og:title"]', 'Natální karta online: výklad narození | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Vytvoř si natální kartu podle data, času a místa narození. Získej osobní astrologický výklad a témata pro sebereflexi.');
        setHtml('.hero__title', 'Natální karta jako <span class="text-gradient">klíč k sebepoznání</span>');
        setText('.hero__subtitle', 'Vaše natální karta není jen obrázek. Je to mapa vaší duše, talentů a výzev, které jste si přišli prožít.');
    }

    if (path.endsWith('/andelske-karty.html') || path.endsWith('andelske-karty.html')) {
        document.title = 'Andělská karta dne online | 44 karet | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Vytáhni si andělskou kartu dne online z balíčku 44 karet. Rychlé denní poselství zdarma a jasná cesta k hlubšímu andělskému výkladu.');
        setMeta('meta[property="og:title"]', 'Andělská karta dne online | 44 karet | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Andělská karta dne online: rychlé poselství, symbol dne a možnost hlubšího výkladu ze 44 karet.');
        setHtml('.hero__title', 'Andělská <span class="text-gradient">karta dne</span>');
        setText('.hero__subtitle', 'Vytáhni si jednu andělskou kartu pro dnešní den. Krátké denní poselství je první krok; hlubší andělský výklad otevřeš až po kartě.');
    }

    if (path.endsWith('/runy.html') || path.endsWith('runy.html')) {
        document.title = 'Runy online: denní runa zdarma | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Vytáhni si denní runu zdarma. Runový výklad Elder Futhark online pro téma dne, rozhodnutí a další krok bez registrace.');
        setMeta('meta[property="og:title"]', 'Runy online: denní runa zdarma | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Denní runa zdarma a runový výklad Elder Futhark online pro téma dne, rozhodnutí a další krok.');
        setHtml('.hero__title', 'Věštění z <span class="text-gradient">run</span>');
        setText('.hero__subtitle', 'Sáhněte do pomyslného měšce a vytáhněte si kámen s poselstvím na dnešní den. Prastará severská moudrost čeká.');
    }

    if (path.endsWith('/lunace.html') || path.endsWith('lunace.html')) {
        document.title = 'Lunární fáze dnes | Energie Měsíce | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Zjistěte dnešní fázi Měsíce a její symbolický význam pro denní rytmus, vztahy, plánování a sebereflexi. Praktický lunární kalendář česky.');
        setMeta('meta[property="og:title"]', 'Lunární fáze dnes | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Aktuální fáze Měsíce jako symbolický rytmus pro dnešní krok, reflexi a jemnější plánování.');
        setHtml('.hero__title', 'Dnešní <span class="text-gradient">lunární fáze</span>');
        setText('.hero__subtitle', 'Vezměte aktuální fázi jako jednoduchý rytmus pro dnešní krok, ne jako pevný osud.');
    }

    if (path.endsWith('/kristalova-koule.html') || path.endsWith('kristalova-koule.html')) {
        document.title = 'Křišťálová koule online: osobní otázka | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Zeptej se křišťálové koule online. Symbolický vhled pro osobní otázku, jasnější situaci a jeden další krok bez slibu pevné budoucnosti.');
        setMeta('meta[property="og:title"]', 'Křišťálová koule online: osobní otázka | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Polož osobní otázku a získej symbolický vhled, jasnější situaci a další krok bez slibu pevné budoucnosti.');
        setHtml('.hero__title', 'Křišťálová koule a <span class="text-gradient">hlas intuice</span>');
        const existingSubtitle = document.querySelector('.hero__subtitle');
        if (existingSubtitle) {
            existingSubtitle.textContent = 'Položte jednu otázku, ztište mysl a nechte odpověď vystoupit z mlhy toho, co právě potřebujete vidět jasněji.';
        } else {
            const heroTitle = document.querySelector('.hero__title');
            const subtitle = document.createElement('p');
            subtitle.className = 'hero__subtitle';
            subtitle.textContent = 'Položte jednu otázku, ztište mysl a nechte odpověď vystoupit z mlhy toho, co právě potřebujete vidět jasněji.';
            heroTitle?.insertAdjacentElement('afterend', subtitle);
        }
    }

    if (path.endsWith('/minuly-zivot.html') || path.endsWith('minuly-zivot.html')) {
        document.title = 'Minulý Život — Akashické Záznamy | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Vytvořte si symbolický výklad minulého života pro sebereflexi. Objevte archetypální příběh, karmické motivy, dary a téma, které může inspirovat současný život.');
        setMeta('meta[property="og:title"]', 'Minulý Život — Akashické Záznamy | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Symbolický výklad minulého života pro sebereflexi: archetypální příběh, karmické motivy, dary a téma pro současný život.');
        setHtml('.past-life-hero h1, .hero__title', 'Minulý život a <span class="text-gradient">akashické záznamy</span>');
        setText('.past-life-hero p, .hero__subtitle', 'Vytvořte symbolický obraz minulého života, který může odhalit opakující se motivy, dary a téma pro současnou cestu.');
    }
});
