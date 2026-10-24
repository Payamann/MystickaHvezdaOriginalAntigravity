// A shared, data-driven moon phase illustration for lunar tools.
(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const CENTER = 80;
    const RADIUS = 50;
    let nextGradientId = 0;

    function svgElement(name, attributes = {}) {
        const element = document.createElementNS(SVG_NS, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
        return element;
    }

    function createSvg(phaseFraction, className = 'moon-phase-illustration') {
        const numericPhase = Number(phaseFraction);
        const phase = Number.isFinite(numericPhase) ? ((numericPhase % 1) + 1) % 1 : 0;
        const waxing = phase < 0.5;
        const terminatorRadius = Math.abs(Math.cos(phase * 2 * Math.PI)) * RADIUS;
        const outerSweep = waxing ? 1 : 0;
        const innerSweep = waxing
            ? (phase < 0.25 ? 0 : 1)
            : (phase < 0.75 ? 0 : 1);
        const top = CENTER - RADIUS;
        const bottom = CENTER + RADIUS;
        const gradientId = `mh-moon-phase-light-${++nextGradientId}`;

        const svg = svgElement('svg', {
            class: className,
            viewBox: '0 0 160 160',
            role: 'presentation',
            'aria-hidden': 'true',
            focusable: 'false'
        });

        const defs = svgElement('defs');
        const gradient = svgElement('linearGradient', {
            id: gradientId,
            x1: '0%',
            y1: '0%',
            x2: '100%',
            y2: '100%'
        });
        gradient.append(
            svgElement('stop', { offset: '0%', 'stop-color': '#eee1c5' }),
            svgElement('stop', { offset: '100%', 'stop-color': '#bd9b65' })
        );
        defs.appendChild(gradient);
        svg.appendChild(defs);

        svg.append(
            svgElement('circle', {
                cx: CENTER,
                cy: CENTER,
                r: 62,
                fill: 'none',
                stroke: '#bd9b65',
                'stroke-opacity': '0.19',
                'stroke-width': '1'
            }),
            svgElement('circle', {
                cx: CENTER,
                cy: CENTER,
                r: RADIUS,
                fill: '#102638',
                stroke: '#bd9b65',
                'stroke-opacity': '0.64',
                'stroke-width': '1.5'
            })
        );

        const litSide = `M ${CENTER} ${top} A ${RADIUS} ${RADIUS} 0 0 ${outerSweep} ${CENTER} ${bottom} A ${terminatorRadius.toFixed(3)} ${RADIUS} 0 0 ${innerSweep} ${CENTER} ${top} Z`;
        svg.append(
            svgElement('path', { d: litSide, fill: `url(#${gradientId})` }),
            svgElement('circle', {
                cx: CENTER,
                cy: CENTER,
                r: RADIUS,
                fill: 'none',
                stroke: '#bd9b65',
                'stroke-opacity': '0.5',
                'stroke-width': '0.75'
            })
        );

        return svg;
    }

    function render(container, phaseFraction) {
        if (!container) return;
        container.replaceChildren(createSvg(phaseFraction));
    }

    window.MHMoonPhaseIllustration = Object.freeze({ createSvg, render });
})();
