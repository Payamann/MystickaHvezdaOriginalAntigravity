(function () {
    const nonCriticalScripts = [
        'js/dist/nav-failsafe.js',
        'js/dist/exit-intent.js',
        'js/newsletter-popup.js?v=6',
        'js/push-notifications.js?v=5',
        'js/retention.js?v=7'
    ];

    function loadScript(src) {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        document.body.appendChild(script);
    }

    function loadNonCriticalScripts() {
        nonCriticalScripts.forEach(loadScript);
    }

    let nonCriticalLoaded = false;
    function loadNonCriticalOnce() {
        if (nonCriticalLoaded) return;
        nonCriticalLoaded = true;
        loadNonCriticalScripts();
    }

    function scheduleLoad() {
        ['pointerdown', 'keydown', 'scroll'].forEach((eventName) => {
            window.addEventListener(eventName, loadNonCriticalOnce, { once: true, passive: true });
        });

        window.setTimeout(loadNonCriticalOnce, 15000);
    }

    function sendPersonalMapFunnelEvent(eventName, source, metadata = {}) {
        const sender = window.Auth?.sendServerFunnelEvent;
        if (typeof sender !== 'function') return;
        void sender.call(window.Auth, {
            eventName,
            source,
            feature: 'osobni_mapa_2026',
            planId: 'osobni_mapa_2026',
            planType: 'personal_map',
            metadata: {
                product_id: 'osobni_mapa_2026',
                product_type: 'personal_map',
                path: window.location.pathname,
                ...metadata
            }
        });
    }

    function initPersonalMapFunnel() {
        const section = document.getElementById('osobni-mapa-preview');
        if (!section) return;

        let viewTracked = false;
        const trackView = () => {
            if (viewTracked) return;
            viewTracked = true;
            sendPersonalMapFunnelEvent('one_time_product_viewed', 'homepage_spotlight_view', {
                placement: 'homepage_spotlight'
            });
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                if (!entries.some(entry => entry.isIntersecting)) return;
                observer.disconnect();
                trackView();
            }, { threshold: 0.35 });
            observer.observe(section);
        }

        section.addEventListener('click', event => {
            const link = event.target.closest('a[href*="osobni-mapa.html"]');
            if (!link) return;
            sendPersonalMapFunnelEvent('pricing_product_cta_clicked', link.href.includes('preview')
                ? 'homepage_spotlight_preview'
                : 'homepage_spotlight', {
                placement: 'homepage_spotlight',
                destination: link.getAttribute('href')
            });
        });
    }

    if (document.readyState === 'complete') {
        scheduleLoad();
    } else {
        window.addEventListener('load', scheduleLoad, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPersonalMapFunnel, { once: true });
    } else {
        initPersonalMapFunnel();
    }
})();
