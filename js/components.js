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
        pg.src = basePath + 'js/dist/premium-gates.js?v=20261010-membership-gate-copy';
        pg.defer = true;
        document.head.appendChild(pg);
    }
})();

/* global MH_BUILD_LOCALIZED_ROUTES */
const LOCALIZED_SHELL = {
    sk: {
        suffix: ' (CZ)',
        routes: {
            '/index.html': '/sk/',
            '/horoskopy.html': '/sk/horoskopy.html',
            '/andelske-karty.html': '/sk/andelske-karty.html',
            '/kristalova-koule.html': '/sk/kristalova-koule.html',
            '/natalni-karta.html': '/sk/natalni-karta.html',
            '/tarot.html': '/sk/tarot.html',
            '/tarot-ano-ne.html': '/sk/tarot-ano-nie.html'
        },
        labels: {
            'Domů': 'Domov', 'Astrologie': 'Astrológia', 'Věštění & Tarot': 'Veštenie a tarot',
            'Čísla & Energie': 'Čísla a energia', 'Poznání': 'Poznanie', 'Členství': 'Členstvo',
            'Horoskopy': 'Horoskopy', 'Znamení zvěrokruhu': 'Znamenia zverokruhu',
            'Natální Karta': 'Natálna karta', 'Lunární Fáze': 'Lunárne fázy', 'Lunární Rituál': 'Lunárny rituál',
            'Astro Mapa': 'Astro mapa', 'Partnerská Shoda': 'Partnerská zhoda', 'Čínský Horoskop': 'Čínsky horoskop',
            'Minulý Život': 'Minulý život', 'Tarot': 'Tarot', 'Tarot karta dne': 'Tarotová karta dňa',
            'Tarot 3 karty': 'Tarot na tri karty', 'Keltský kříž': 'Keltský kríž', 'Tarot na lásku': 'Tarot na lásku',
            'Tarot ANO nebo NE': 'Tarot ÁNO alebo NIE', 'Významy karet': 'Významy tarotových kariet',
            'Andělské Karty': 'Anjelské karty', 'Andělská Pošta': 'Anjelská pošta', 'Věštění z Run': 'Výklad z rún',
            'Křišťálová Koule': 'Krištáľová guľa', 'Lexikon Snů (Snář)': 'Snár', 'Šamanské Kolo': 'Šamanské koleso',
            'Numerologie': 'Numerológia', 'Kalkulačka čísla osudu': 'Kalkulačka čísla osudu',
            'Aura Kalkulačka': 'Kalkulačka aury', 'Denní Afirmace': 'Denné afirmácie', 'Databáze Jmen': 'Databáza mien',
            'Biorytmy': 'Bioritmy', 'Ezoterický Slovník': 'Ezoterický slovník', 'Mystické Testy': 'Mystické testy',
            'Mystický Blog': 'Mystický blog', 'Časté otázky': 'Časté otázky', 'O nás': 'O nás',
            'Osobní mapa na 12 měsíců': 'Osobná mapa na 12 mesiacov', 'Průvodce': 'Sprievodca',
            'Ceník členství': 'Cenník členstva', 'Profil': 'Profil', 'Registrace': 'Registrácia', 'Přihlásit se': 'Prihlásiť sa',
            'Tarot & Výklady': 'Tarot a výklady', 'Významy tarotových karet': 'Významy tarotových kariet',
            'Ceník': 'Cenník', 'Napsat podpoře': 'Napísať podpore', 'Kontakt': 'Kontakt',
            'Hvězdný Průvodce': 'Hviezdny sprievodca', 'Aura kalkulačka': 'Kalkulačka aury',
            'FAQ (Časté dotazy)': 'FAQ (časté otázky)',
            'Jak to funguje': 'Ako to funguje', 'Obchodní podmínky': 'Obchodné podmienky', 'Ochrana soukromí': 'Ochrana súkromia',
            'Čeština': 'Čeština', 'Slovenčina': 'Slovenčina', 'Polski': 'Poľština'
        },
        text: {
            menu: 'Otvoriť hlavné menu', nav: 'Hlavná navigácia',
            footerDesc: 'Tarot a astrológia pre chvíle, keď hľadáš nový pohľad.',
            trust: 'Prevádzkovateľ služby Mystická Hvězda.', feedback: 'Pomohla ti táto stránka?', yes: 'Áno', no: 'Nie',
            copyright: `© ${new Date().getFullYear()} Mystická Hvězda. Všetky práva vyhradené.`, support: 'Podpora:', languages: 'Jazykové verzie',
            cookieText: 'Cookies používame na fungovanie webu a voliteľnú analytiku.', necessary: 'Nevyhnutné', analytics: 'Analytické',
            marketing: 'Marketingové', reject: 'Odmietnuť všetko', save: 'Uložiť nastavenia', accept: 'Súhlasím so všetkým',
            czechOnly: 'Odkaz vedie na stránku dostupnú iba v češtine.'
        }
    },
    pl: {
        suffix: ' (CZ)',
        routes: {
            '/index.html': '/pl/',
            '/horoskopy.html': '/pl/horoskopy.html',
            '/andelske-karty.html': '/pl/andelske-karty.html',
            '/kristalova-koule.html': '/pl/kristalova-koule.html',
            '/natalni-karta.html': '/pl/natalni-karta.html',
            '/tarot.html': '/pl/tarot.html'
        },
        labels: {
            'Domů': 'Strona główna', 'Astrologie': 'Astrologia', 'Věštění & Tarot': 'Wróżby i tarot',
            'Čísla & Energie': 'Liczby i energia', 'Poznání': 'Wiedza', 'Členství': 'Członkostwo',
            'Horoskopy': 'Horoskopy dzienne', 'Znamení zvěrokruhu': 'Znaki zodiaku', 'Natální Karta': 'Kosmogram',
            'Lunární Fáze': 'Fazy Księżyca', 'Lunární Rituál': 'Rytuał księżycowy', 'Astro Mapa': 'Mapa astrologiczna',
            'Partnerská Shoda': 'Dopasowanie partnerskie', 'Čínský Horoskop': 'Horoskop chiński', 'Minulý Život': 'Poprzednie życie',
            'Tarot': 'Tarot', 'Tarot karta dne': 'Karta tarota na dziś', 'Tarot 3 karty': 'Tarot trzy karty',
            'Keltský kříž': 'Krzyż celtycki', 'Tarot na lásku': 'Tarot miłosny', 'Tarot ANO nebo NE': 'Tarot TAK czy NIE',
            'Významy karet': 'Znaczenie kart tarota', 'Andělské Karty': 'Karty anielskie', 'Andělská Pošta': 'Poczta anielska',
            'Věštění z Run': 'Wróżby z run', 'Křišťálová Koule': 'Kryształowa kula', 'Lexikon Snů (Snář)': 'Sennik',
            'Šamanské Kolo': 'Koło szamańskie', 'Numerologie': 'Numerologia', 'Kalkulačka čísla osudu': 'Kalkulator liczby życia',
            'Aura Kalkulačka': 'Kalkulator aury', 'Denní Afirmace': 'Codzienne afirmacje', 'Databáze Jmen': 'Baza imion',
            'Biorytmy': 'Biorytmy', 'Ezoterický Slovník': 'Słownik ezoteryczny', 'Mystické Testy': 'Testy mistyczne',
            'Mystický Blog': 'Blog Mistycznej Gwiazdy', 'Časté otázky': 'Częste pytania', 'O nás': 'O nas',
            'Osobní mapa na 12 měsíců': 'Osobista mapa na 12 miesięcy', 'Průvodce': 'Gwiezdny przewodnik',
            'Ceník členství': 'Cennik członkostwa', 'Profil': 'Profil', 'Registrace': 'Rejestracja', 'Přihlásit se': 'Zaloguj się',
            'Tarot & Výklady': 'Tarot i rozkłady', 'Významy tarotových karet': 'Znaczenie kart tarota',
            'Ceník': 'Cennik', 'Napsat podpoře': 'Napisz do pomocy', 'Kontakt': 'Kontakt',
            'Hvězdný Průvodce': 'Gwiezdny przewodnik',
            'Aura kalkulačka': 'Kalkulator aury', 'FAQ (Časté dotazy)': 'FAQ (częste pytania)',
            'Jak to funguje': 'Jak to działa', 'Obchodní podmínky': 'Regulamin', 'Ochrana soukromí': 'Polityka prywatności',
            'Čeština': 'Czeski', 'Slovenčina': 'Słowacki', 'Polski': 'Polski'
        },
        text: {
            menu: 'Otwórz główne menu', nav: 'Nawigacja główna',
            footerDesc: 'Tarot i astrologia, gdy szukasz nowego spojrzenia.',
            trust: 'Operator serwisu Mystická Hvězda.', feedback: 'Czy ta strona była pomocna?', yes: 'Tak', no: 'Nie',
            copyright: `© ${new Date().getFullYear()} Mystická Hvězda. Wszelkie prawa zastrzeżone.`, support: 'Pomoc:', languages: 'Wersje językowe',
            cookieText: 'Używamy plików cookie, aby strona działała i do opcjonalnej analityki.', necessary: 'Niezbędne', analytics: 'Analityczne',
            marketing: 'Marketingowe', reject: 'Odrzuć wszystkie', save: 'Zapisz ustawienia', accept: 'Akceptuj wszystkie',
            czechOnly: 'Link prowadzi do strony dostępnej tylko po czesku.'
        }
    },
    en: {
        "suffix": " (CZ)",
        "routes": {
                "/index.html": "/en/",
                "/horoskopy.html": "/en/horoscopes.html",
                "/andelske-karty.html": "/en/angel-cards.html",
                "/kristalova-koule.html": "/en/crystal-ball.html",
                "/natalni-karta.html": "/en/birth-chart.html",
                "/tarot.html": "/en/tarot.html"
        },
        "labels": {
                "Domů": "Home",
                "Astrologie": "Astrology",
                "Věštění & Tarot": "Tarot",
                "Čísla & Energie": "Numbers",
                "Poznání": "Explore",
                "Členství": "Membership",
                "Horoskopy": "Horoscopes",
                "Znamení zvěrokruhu": "Zodiac signs",
                "Natální Karta": "Birth chart",
                "Lunární Fáze": "Moon phases",
                "Lunární Rituál": "Moon rituals",
                "Astro Mapa": "Astrology map",
                "Partnerská Shoda": "Relationship compatibility",
                "Čínský Horoskop": "Chinese horoscope",
                "Minulý Život": "Past life",
                "Tarot": "Tarot",
                "Tarot karta dne": "Daily tarot card",
                "Tarot 3 karty": "Three-card tarot",
                "Keltský kříž": "Celtic cross",
                "Tarot na lásku": "Love tarot",
                "Tarot ANO nebo NE": "Yes or no tarot",
                "Významy karet": "Tarot card meanings",
                "Andělské Karty": "Angel cards",
                "Andělská Pošta": "Angel messages",
                "Věštění z Run": "Rune readings",
                "Křišťálová Koule": "Crystal ball",
                "Lexikon Snů (Snář)": "Dream dictionary",
                "Šamanské Kolo": "Medicine wheel",
                "Numerologie": "Numerology",
                "Kalkulačka čísla osudu": "Life path calculator",
                "Aura Kalkulačka": "Aura calculator",
                "Denní Afirmace": "Daily affirmations",
                "Databáze Jmen": "Name meanings",
                "Biorytmy": "Biorhythms",
                "Ezoterický Slovník": "Symbolism glossary",
                "Mystické Testy": "Quizzes",
                "Mystický Blog": "Blog",
                "Časté otázky": "Frequently asked questions",
                "O nás": "About us",
                "Osobní mapa na 12 měsíců": "Personal 12-month map",
                "Průvodce": "Guide",
                "Ceník členství": "Membership pricing",
                "Profil": "Profile",
                "Registrace": "Sign up",
                "Přihlásit se": "Sign in",
                "Tarot & Výklady": "Tarot and readings",
                "Významy tarotových karet": "Tarot card meanings",
                "Ceník": "Pricing",
                "Napsat podpoře": "Contact support",
                "Kontakt": "Contact",
                "Hvězdný Průvodce": "Star Guide",
                "Aura kalkulačka": "Aura calculator",
                "FAQ (Časté dotazy)": "FAQ",
                "Jak to funguje": "How it works",
                "Obchodní podmínky": "Terms of service",
                "Ochrana soukromí": "Privacy",
                "Čeština": "Czech",
                "Slovenčina": "Slovak",
                "Polski": "Polish",
                "English": "English"
        },
        "text": {
                "menu": "Open main menu",
                "nav": "Main navigation",
                "footerDesc": "Tarot and astrology when you want a fresh perspective.",
                "trust": "Operator of the Mystická Hvězda service.",
                "feedback": "Was this page helpful?",
                "yes": "Yes",
                "no": "No",
                "copyright": "© 2026 Mystická Hvězda. All rights reserved.",
                "support": "Support:",
                "languages": "Language versions",
                "cookieText": "We use cookies to make the website work and for optional analytics.",
                "necessary": "Necessary",
                "analytics": "Analytics",
                "marketing": "Marketing",
                "reject": "Reject all",
                "save": "Save settings",
                "accept": "Accept all",
                "czechOnly": "This link opens a page currently available only in Czech."
        }
}
};

// Injected from the publication manifest by build-js. Raw development scripts
// retain the existing route table; public builds include generated pages too.
const generatedLocaleRoutes = typeof MH_BUILD_LOCALIZED_ROUTES === 'undefined' ? {} : MH_BUILD_LOCALIZED_ROUTES;
Object.entries(generatedLocaleRoutes).forEach(([locale, routes]) => {
    if (LOCALIZED_SHELL[locale]) Object.assign(LOCALIZED_SHELL[locale].routes, routes);
});

function setLocalizedText(element, value) {
    if (!element || !value) return;
    const textNodes = Array.from(element.childNodes).filter((node) =>
        node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    if (textNodes.length) {
        const textNode = textNodes[textNodes.length - 1];
        textNode.textContent = element.querySelector('svg') ? ` ${value}` : value;
    } else {
        element.textContent = value;
    }
}

function localizeSharedShell(placeholder, elementId, locale) {
    const config = LOCALIZED_SHELL[locale];
    if (!config) return;


    const headerLabelAliases = {'Tarot a výklady': 'Věštění & Tarot', 'Čísla a energie': 'Čísla & Energie', 'Natální karta': 'Natální Karta', 'Lunární kalendář': 'Lunární Fáze', 'Lunární rituály': 'Lunární Rituál', 'Astro mapa': 'Astro Mapa', 'Partnerská shoda': 'Partnerská Shoda', 'Čínský horoskop': 'Čínský Horoskop', 'Minulý život': 'Minulý Život', 'Andělské karty': 'Andělské Karty', 'Andělská pošta': 'Andělská Pošta', 'Runy': 'Věštění z Run', 'Křišťálová koule': 'Křišťálová Koule', 'Snář': 'Lexikon Snů (Snář)', 'Šamanské kolo': 'Šamanské Kolo', 'Výpočet aury': 'Aura Kalkulačka', 'Denní afirmace': 'Denní Afirmace', 'Významy jmen': 'Databáze Jmen', 'Slovník pojmů': 'Ezoterický Slovník', 'Testy': 'Mystické Testy', 'Blog': 'Mystický Blog', 'Tarot ano/ne': 'Tarot ANO nebo NE'};
    Object.entries(headerLabelAliases).forEach(([label, original]) => {
        if (config.labels[original]) config.labels[label] = config.labels[original];
    });
    if (elementId === 'header-placeholder') {
        const toggle = placeholder.querySelector('.nav__toggle');
        if (toggle) toggle.setAttribute('aria-label', config.text.menu);
        const nav = placeholder.querySelector('.nav');
        if (nav) nav.setAttribute('aria-label', config.text.nav);
        const logoLink = placeholder.querySelector('a.logo');
        const localizedHome = config.routes['/index.html'];
        if (logoLink && localizedHome) logoLink.setAttribute('href', localizedHome);
        placeholder.querySelectorAll('.logo__image').forEach((image) => {
            image.alt = '';
        });

        placeholder.querySelectorAll('.nav__link--dropdown-toggle').forEach((link) => {
            const label = link.childNodes[0]?.textContent.trim();
            if (config.labels[label]) setLocalizedText(link, config.labels[label]);
        });
    } else if (elementId === 'footer-placeholder') {
        const setText = (selector, value) => {
            const element = placeholder.querySelector(selector);
            if (element) setLocalizedText(element, value);
        };
        setText('.footer__desc', config.text.footerDesc);
        setText('.footer__trust-note', config.text.trust);
        setText('.footer-feedback > p', config.text.feedback);
        placeholder.querySelectorAll('[data-feedback-value="yes"]').forEach((button) => setLocalizedText(button, config.text.yes));
        placeholder.querySelectorAll('[data-feedback-value="no"]').forEach((button) => setLocalizedText(button, config.text.no));
        placeholder.querySelectorAll('.footer__title').forEach((title, index) => {
            const translated = locale === 'sk'
                ? ['Astrológia', 'Veštenie a energia', 'Poznanie', 'Podpora'][index]
                : locale === 'pl' ? ['Astrologia', 'Wróżby i energia', 'Wiedza', 'Pomoc'][index]
                : ['Astrology', 'Readings and symbolism', 'Explore', 'Support'][index];
            if (translated) setLocalizedText(title, translated);
        });
        const copyright = placeholder.querySelector('.footer__bottom > p');
        if (copyright) copyright.textContent = config.text.copyright;
        const supportLine = placeholder.querySelector('.footer__support-line');
        if (supportLine) {
            const node = Array.from(supportLine.childNodes).find((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
            if (node) node.textContent = ` ${config.text.support} `;
        }
        const supportEmailLink = placeholder.querySelector('.footer__support-email a');
        if (supportEmailLink) setLocalizedText(supportEmailLink, config.labels['Napsat podpoře']);
        const languages = placeholder.querySelector('.footer__languages');
        if (languages) {
            languages.setAttribute('aria-label', config.text.languages);
            const labelNode = Array.from(languages.childNodes).find((child) => child.nodeType === Node.TEXT_NODE && child.textContent.includes('Jazyk:'));
            if (labelNode) labelNode.textContent = locale === 'sk' ? ' Jazyk: ' : locale === 'pl' ? ' Język: ' : ' Language: ';
            languages.querySelectorAll('a').forEach((link) => {
                const lang = link.getAttribute('lang');
                if (lang === 'cs') setLocalizedText(link, config.labels['Čeština']);
                if (lang === 'sk') setLocalizedText(link, config.labels['Slovenčina']);
                if (lang === 'pl') setLocalizedText(link, config.labels['Polski']);
            });
        }
        setText('.cookie-banner__text', config.text.cookieText);
        const cookieLabels = placeholder.querySelectorAll('.cookie-banner__preferences label');
        [config.text.necessary, config.text.analytics, config.text.marketing].forEach((label, index) => {
            if (cookieLabels[index]) setLocalizedText(cookieLabels[index], label);
        });
        [['#cookie-reject', config.text.reject], ['#cookie-save', config.text.save], ['#cookie-accept', config.text.accept]]
            .forEach(([selector, value]) => setText(selector, value));
    }

    const labels = config.labels;
    const localizedPaths = config.routes;
    placeholder.querySelectorAll('a[href^="/"]').forEach((link) => {
        if (link.closest('.footer__languages') || link.classList.contains('logo')) return;
        const href = link.getAttribute('href') || '';
        const pathEnd = href.search(/[?#]/);
        const path = pathEnd === -1 ? href : href.slice(0, pathEnd);
        const currentLabel = link.textContent.trim();
        const label = labels[currentLabel];
        const localizedPath = localizedPaths[path];
        if (localizedPath) {
            link.setAttribute('href', localizedPath + (pathEnd === -1 ? '' : href.slice(pathEnd)));
        }
        const alreadyLocalized = path.startsWith(`/${locale}/`);
        const isCzechOnly = !localizedPath && !alreadyLocalized;
        const displayLabel = label || currentLabel;
        if (isCzechOnly && displayLabel) {
            setLocalizedText(link, `${displayLabel}${config.suffix}`);
            link.setAttribute('aria-label', `${displayLabel}. ${config.text.czechOnly}`);
            link.setAttribute('title', config.text.czechOnly);
        } else if (label) {
            setLocalizedText(link, label);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Determine the base path based on where this script is loaded from
    // This allows the component loader to work correctly from subdirectories (like /blog/ or /sk/)
    const scriptTag = document.querySelector('script[src*="components.js"], script[src*="core.js"], script[src*="components.mh-"], script[src*="core.mh-"]');
    const scriptSrc = scriptTag ? scriptTag.getAttribute('src') : '';
    const basePath = scriptSrc.split(/js\/(?:dist\/)?(?:components|core)(?:\.mh-[a-f0-9]+)?\.js/)[0] || '';

    // Load header and footer in parallel for faster initial paint
    // Use high priority for header as it affects LCP/CLS
    await Promise.all([
        loadComponent('header-placeholder', `${basePath}components/header.html?v=20261026-language-navigation`, basePath, true),
        loadComponent('footer-placeholder', `${basePath}components/footer.html?v=20261026-language-navigation`, basePath, false)
    ]);

    // STANDALONE: Init hamburger menu + header scroll (no module dependency)
    // Must run BEFORE dispatching components:loaded, so navInitialized flag is set
    // before main.js's components:loaded listener calls initMobileNav().
    // This prevents the double-toggle bug caused by both handlers attaching a click listener.
    initStandaloneHeader();
    initLanguageSwitcher();

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

        const locale = document.documentElement.lang.slice(0, 2).toLowerCase();
        if (locale === 'sk' || locale === 'pl' || locale === 'en') {
            localizeSharedShell(element, elementId, locale);
        }

        if (elementId === 'footer-placeholder') {
            const mobileFooter = window.matchMedia('(max-width: 768px)');
            const disclosures = Array.from(element.querySelectorAll('.footer__disclosure'));
            const syncFooterDisclosure = () => {
                disclosures.forEach((disclosure) => {
                    disclosure.open = !mobileFooter.matches;
                });
            };
            syncFooterDisclosure();
            mobileFooter.addEventListener?.('change', syncFooterDisclosure);
        }

        // Replace the placeholder with the actual content
        element.replaceWith(...element.childNodes);

    } catch (error) {
        console.error(`Error loading component ${path}:`, error);
        element.innerHTML = `<div class="error-loading">Failed to load content.</div>`;
    }
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
    const setMenuOpen = (open, focusFirstLink = false) => {
        navList.classList.toggle('open', open);
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('nav-open', open);

        if (isMobileNav()) {
            navList.setAttribute('aria-hidden', String(!open));
        } else {
            navList.removeAttribute('aria-hidden');
        }

        if (!open) closeDropdowns();
        if (open && focusFirstLink) {
            navList.querySelector('a, button')?.focus({ preventScroll: true });
        }
    };
    const syncNavA11y = () => {
        if (isMobileNav() && !navList.classList.contains('open')) {
            navList.setAttribute('aria-hidden', 'true');
            return;
        }
        navList.removeAttribute('aria-hidden');
    };

    if (!navList.id) navList.id = 'primary-navigation';
    toggle.setAttribute('aria-controls', navList.id);
    syncNavA11y();

    dropdownItems.forEach((item, index) => {
        const toggleLink = item.querySelector('.nav__link--dropdown-toggle');
        const dropdown = item.querySelector('.nav__dropdown');
        if (!toggleLink || !dropdown) return;

        if (!dropdown.id) dropdown.id = `nav-dropdown-${index + 1}`;
        toggleLink.setAttribute('role', 'button');
        toggleLink.setAttribute('aria-haspopup', 'true');
        toggleLink.setAttribute('aria-expanded', 'false');
        toggleLink.setAttribute('aria-controls', dropdown.id);
    });

    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        setMenuOpen(!navList.classList.contains('open'), true);
    });

    // === MOBILE DROPDOWNS ===
    navList.querySelectorAll('.nav__link--dropdown-toggle').forEach(toggleLink => {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const item = toggleLink.closest('.nav__item--has-dropdown');
            if (!item) return;
            const isOpen = item.classList.contains('is-active');
            closeDropdowns(item);
            item.classList.toggle('is-active', !isOpen);
            toggleLink.setAttribute('aria-expanded', String(!isOpen));
        });

        toggleLink.addEventListener('keydown', (e) => {
            if (e.key !== ' ') return;
            e.preventDefault();
            toggleLink.click();
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
        if (!header.contains(e.target)) {
            closeDropdowns();
            if (navList.classList.contains('open')) setMenuOpen(false);
        }
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const activeDropdown = dropdownItems.find(item => item.classList.contains('is-active'));
        if (navList.classList.contains('open')) {
            setMenuOpen(false);
            toggle.focus();
        } else if (activeDropdown) {
            closeDropdowns();
            activeDropdown.querySelector('.nav__link--dropdown-toggle')?.focus();
        }
    });

    window.addEventListener('resize', syncNavA11y);

}

/**
 * Language switcher logic
 */
function initLanguageSwitcher() {
    const currentLang = document.documentElement.lang.slice(0, 2).toLowerCase() || 'cs';
    const homes = { cs: '/', sk: '/sk/', pl: '/pl/', en: '/en/' };
    const names = { cs: 'Čeština', sk: 'Slovenčina', pl: 'Polski', en: 'English' };
    const copy = {
        cs: { label: 'Jazyk stránky', home: 'úvod', fallback: 'Tato stránka v tomto jazyce zatím není dostupná. Odkaz vede na jazykový úvod.' },
        sk: { label: 'Jazyk stránky', home: 'úvod', fallback: 'Táto stránka v tomto jazyku zatiaľ nie je dostupná. Odkaz vedie na jazykový úvod.' },
        en: { label: 'Page language', home: 'home', fallback: 'This page is not yet available in this language. This link opens the language home page.' },
        pl: { label: 'Język strony', home: 'strona główna', fallback: 'Ta strona nie jest jeszcze dostępna w tym języku. Link prowadzi do strony głównej wybranej wersji.' }
    }[currentLang] || { label: 'Jazyk stránky', home: 'úvod', fallback: 'Odkaz vede na jazykový úvod.' };
    const equivalents = {};
    // Use the same canonical language set as search engines, rather than a
    // second route table which can invent missing translations or become stale.
    const canonical = document.querySelector('link[rel="canonical"]');
    const canonicalOrigin = canonical ? new URL(canonical.href, window.location.href).origin : window.location.origin;
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => {
        const lang = link.hreflang;
        if (!homes[lang]) return;
        const url = new URL(link.href, window.location.href);
        if (url.origin === canonicalOrigin && /^https?:$/.test(url.protocol)) equivalents[lang] = url.pathname;
    });
    // Untranslated pages keep their own current-language URL. Only languages
    // without an equivalent fall back to their home, labelled explicitly.
    equivalents[currentLang] ||= window.location.pathname;
    const destination = (lang) => equivalents[lang] || homes[lang];
    const label = (lang) => names[lang] + (equivalents[lang] ? '' : ` — ${copy.home}`);

    document.querySelectorAll('.footer__languages a[lang]').forEach((link) => {
        const lang = link.lang;
        if (!homes[lang]) return;
        link.href = destination(lang);
        link.textContent = label(lang);
        if (lang === currentLang) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
        if (!equivalents[lang]) link.title = copy.fallback;
        else link.removeAttribute('title');
    });
    document.querySelectorAll('[data-language-select]').forEach((select) => {
        select.setAttribute('aria-label', copy.label);
        Array.from(select.options).forEach((option) => {
            option.textContent = label(option.value);
            option.title = equivalents[option.value] ? names[option.value] : copy.fallback;
        });
        select.value = currentLang;
        if (select.dataset.languageInitialized === 'true') return;
        select.dataset.languageInitialized = 'true';
        select.addEventListener('change', () => {
            const target = destination(select.value);
            if (target && select.value !== currentLang) window.location.assign(target);
        });
    });
}
