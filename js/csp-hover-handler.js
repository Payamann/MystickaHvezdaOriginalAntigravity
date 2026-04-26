/**
 * CSP Compliance: Convert inline onmouseover/onmouseout to CSS hover
 * This script runs on all pages and converts hover handlers to use CSS classes
 * to remove the need for 'unsafe-inline' in CSP
 */

(function() {
    // Convert elements with onmouseover/onmouseout to use CSS classes
    function convertHoverHandlers() {
        const elementsWithHover = document.querySelectorAll('[onmouseover], [onmouseout]');

        elementsWithHover.forEach(el => {
            const onmouseover = el.getAttribute('onmouseover');
            const onmouseout = el.getAttribute('onmouseout');

            // Check if this is a card hover pattern
            if (onmouseover && (
                onmouseover.includes("translateY(-3px)") ||
                onmouseover.includes("transform")
            )) {
                el.classList.add('card-hover');
                el.removeAttribute('onmouseover');
                el.removeAttribute('onmouseout');
            }
            // For other inline handlers, keep them (will be refactored per page)
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', convertHoverHandlers);
    } else {
        convertHoverHandlers();
    }

    // Also run on dynamic content
    const observer = new MutationObserver(convertHoverHandlers);
    observer.observe(document.body, { childList: true, subtree: true });
})();
