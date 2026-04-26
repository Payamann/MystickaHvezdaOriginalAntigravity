(function () {
    const nonCriticalScripts = [
        'js/dist/exit-intent.js',
        'js/newsletter-popup.js?v=5',
        'js/push-notifications.js?v=5',
        'js/retention.js?v=6'
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

    function scheduleLoad() {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(loadNonCriticalScripts, { timeout: 3000 });
            return;
        }

        window.setTimeout(loadNonCriticalScripts, 1200);
    }

    if (document.readyState === 'complete') {
        scheduleLoad();
    } else {
        window.addEventListener('load', scheduleLoad, { once: true });
    }
})();
