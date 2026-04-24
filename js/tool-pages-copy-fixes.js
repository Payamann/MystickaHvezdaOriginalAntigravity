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
        setMeta('meta[name="description"]', 'Váš osobní duchovní průvodce. Ptejte se na osud, vztahy a životní směr.');
        setMeta('meta[property="og:title"]', 'Hvězdný Průvodce | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Váš osobní duchovní průvodce. Ptejte se na osud, vztahy a životní směr.');
        setText('.hero__title', 'Hvězdný Průvodce');
        setText('.hero__subtitle', 'Zeptejte se na to, co právě řešíte. Hvězdný Průvodce vám pomůže najít klid, směr a souvislosti.');
        setText('.chat-header h2, .chat-header h3', 'Hvězdný Průvodce');
    }

    if (path.endsWith('/tarot.html') || path.endsWith('tarot.html')) {
        document.title = 'Tarotové Výklady Online | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Online tarotové výklady s hvězdnou interpretací. Vyberte si z karet Velké arkány a získejte personalizovaný výklad.');
        setMeta('meta[property="og:title"]', 'Tarotové Výklady Online | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Online tarotové výklady s hvězdnou interpretací. Vyberte si z karet Velké arkány a získejte personalizovaný výklad.');
        setHtml('.hero__title', 'Tarotové <span class="text-gradient">výklady</span>');
        setText('.hero__subtitle', 'Vyberte si výklad, zamíchejte karty a nechte symboliku tarotu promluvit do vaší aktuální situace.');
    }

    if (path.endsWith('/numerologie.html') || path.endsWith('numerologie.html')) {
        document.title = 'Numerologie Online | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Objevte skrytý význam čísel ve vašem životě. Výpočet čísla životní cesty, osudu a duše.');
        setMeta('meta[property="og:title"]', 'Numerologie Online | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Objevte skrytý význam čísel ve vašem životě. Výpočet čísla životní cesty, osudu a duše.');
        setHtml('.hero__title', '<span class="text-gradient">Numerologie</span>');
        setText('.hero__subtitle', 'Každé číslo nese svůj jedinečný význam. Odhalte, co říkají čísla o vašem životě, osudu a skrytých touhách.');
        setText('.card__title', 'Vypočítejte svá čísla');
        const profileToggle = document.querySelector('label[title]');
        if (profileToggle) profileToggle.setAttribute('title', 'Použít údaje z mého profilu');
    }

    if (path.endsWith('/partnerska-shoda.html') || path.endsWith('partnerska-shoda.html')) {
        document.title = 'Partnerská Shoda | Mystická Hvězda';
        setMeta('meta[name="description"]', 'Zjistěte kompatibilitu mezi dvěma znameními. Synastrie a analýza partnerského vztahu.');
        setMeta('meta[property="og:title"]', 'Partnerská Shoda | Mystická Hvězda');
        setMeta('meta[property="og:description"]', 'Zjistěte kompatibilitu mezi dvěma znameními. Synastrie a analýza partnerského vztahu.');
        setHtml('.hero__title', 'Partnerská <span class="text-gradient">shoda</span>');
        setText('.hero__subtitle', 'Porovnejte dvě energie, podívejte se na emoce, komunikaci i vášeň a zjistěte, kde se opravdu potkáváte.');
    }
});
