/**
 * Mystická Hvězda - Global Error Boundary
 * Prevents application crashes from showing a blank screen.
 */
(function() {
    window.addEventListener('error', function(event) {
        console.error('Captured Global Error:', event.error);
        showErrorUI();
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Captured Async Error:', event.reason);
        showErrorUI();
    });

    function showErrorUI() {
        // Only show if it's a critical breakage (no other content visible)
        const root = document.querySelector('main') || document.body;
        if (root && root.innerHTML.length < 500) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mh-error-boundary';
            
            errorDiv.innerHTML = `
                <div class="mh-error-boundary__panel">
                    <h1 class="mh-error-boundary__title">Stránku se nepodařilo načíst.</h1>
                    <p class="mh-error-boundary__text">
                        Může jít o krátký výpadek. Zkus stránku obnovit; pokud potíže přetrvají, vrať se později.
                    </p>
                    <button id="mh-error-reload" class="mh-error-boundary__button" type="button">
                        Obnovit stránku
                    </button>
                    <a href="/" class="mh-error-boundary__link">Zpět na hlavní stránku</a>
                </div>
            `;
            document.body.appendChild(errorDiv);
            document.getElementById('mh-error-reload')?.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }
})();
