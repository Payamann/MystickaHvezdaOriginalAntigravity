/**
 * Google Analytics 4 — Consent Mode v2
 * Tag vždy přítomen (Google ho vidí), data se posílají jen po souhlasu (GDPR).
 */

(function () {
    const GA_ID = 'G-VZ3J109ZYJ';

    // Inicializace dataLayer a gtag stub
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    // Consent Mode v2 — výchozí stav: vše zamítnuto (GDPR)
    gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'wait_for_update': 500
    });

    gtag('js', new Date());
    gtag('config', GA_ID, { 'anonymize_ip': true });

    // Pokud uživatel již dříve souhlasil — okamžitě povol
    try {
        const prefs = JSON.parse(localStorage.getItem('mh_cookie_prefs') || '{}');
        if (prefs.analytics) {
            gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
            });
        }
    } catch (e) {}

    // Načti GA4 skript po načtení stránky (neblokuje render)
    window.addEventListener('load', function () {
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(script);
    }, { once: true });

    // Naslouchej budoucím souhlasům (cookie banner)
    window.addEventListener('mh_cookie_consent', function (e) {
        if (e.detail && e.detail.analytics) {
            gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
            });
        }
    });
})();
