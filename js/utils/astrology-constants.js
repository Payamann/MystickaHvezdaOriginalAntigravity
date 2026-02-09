/**
 * Shared astrology constants - single source of truth
 * Used by natal-chart.js, astro-map.js, and other astrology modules
 */

const ZODIAC_SIGNS = [
    { symbol: '\u2648', name: 'Beran', angle: 0 },
    { symbol: '\u2649', name: 'B\u00FDk', angle: 30 },
    { symbol: '\u264A', name: 'Bl\u00ED\u017Eenci', angle: 60 },
    { symbol: '\u264B', name: 'Rak', angle: 90 },
    { symbol: '\u264C', name: 'Lev', angle: 120 },
    { symbol: '\u264D', name: 'Panna', angle: 150 },
    { symbol: '\u264E', name: 'V\u00E1hy', angle: 180 },
    { symbol: '\u264F', name: '\u0160t\u00EDr', angle: 210 },
    { symbol: '\u2650', name: 'St\u0159elec', angle: 240 },
    { symbol: '\u2651', name: 'Kozoroh', angle: 270 },
    { symbol: '\u2652', name: 'Vodn\u00E1\u0159', angle: 300 },
    { symbol: '\u2653', name: 'Ryby', angle: 330 }
];

const PLANETS = [
    { symbol: '\u2600\uFE0F', name: 'Slunce', color: '#FFD700', img: 'img/planets/sun.webp', size: 60, desc: 'Va\u0161e z\u00E1kladn\u00ED podstata a ego.' },
    { symbol: '\uD83C\uDF19', name: 'M\u011Bs\u00EDc', color: '#C0C0C0', img: 'img/planets/moon.webp', size: 40, desc: 'Emoce, intuice a vnit\u0159n\u00ED sv\u011Bt.' },
    { symbol: '\u263F\uFE0F', name: 'Merkur', color: '#B0C4DE', img: 'img/planets/mercury.webp', size: 30, desc: 'Komunikace a my\u0161len\u00ED.' },
    { symbol: '\u2640\uFE0F', name: 'Venu\u0161e', color: '#FFB6C1', img: 'img/planets/venus.webp', size: 35, desc: 'L\u00E1ska, kr\u00E1sa a hodnoty.' },
    { symbol: '\u2642\uFE0F', name: 'Mars', color: '#FF4500', img: 'img/planets/mars.webp', size: 32, desc: 'Energie, akce a touha.' },
    { symbol: '\u2643', name: 'Jupiter', color: '#E6E6FA', img: 'img/planets/jupiter.webp', size: 55, desc: '\u0160t\u011Bst\u00ED, expanze a r\u016Fst.' },
    { symbol: '\u2644', name: 'Saturn', color: '#708090', img: 'img/planets/saturn_rings.webp', size: 50, hasRing: true, desc: 'Discipl\u00EDna a zkou\u0161ky.' },
    { symbol: '\u26E2', name: 'Uran', color: '#00d9ff', img: 'img/planets/uranus.webp', size: 45, desc: 'Inovace a zm\u011Bna.' },
    { symbol: '\u2646', name: 'Neptun', color: '#3498db', img: 'img/planets/neptune.webp', size: 45, desc: 'Intuice a duchovnost.' },
    { symbol: '\u2647', name: 'Pluto', color: '#2c3e50', img: 'img/planets/pluto.webp', size: 25, desc: 'Transformace a regenerace.' }
];

const PLANET_COLORS = {
    'slunce': '#f1c40f',
    'm\u011Bs\u00EDc': '#bdc3c7',
    'merkur': '#9b59b6',
    'venu\u0161e': '#e91e8c',
    'mars': '#e74c3c',
    'jupiter': '#d4af37',
    'saturn': '#7f8c8d',
    'uran': '#00d9ff',
    'neptun': '#3498db',
    'pluto': '#2c3e50'
};

// Expose globally for non-module scripts
window.ZODIAC_SIGNS = ZODIAC_SIGNS;
window.PLANETS = PLANETS;
window.PLANET_COLORS = PLANET_COLORS;
