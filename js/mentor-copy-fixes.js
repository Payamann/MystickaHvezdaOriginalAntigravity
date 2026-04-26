document.addEventListener('DOMContentLoaded', () => {
    document.title = 'Hvězdný Průvodce | Mystická Hvězda';

    const setMeta = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', 'Osobní duchovní průvodce pro otázky kolem vztahů, směru a rozhodování.');
    setMeta('meta[property="og:title"]', 'Hvězdný Průvodce | Mystická Hvězda');
    setMeta('meta[property="og:description"]', 'Položte otázku a získejte rychlý výklad s ohledem na vaše znamení a aktuální energie.');

    const bannerText = document.getElementById('freemium-banner-text');
    if (bannerText) bannerText.innerHTML = 'Dnes zbývá: <strong id="freemium-count">...</strong> výkladů zdarma';

    const bannerLink = document.querySelector('#freemium-banner a[href="cenik.html"]');
    if (bannerLink) bannerLink.textContent = 'Získat Premium';

    const closeBtn = document.querySelector('#freemium-banner [data-action="closeBanner"]');
    if (closeBtn) closeBtn.textContent = 'X';

    const title = document.querySelector('.hero__title');
    if (title) title.innerHTML = 'Hvězdný <span class="text-gradient">Průvodce</span>';

    const subtitle = document.querySelector('.hero__subtitle');
    if (subtitle) {
        subtitle.textContent = 'Položte otázku o vztazích, práci nebo dalším směru. Odpověď dostanete hned a v kontextu toho, co zrovna řešíte.';
    }

    const headerTitle = document.querySelector('.chat-header h3');
    if (headerTitle) headerTitle.textContent = 'Průvodce';

    const headerStatus = document.querySelector('.chat-header span');
    if (headerStatus) headerStatus.textContent = 'Online | připraven pro vaše životní otázky';

    const welcome = document.querySelector('.message.message--mentor');
    if (welcome) {
        welcome.textContent = 'Vítej, poutníku. Jsem tady, abych ti pomohl pojmenovat, co se děje, a nabídnout další směr. Na co se chceš dnes zeptat?';
    }

    const input = document.getElementById('chat-input');
    if (input) input.placeholder = 'Napiš svou otázku... (např. Co mě čeká v lásce?)';

    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.textContent = '>';

    const sectionTitle = document.querySelector('section.section h3');
    if (sectionTitle) sectionTitle.textContent = 'Pokračujte ve své cestě';

    const cardMap = new Map([
        ['andelske-karty.html', ['Andělská karta', 'Poselství na dnešní den']],
        ['kristalova-koule.html', ['Křišťálová koule', 'Zeptejte se na cokoli']],
        ['tarot.html', ['Tarotový výklad', 'Hlubší vhled']],
        ['horoskopy.html', ['Denní horoskop', 'Vaše znamení dnes']],
        ['natalni-karta.html', ['Natální karta', 'Váš vesmírný otisk']],
        ['partnerska-shoda.html', ['Partnerská shoda', 'Synastrie vztahu']],
        ['numerologie.html', ['Numerologie', 'Rozbor čísel']],
        ['astro-mapa.html', ['Astro mapa', 'Zóny síly ve světě']],
        ['snar.html', ['Lexikon snů', 'Analýza vašeho snu']],
        ['biorytmy.html', ['Biorytmy', 'Dnešní křivky energie']],
        ['runy.html', ['Výklad z run', 'Severská moudrost']]
    ]);

    document.querySelectorAll('section.section a.card').forEach(card => {
        const href = card.getAttribute('href');
        const data = cardMap.get(href);
        if (!data) return;
        const texts = card.querySelectorAll('div');
        if (texts[1]) texts[1].textContent = data[0];
        if (texts[2]) texts[2].textContent = data[1];
    });
});
