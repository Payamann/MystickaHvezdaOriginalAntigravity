// Decorative rendering of an already calculated phase. No astronomy calculation here.
(function () {
    const icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
    const namespace = 'http://www.w3.org/2000/svg';
    function render(element, icon, label = 'Fáze Měsíce') {
        if (!element) return;
        const phase = icons.indexOf(icon);
        if (phase < 0) { element.textContent = icon || ''; return; }
        const svg = document.createElementNS(namespace, 'svg');
        svg.setAttribute('viewBox', '0 0 120 120');
        svg.setAttribute('class', 'mh-moon-art');
        svg.setAttribute('width', '120');
        svg.setAttribute('height', '120');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const use = document.createElementNS(namespace, 'use');
        use.setAttribute('href', `/img/icons/moon-phases.svg#moon-${phase}`);
        svg.append(use);
        element.replaceChildren(svg);
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', label);
    }
    window.MH_MOON_ART = { render };
})();
