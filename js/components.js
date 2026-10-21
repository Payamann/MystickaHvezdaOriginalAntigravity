/**
 * Mystická Hvězda - Component Loader
 * Dynamically loads Header and Footer to avoid code duplication.
 * ALSO includes standalone hamburger menu handler (no module dependencies).
 */

// Load consent-aware analytics on every page (lazy, non-blocking).
(function () {
    const scriptTag = document.querySelector('script[src*="components.js"], script[src*="core.js"], script[src*="components.mh-"], script[src*="core.mh-"]');
    const scriptSrc = scriptTag ? scriptTag.getAttribute('src') : '';
    const basePath = scriptSrc.split(/js\/(?:dist\/)?(?:components|core)(?:\.mh-[a-f0-9]+)?\.js/)[0] || '';

    function appendOrderedScript(src) {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.defer = true;
        document.head.appendChild(script);
        return script;
    }

    function loadConsentUi() {
        if (!window.MH_COOKIE_HANDLER_INIT && !document.querySelector('script[src*="cookie-handler.js"]')) {
            appendOrderedScript(basePath + 'js/dist/cookie-handler.js?v=20260703-consent-event');
        }
    }

    function loadAnalyticsAndConsentUi() {
        if (window.MH_ANALYTICS) {
            loadConsentUi();
            return;
        }

        let analyticsScript = document.querySelector('script[src*="/analytics.js"]');
        if (!analyticsScript) {
            analyticsScript = appendOrderedScript(basePath + 'js/dist/analytics.js?v=9');
        }

        // The banner must not dispatch consent before first-party analytics
        // has registered its mh_cookie_consent listener.
        analyticsScript.addEventListener('load', loadConsentUi, { once: true });
        analyticsScript.addEventListener('error', loadConsentUi, { once: true });
    }

    // Consent Mode must exist before first-party analytics emits to GA4.
    if (window.gtag) {
        loadAnalyticsAndConsentUi();
    } else {
        const existingInit = document.querySelector('script[src*="analytics-init.js"]');
        if (existingInit) {
            existingInit.addEventListener('load', loadAnalyticsAndConsentUi, { once: true });
            existingInit.addEventListener('error', loadAnalyticsAndConsentUi, { once: true });
        } else {
            const analyticsInit = appendOrderedScript(basePath + 'js/dist/analytics-init.js');
            analyticsInit.addEventListener('load', loadAnalyticsAndConsentUi, { once: true });
            analyticsInit.addEventListener('error', loadAnalyticsAndConsentUi, { once: true });
        }
    }

    if (!window.MH_FEEDBACK_WIDGET_INIT && !document.querySelector('script[src*="feedback-widget.js"]')) {
        const fw = document.createElement('script');
        fw.src = basePath + 'js/dist/feedback-widget.js';
        fw.defer = true;
        document.head.appendChild(fw);
    }

    if (!window.Premium && !document.querySelector('script[src*="premium-gates.js"]')) {
        const pg = document.createElement('script');
        pg.src = basePath + 'js/dist/premium-gates.js?v=20261018-paywall-svg';
        pg.defer = true;
        document.head.appendChild(pg);
    }
})();

document.addEventListener('DOMContentLoaded', async () => {
    // Determine the base path based on where this script is loaded from
    // This allows the component loader to work correctly from subdirectories (like /blog/ or /sk/)
    const scriptTag = document.querySelector('script[src*="components.js"], script[src*="core.js"], script[src*="components.mh-"], script[src*="core.mh-"]');
    const scriptSrc = scriptTag ? scriptTag.getAttribute('src') : '';
    const basePath = scriptSrc.split(/js\/(?:dist\/)?(?:components|core)(?:\.mh-[a-f0-9]+)?\.js/)[0] || '';

    // Load header and footer in parallel for faster initial paint
    // Use high priority for header as it affects LCP/CLS
    await Promise.all([
        loadComponent('header-placeholder', `${basePath}components/header.html?v=20261014-detail-polish-2`, basePath, true),
        loadComponent('footer-placeholder', `${basePath}components/footer.html?v=20261020-footer-contact-dedupe`, basePath, false)
    ]);

    // STANDALONE: Init hamburger menu + header scroll (no module dependency)
    // Must run BEFORE dispatching components:loaded, so navInitialized flag is set
    // before main.js's components:loaded listener calls initMobileNav().
    // This prevents the double-toggle bug caused by both handlers attaching a click listener.
    initStandaloneHeader();

    // Dispatch event to signal that UI shells are ready
    document.dispatchEvent(new Event('components:loaded'));
});

async function loadComponent(elementId, path, basePath = '', highPriority = false) {
    const element = document.getElementById(elementId);
    
    // Check if the component is already hardcoded or loaded
    // If we have hardcoded content, we don't need to load it
    const alreadyPresent = (elementId === 'header-placeholder' && document.querySelector('.header')) ||
                          (elementId === 'footer-placeholder' && document.querySelector('.footer'));
    
    if (!element && !alreadyPresent) return;
    
    // If it's already in the DOM, just ensure initialization runs
    if (alreadyPresent) {
        return;
    }

    try {
        const response = await fetch(path, highPriority ? { priority: 'high' } : {});
        if (!response.ok) throw new Error(`Failed to load ${path}`);

        let html = await response.text();

        // Create a temporary container to manipulate the DOM
        const temp = document.createElement('div');
        temp.innerHTML = html;

        localizeSharedShell(temp);
        html = temp.innerHTML;

        // Fix relative paths for images and links if we are in a subdirectory
        if (basePath && basePath !== './' && basePath !== '/') {
            // Fix images
            temp.querySelectorAll('img').forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
                    img.setAttribute('src', basePath + src);
                }
            });

            // Fix links
            temp.querySelectorAll('a').forEach(a => {
                const href = a.getAttribute('href');
                if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('/') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                    a.setAttribute('href', basePath + href);
                }
            });

            html = temp.innerHTML;
        }

        element.innerHTML = html;

        // Replace the placeholder with the actual content
        element.replaceWith(...element.childNodes);

    } catch (error) {
        console.error(`Error loading component ${path}:`, error);
        element.innerHTML = `<div class="error-loading">Failed to load content.</div>`;
    }
}

// Translate only known shared-shell text nodes. The component markup, IDs,
// classes, SVG and event hooks stay intact across the locale variants.
function localizeSharedShell(root) {
    const locale = document.documentElement.lang;
    if (locale !== 'sk' && locale !== 'pl') return;

    const labels = {
        sk: {
            'Natální Karta': 'Natálna karta',
            'Partnerská Shoda': 'Partnerská zhoda',
            'Lunární Fáze': 'Mesačné fázy',
            'Astro Mapa': 'Astromapa',
            'Čínský Horoskop': 'Čínsky horoskop',
            'Andělské Karty': 'Anjelské karty',
            'Otevřít hlavní menu': 'Otvoriť hlavné menu', 'Zavřít hlavní menu': 'Zavrieť hlavné menu',
            'Hlavní navigace': 'Hlavná navigácia', 'Domů': 'Domov', 'Astrologie': 'Astrológia',
            'Horoskopy': 'Horoskopy', 'Znamení zvěrokruhu': 'Znamenia zverokruhu', 'Natální karta': 'Natálna karta',
            'Lunární fáze': 'Mesačné fázy', 'Lunární rituál': 'Mesačný rituál', 'Astro mapa': 'Astromapa',
            'Partnerská shoda': 'Partnerská zhoda', 'Čínský horoskop': 'Čínsky horoskop', 'Minulý život': 'Minulý život',
            'Tarot a věštění': 'Tarot a veštenie', 'Tarot': 'Tarot', 'Tarot karta dne': 'Tarotová karta dňa',
            'Tarot 3 karty': 'Tarot 3 karty', 'Keltský kříž': 'Keltský kríž', 'Tarot na lásku': 'Tarot na lásku',
            'Tarot ANO nebo NE': 'Tarot ÁNO alebo NIE', 'Významy karet': 'Významy kariet', 'Andělské karty': 'Anjelské karty',
            'Andělská pošta': 'Anjelská pošta', 'Runy': 'Runy', 'Křišťálová koule': 'Krištáľová guľa', 'Snář': 'Snár',
            'Šamanské kolo': 'Šamanské koleso', 'Čísla a energie': 'Čísla a energia', 'Numerologie': 'Numerológia',
            'Kalkulačka životní cesty': 'Kalkulačka životnej cesty', 'Aura kalkulačka': 'Kalkulačka aury',
            'Denní afirmace': 'Denné afirmácie', 'Databáze jmen': 'Databáza mien', 'Biorytmy': 'Bioritmy',
            'Ezoterický slovník': 'Ezoterický slovník', 'Poznání': 'Poznanie', 'Mystické testy': 'Mystické testy',
            'Mystický blog': 'Mystický blog', 'Časté otázky': 'Časté otázky', 'O nás': 'O nás',
            'Výklady a služby': 'Výklady a služby', 'Osobní mapa na 12 měsíců': 'Osobná mapa na 12 mesiacov',
            'Průvodce': 'Sprievodca', 'Ceník': 'Cenník', 'Profil': 'Profil', 'Registrace': 'Registrácia', 'Přihlásit se': 'Prihlásiť sa',
            'Mystická Hvězda Logo': 'Logo Mystická Hvězda', 'Moderní astrologická služba pro českou komunitu.': 'Moderná astrologická služba pre českú komunitu.',
            'Moderní astrologická služba pro českou komunitu. Spojujeme tisíciletou moudrost s důvěryhodnou praxí.': 'Moderná astrologická služba pre českú komunitu. Spájame tisícročnú múdrosť s dôveryhodnou praxou.',
            'Spojujeme tisíciletou moudrost s důvěryhodnou praxí.': 'Spájame tisícročnú múdrosť s dôveryhodnou praxou.',
            'Provozovatel služby Mystická Hvězda. Potřebuješ pomoc? Napiš nám kdykoliv na': 'Prevádzkovateľ služby Mystická Hvězda. Potrebuješ pomoc? Napíš nám kedykoľvek na',
            'Provozovatel služby Mystická Hvězda. Podpora:': 'Prevádzkovateľ služby Mystická Hvězda. Podpora:',
            'Pomohla ti tato stránka?': 'Pomohla ti táto stránka?', 'Ano': 'Áno', 'Ne': 'Nie',
            'Věštění & Energie': 'Veštenie a energia', 'Tarot & Výklady': 'Tarot a výklady', 'Věštění z Run': 'Veštenie z rún',
            'Křišťálová Koule': 'Krištáľová guľa', 'Šamanské Kolo': 'Šamanské koleso', 'Hvězdný Průvodce': 'Hviezdny sprievodca',
            'Mystické Testy': 'Mystické testy', 'Mystický Blog': 'Mystický blog', 'Ezoterický Slovník': 'Ezoterický slovník',
            'Významy tarotových karet': 'Významy tarotových kariet', 'Kontakt': 'Kontakt',
            'Napsat podpoře': 'Napísať podpore', 'FAQ (Časté dotazy)': 'FAQ (časté otázky)', 'Jak to funguje': 'Ako to funguje',
            'Jazykové verze': 'Jazykové verzie', 'Jazyk:': 'Jazyk:', 'Čeština': 'Čeština', 'Slovenčina': 'Slovenčina', 'Polski': 'Poľština',
            '© 2026 Mystická Hvězda. Všechna práva vyhrazena.': '© 2026 Mystická Hvězda. Všetky práva vyhradené.',
            'Podpora:': 'Podpora:', 'Obchodní podmínky': 'Obchodné podmienky', 'Ochrana soukromí': 'Ochrana súkromia',
            'Cookies používáme pro chod webu a volitelnou analytiku.': 'Cookies používame na fungovanie webu a voliteľnú analytiku.',
            'Nezbytné': 'Nevyhnutné', 'Analytické': 'Analytické', 'Marketingové': 'Marketingové',
            'Odmítnout vše': 'Odmietnuť všetko', 'Uložit nastavení': 'Uložiť nastavenia', 'Nastavení': 'Nastavenia', 'Souhlasím se vším': 'Súhlasím so všetkým',
            'Otevírá českou stránku': 'Otvára českú stránku'
        },
        pl: {
            'Natální Karta': 'Kosmogram',
            'Partnerská Shoda': 'Dopasowanie partnerskie',
            'Lunární Fáze': 'Fazy Księżyca',
            'Astro Mapa': 'Mapa astrologiczna',
            'Čínský Horoskop': 'Horoskop chiński',
            'Andělské Karty': 'Karty anielskie',
            'Otevřít hlavní menu': 'Otwórz menu główne', 'Zavřít hlavní menu': 'Zamknij menu główne',
            'Hlavní navigace': 'Nawigacja główna', 'Domů': 'Strona główna', 'Astrologie': 'Astrologia',
            'Horoskopy': 'Horoskopy', 'Znamení zvěrokruhu': 'Znaki zodiaku', 'Natální karta': 'Kosmogram',
            'Lunární fáze': 'Fazy Księżyca', 'Lunární rituál': 'Rytuał księżycowy', 'Astro mapa': 'Mapa astrologiczna',
            'Partnerská shoda': 'Dopasowanie partnerskie', 'Čínský horoskop': 'Horoskop chiński', 'Minulý život': 'Poprzednie życie',
            'Tarot a věštění': 'Tarot i wróżby', 'Tarot': 'Tarot', 'Tarot karta dne': 'Karta dnia', 'Tarot 3 karty': 'Tarot 3 karty',
            'Keltský kříž': 'Krzyż celtycki', 'Tarot na lásku': 'Tarot miłosny', 'Tarot ANO nebo NE': 'Tarot TAK albo NIE',
            'Významy karet': 'Znaczenie kart', 'Andělské karty': 'Karty anielskie', 'Andělská pošta': 'Poczta anielska',
            'Runy': 'Runy', 'Křišťálová koule': 'Kryształowa kula', 'Snář': 'Sennik', 'Šamanské kolo': 'Koło szamańskie',
            'Čísla a energie': 'Liczby i energia', 'Numerologie': 'Numerologia', 'Kalkulačka životní cesty': 'Kalkulator drogi życia',
            'Aura kalkulačka': 'Kalkulator aury', 'Denní afirmace': 'Codzienne afirmacje', 'Databáze jmen': 'Baza imion',
            'Biorytmy': 'Biorytmy', 'Ezoterický slovník': 'Słownik ezoteryczny', 'Poznání': 'Odkrywanie',
            'Mystické testy': 'Testy mistyczne', 'Mystický blog': 'Blog mistyczny', 'Časté otázky': 'Częste pytania', 'O nás': 'O nas',
            'Výklady a služby': 'Odczyty i usługi', 'Osobní mapa na 12 měsíců': 'Osobista mapa na 12 miesięcy',
            'Průvodce': 'Przewodnik', 'Ceník': 'Cennik', 'Profil': 'Profil', 'Registrace': 'Rejestracja', 'Přihlásit se': 'Zaloguj się',
            'Mystická Hvězda Logo': 'Logo Mystická Hvězda', 'Moderní astrologická služba pro českou komunitu.': 'Nowoczesny serwis astrologiczny dla czeskiej społeczności.',
            'Moderní astrologická služba pro českou komunitu. Spojujeme tisíciletou moudrost s důvěryhodnou praxí.': 'Nowoczesny serwis astrologiczny dla czeskiej społeczności. Łączymy tysiącletnią mądrość z rzetelną praktyką.',
            'Spojujeme tisíciletou moudrost s důvěryhodnou praxí.': 'Łączymy tysiącletnią mądrość z rzetelną praktyką.',
            'Provozovatel služby Mystická Hvězda. Potřebuješ pomoc? Napiš nám kdykoliv na': 'Serwis Mystická Hvězda. Potrzebujesz pomocy? Napisz do nas w każdej chwili:',
            'Provozovatel služby Mystická Hvězda. Podpora:': 'Serwis Mystická Hvězda. Wsparcie:',
            'Pomohla ti tato stránka?': 'Czy ta strona była pomocna?', 'Ano': 'Tak', 'Ne': 'Nie',
            'Věštění & Energie': 'Wróżby i energia', 'Tarot & Výklady': 'Tarot i odczyty', 'Věštění z Run': 'Wróżby z run',
            'Křišťálová Koule': 'Kryształowa kula', 'Šamanské Kolo': 'Koło szamańskie', 'Hvězdný Průvodce': 'Gwiezdny przewodnik',
            'Mystické Testy': 'Testy mistyczne', 'Mystický Blog': 'Blog mistyczny', 'Ezoterický Slovník': 'Słownik ezoteryczny',
            'Významy tarotových karet': 'Znaczenie kart tarota', 'Kontakt': 'Kontakt', 'Napsat podpoře': 'Napisz do pomocy',
            'FAQ (Časté dotazy)': 'FAQ (częste pytania)', 'Jak to funguje': 'Jak to działa', 'Jazykové verze': 'Wersje językowe',
            'Jazyk:': 'Język:', 'Čeština': 'Czeski', 'Slovenčina': 'Słowacki', 'Polski': 'Polski',
            '© 2026 Mystická Hvězda. Všechna práva vyhrazena.': '© 2026 Mystická Hvězda. Wszelkie prawa zastrzeżone.',
            'Podpora': 'Pomoc', 'Podpora:': 'Pomoc:', 'Obchodní podmínky': 'Warunki korzystania', 'Ochrana soukromí': 'Ochrona prywatności',
            'Cookies používáme pro chod webu a volitelnou analytiku.': 'Używamy plików cookie do działania serwisu i opcjonalnej analityki.',
            'Nezbytné': 'Niezbędne', 'Analytické': 'Analityczne', 'Marketingové': 'Marketingowe',
            'Odmítnout vše': 'Odrzuć wszystkie', 'Uložit nastavení': 'Zapisz ustawienia', 'Nastavení': 'Ustawienia', 'Souhlasím se vším': 'Akceptuję wszystkie',
            'Otevírá českou stránku': 'Otwiera stronę w języku czeskim'
        }
    };
    const copy = labels[locale];
    const localTargets = {
        '/': `/${locale}/`, '/index.html': `/${locale}/`,
        '/horoskopy.html': `/${locale}/horoskopy.html`, '/tarot.html': `/${locale}/tarot.html`,
        '/natalni-karta.html': `/${locale}/natalni-karta.html`, '/andelske-karty.html': `/${locale}/andelske-karty.html`,
        '/kristalova-koule.html': `/${locale}/kristalova-koule.html`
    };
    if (locale === 'sk') localTargets['/tarot-ano-ne.html'] = '/sk/tarot-ano-nie.html';

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        const normalized = node.nodeValue.trim().replace(/\s+/g, ' ');
        if (!Object.prototype.hasOwnProperty.call(copy, normalized)) continue;
        const leading = node.nodeValue.match(/^\s*/)[0];
        const trailing = node.nodeValue.match(/\s*$/)[0];
        node.nodeValue = `${leading}${copy[normalized]}${trailing}`;
    }

    root.querySelectorAll('a[href^="/"]').forEach((link) => {
        const href = link.getAttribute('href');
        if (link.hasAttribute('hreflang') || link.hasAttribute('lang') || href.startsWith('//')) return;
        const target = localTargets[href];
        if (target) {
            link.setAttribute('href', target);
            link.removeAttribute('lang');
            link.removeAttribute('title');
        } else {
            link.setAttribute('hreflang', 'cs');
            link.setAttribute('title', copy['Otevírá českou stránku']);
        }
    });

    root.querySelectorAll('[aria-label]').forEach((element) => {
        const label = element.getAttribute('aria-label');
        if (copy[label]) element.setAttribute('aria-label', copy[label]);
    });
    root.querySelectorAll('[alt]').forEach((element) => {
        const alt = element.getAttribute('alt');
        if (copy[alt]) element.setAttribute('alt', copy[alt]);
    });

    // cookie-handler.js updates this control after the component is inserted.
    const saveButton = root.querySelector('#cookie-save');
    if (saveButton && !saveButton.dataset.localeObserver) {
        saveButton.dataset.localeObserver = 'true';
        new MutationObserver(() => {
            const source = saveButton.textContent.trim();
            if (copy[source]) saveButton.textContent = copy[source];
        }).observe(saveButton, { childList: true, characterData: true, subtree: true });
    }
}

function getSharedShellCopy(locale) {
    if (locale === 'sk') return { open: 'Otvoriť hlavné menu', close: 'Zavrieť hlavné menu' };
    if (locale === 'pl') return { open: 'Otwórz menu główne', close: 'Zamknij menu główne' };
    return { open: 'Otevřít hlavní menu', close: 'Zavřít hlavní menu' };
}

/**
 * Standalone header initialization - works without ES module imports.
 * Handles: hamburger toggle, nav dropdown, scroll effect, escape key.
 */
function initStandaloneHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    // Prevent double-init if main.js already initialized
    if (header.dataset.headerInitialized === 'true') return;
    header.dataset.headerInitialized = 'true';

    // === SCROLL EFFECT ===
    let ticking = false;
    function handleScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Avoid an eager scrollY read during startup; the next scroll event applies
    // the compact header state without forcing first-paint layout.

    // === HAMBURGER MENU ===
    const toggle = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');
    if (!toggle || !navList) return;

    // Prevent double initialization of mobile nav
    if (toggle.dataset.navInitialized === 'true') return;
    toggle.dataset.navInitialized = 'true';

    const isMobileNav = () => window.matchMedia('(max-width: 992px)').matches;
    const dropdownItems = Array.from(navList.querySelectorAll('.nav__item--has-dropdown'));
    const closeDropdowns = (except = null) => {
        dropdownItems.forEach((item) => {
            if (item === except) return;
            item.classList.remove('is-active');
            item.querySelector('.nav__link--dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        });
    };
    const setDropdownOpen = (item, open) => {
        if (!item) return;
        closeDropdowns(open ? item : null);
        item.classList.toggle('is-active', open);
        item.querySelector('.nav__link--dropdown-toggle')?.setAttribute('aria-expanded', String(open));
    };
    const menuCopy = getSharedShellCopy(document.documentElement.lang);
    const setMenuOpen = (open, focusFirstLink = false) => {
        navList.classList.toggle('open', open);
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? menuCopy.close : menuCopy.open);
        document.body.classList.toggle('nav-open', open);

        if (isMobileNav()) {
            navList.setAttribute('aria-hidden', String(!open));
            navList.inert = !open;
        } else {
            navList.removeAttribute('aria-hidden');
            navList.inert = false;
        }

        if (!open) closeDropdowns();
        if (open && focusFirstLink) {
            navList.querySelector('a, button')?.focus({ preventScroll: true });
        }
    };
    const syncNavA11y = () => {
        if (isMobileNav()) {
            navList.setAttribute('aria-hidden', String(!navList.classList.contains('open')));
            navList.inert = !navList.classList.contains('open');
            return;
        }
        if (navList.classList.contains('open')) setMenuOpen(false);
        navList.removeAttribute('aria-hidden');
        navList.inert = false;
    };

    if (!navList.id) navList.id = 'primary-navigation';
    toggle.setAttribute('aria-controls', navList.id);
    toggle.setAttribute('aria-label', navList.classList.contains('open') ? menuCopy.close : menuCopy.open);
    syncNavA11y();

    dropdownItems.forEach((item, index) => {
        const toggleLink = item.querySelector('.nav__link--dropdown-toggle');
        const dropdown = item.querySelector('.nav__dropdown');
        if (!toggleLink || !dropdown) return;

        if (!dropdown.id) dropdown.id = `nav-dropdown-${index + 1}`;
        toggleLink.setAttribute('aria-haspopup', 'true');
        toggleLink.setAttribute('aria-expanded', 'false');
        toggleLink.setAttribute('aria-controls', dropdown.id);

        item.addEventListener('mouseenter', () => {
            if (!isMobileNav()) setDropdownOpen(item, true);
        });
        item.addEventListener('mouseleave', () => {
            if (!isMobileNav() && !item.contains(document.activeElement)) setDropdownOpen(item, false);
        });
        item.addEventListener('focusout', (event) => {
            if (isMobileNav() || item.contains(event.relatedTarget)) return;
            setDropdownOpen(item, false);
        });
    });

    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        setMenuOpen(!navList.classList.contains('open'), true);
    });

    // Dropdown buttons work the same with click, Enter and Space on every viewport.
    navList.querySelectorAll('.nav__link--dropdown-toggle').forEach(toggleLink => {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const item = toggleLink.closest('.nav__item--has-dropdown');
            if (!item) return;
            const isOpen = item.classList.contains('is-active');
            setDropdownOpen(item, !isOpen);
        });

        toggleLink.addEventListener('keydown', (e) => {
            if (e.key === ' ' && toggleLink.tagName !== 'BUTTON') { e.preventDefault(); toggleLink.click(); return; }
            if (e.key !== 'ArrowDown') return;
            e.preventDefault();
            const item = toggleLink.closest('.nav__item--has-dropdown');
            setDropdownOpen(item, true);
            item?.querySelector('.nav__dropdown-link')?.focus({ preventScroll: true });
        });
    });

    // Close menu when clicking a nav dropdown link (actual page link)
    navList.querySelectorAll('.nav__dropdown-link').forEach(link => {
        link.addEventListener('click', () => {
            setMenuOpen(false);
        });
    });

    // Close menu when clicking a nav link (ignore dropdown toggles)
    navList.querySelectorAll('.nav__link:not(.nav__link--dropdown-toggle)').forEach(link => {
        link.addEventListener('click', () => {
            setMenuOpen(false);
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (header.contains(e.target)) return;
        closeDropdowns();
        if (navList.classList.contains('open')) setMenuOpen(false);
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const expandedDropdown = navList.querySelector('.nav__link--dropdown-toggle[aria-expanded="true"]');
        if (isMobileNav() && navList.classList.contains('open')) {
            setMenuOpen(false);
            toggle.focus();
        } else if (expandedDropdown) {
            closeDropdowns();
            expandedDropdown.focus();
        }
    });

    navList.dataset.dropdownsReady = 'true';
    window.addEventListener('resize', syncNavA11y);

    initLanguageSwitcher();

}

/**
 * Language switcher logic
 */
function initLanguageSwitcher() {
    const switcher = document.querySelector('.lang-switcher');
    if (!switcher) return;

    const btn = switcher.querySelector('.lang-switcher__btn');
    const links = switcher.querySelectorAll('.lang-switcher__link');
    const currentText = switcher.querySelector('.lang-switcher__current');

    // Detect current language from URL
    const path = window.location.pathname;
    let currentLang = 'cs';
    if (path.includes('/sk/')) currentLang = 'sk';
    else if (path.includes('/pl/')) currentLang = 'pl';

    // Update UI initial state
    const langMap = { 'cs': 'CZ', 'sk': 'SK', 'pl': 'PL' };
    if (currentText) currentText.textContent = langMap[currentLang];

    links.forEach(link => {
        const linkLang = link.dataset.lang;
        if (linkLang === currentLang) {
            link.classList.add('active');
            // Also update the button text to match the active language just in case
            if (currentText) currentText.textContent = langMap[linkLang];
        } else {
            link.classList.remove('active');
        }
    });

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        switcher.classList.toggle('open');
    });

    // Close on click outside
    document.addEventListener('click', () => switcher.classList.remove('open'));

    // Handle language change
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetLang = link.dataset.lang;
            if (targetLang === currentLang) return;

            localStorage.setItem('mh_lang_pref', targetLang);
            
            // Generate target URL
            let newPath = window.location.pathname;
            const fileName = newPath.split('/').pop() || 'index.html';
            
            // Remove existing lang prefix
            newPath = newPath.replace(/\/(sk|pl)\//, '/');
            
            if (targetLang === 'cs') {
                // To root or CZ version (already handled by replace)
                window.location.href = newPath;
            } else {
                // To subdirectory
                // Handle local file protocol vs server
                if (window.location.protocol === 'file:') {
                    const baseMatch = newPath.match(/(.*\/MystickaHvezda\/)/);
                    if (baseMatch) {
                        window.location.href = baseMatch[1] + targetLang + '/' + fileName;
                    } else {
                        window.location.href = './' + targetLang + '/' + fileName;
                    }
                } else {
                    window.location.href = '/' + targetLang + '/' + fileName;
                }
            }
        });
    });
}
