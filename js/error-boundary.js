/**
 * Mystická Hvězda - Global Error Boundary
 * Prevents application crashes from showing a blank screen.
 */
(function() {
    window.addEventListener('error', function(event) {
        console.error('Captured Global Error:', event.error);
        showErrorUI(event.message);
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Captured Async Error:', event.reason);
        showErrorUI('Problém s připojením k vesmírným serverům.');
    });

    function showErrorUI(message) {
        // Only show if it's a critical breakage (no other content visible)
        const root = document.querySelector('main') || document.body;
        if (root && root.innerHTML.length < 500) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mh-error-boundary';
            
            errorDiv.innerHTML = `
                <div class="mh-error-boundary__panel">
                    <h1 class="mh-error-boundary__title">Omlouváme se, hvězdy jsou dočasně v mlze.</h1>
                    <p class="mh-error-boundary__text">
                        Došlo k nečekané technické chybě. Naši mágové na nápravě již pracují.
                    </p>
                    <button id="mh-error-reload" class="mh-error-boundary__button" type="button">
                        Zkusit znovu spojení
                    </button>
                    <a href="/" class="mh-error-boundary__link">Zpět na hlavní bránu</a>
                </div>
            `;
            document.body.appendChild(errorDiv);
            document.getElementById('mh-error-reload')?.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }
})();
