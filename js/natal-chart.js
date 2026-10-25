/**
 * Mystická Hvězda - Natal Chart Visualization (AI-Powered)
 * Uses the server AI API for personalized life narrative generation.
 */

import { showFallbackNotice } from './utils/reading-display.js';
import { getTodayIsoDate } from './utils/numerology-logic.js';

document.addEventListener('DOMContentLoaded', () => {
    if (window.MH_DEBUG) console.debug('Natal Chart JS loaded');
    initNatalChart();
});

let transitRequestVersion = 0;
let natalProfileAutofillInProgress = false;
let natalFormInputRevision = 0;

function refreshNatalBirthDateMaximum() {
    const birthDateInput = document.getElementById('birth-date');
    if (birthDateInput) birthDateInput.max = getTodayIsoDate();
}

const ZODIAC_SIGNS = [
    { symbol: '♈', name: 'Beran', angle: 0 },
    { symbol: '♉', name: 'Býk', angle: 30 },
    { symbol: '♊', name: 'Blíženci', angle: 60 },
    { symbol: '♋', name: 'Rak', angle: 90 },
    { symbol: '♌', name: 'Lev', angle: 120 },
    { symbol: '♍', name: 'Panna', angle: 150 },
    { symbol: '♎', name: 'Váhy', angle: 180 },
    { symbol: '♏', name: 'Štír', angle: 210 },
    { symbol: '♐', name: 'Střelec', angle: 240 },
    { symbol: '♑', name: 'Kozoroh', angle: 270 },
    { symbol: '♒', name: 'Vodnář', angle: 300 },
    { symbol: '♓', name: 'Ryby', angle: 330 }
];

const PLANETS = [
    { id: 'sun', symbol: '☉', name: 'Slunce', color: '#FFD700', img: 'img/planets/sun.webp', size: 60, desc: 'Vaše základní podstata a ego.' },
    { id: 'moon', symbol: '☽', name: 'Měsíc', color: '#C0C0C0', img: 'img/planets/moon.webp', size: 40, desc: 'Emoce, intuice a vnitřní svět.' },
    { id: 'mercury', symbol: '☿️', name: 'Merkur', color: '#B0C4DE', img: 'img/planets/mercury.webp', size: 30, desc: 'Komunikace a myšlení.' },
    { id: 'venus', symbol: '♀️', name: 'Venuše', color: '#FFB6C1', img: 'img/planets/venus.webp', size: 35, desc: 'Láska, krása a hodnoty.' },
    { id: 'mars', symbol: '♂️', name: 'Mars', color: '#FF4500', img: 'img/planets/mars.webp', size: 32, desc: 'Energie, akce a touha.' },
    { id: 'jupiter', symbol: '♃', name: 'Jupiter', color: '#E6E6FA', img: 'img/planets/jupiter.webp', size: 55, desc: 'Štěstí, expanze a růst.' },
    { id: 'saturn', symbol: '♄', name: 'Saturn', color: '#708090', img: 'img/planets/saturn_rings.webp', size: 50, hasRing: true, desc: 'Disciplína a zkoušky.' }
];

const PLANET_ORBIT_RADII = [35, 55, 78, 101, 124, 146, 165];
const PLANET_VISUAL_SIZES = [46, 26, 20, 24, 22, 36, 34];
const ASPECT_SHORT_LABELS = {
    conjunction: 'konj.',
    opposition: 'opo.',
    trine: 'tri.',
    square: 'kvad.',
    sextile: 'sex.'
};
const NATAL_PLANET_ORDER = [
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'pluto'
];
const SVG_NS = "http://www.w3.org/2000/svg";
const NATAL_PAYMENT_REASSURANCE = '7 dní za 0 Kč, potom automaticky 199 Kč/měsíc, pokud nezrušíš. K aktivaci je potřeba karta. Zrušení v profilu.';

function buildNatalUpgradeUrl(source = 'natal_teaser_gate') {
    const authUrl = new URL('/prihlaseni.html', window.location.origin);
    authUrl.searchParams.set('mode', 'register');
    authUrl.searchParams.set('redirect', '/cenik.html');
    authUrl.searchParams.set('plan', 'pruvodce');
    authUrl.searchParams.set('source', source);
    authUrl.searchParams.set('feature', 'natalni_interpretace');
    authUrl.searchParams.set('entry_source', source);
    authUrl.searchParams.set('entry_feature', 'natalni_interpretace');
    return `${authUrl.pathname}${authUrl.search}`;
}

function startNatalUpgradeFlow(source = 'natal_teaser_gate') {
    window.MH_ANALYTICS?.trackCTA?.(source, {
        plan_id: 'pruvodce',
        feature: 'natalni_interpretace'
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout('pruvodce', {
            source,
            feature: 'natalni_interpretace',
            metadata: {
                entry_source: source,
                entry_feature: 'natalni_interpretace'
            },
            redirect: '/cenik.html',
            authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
        });
        return;
    }

    window.location.href = buildNatalUpgradeUrl(source);
}

function setBlockVisible(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('mh-block-visible', visible);
}

function setNatalStatus(message) {
    const status = document.getElementById('natal-status');
    if (status) status.textContent = message;
}

function clearNatalResultAfterInputChange(event) {
    if (event?.target?.id === 'use-profile-natal') return;
    if (event) natalFormInputRevision += 1;
    if (natalChartGenerationInProgress) return;

    const chartResults = document.getElementById('chart-results');
    const transitResults = document.getElementById('transits-now');
    const aiResults = document.getElementById('ai-interpretation');
    const calculationError = document.getElementById('natal-calculation-error');
    const hasVisibleOutput = [chartResults, transitResults, aiResults, calculationError]
        .some((element) => element && !element.hidden);
    if (!hasVisibleOutput) return;

    document.getElementById('planets-layer')?.replaceChildren();
    clearNatalComputedLayers();
    ++transitRequestVersion;
    window.currentNatalChartReadingId = null;
    setBlockVisible(chartResults, false);
    setBlockVisible(transitResults, false);
    aiResults?.remove();
    setBlockVisible(calculationError, false);
    setNatalStatus('Údaje se změnily. Spusť výpočet znovu, aby mapa odpovídala aktuálnímu zadání.');
}

function setFlexVisible(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('mh-flex-visible', visible);
}

function initNatalChart() {
    const zodiacGroup = document.getElementById('zodiac-ring');
    const planetsGroup = document.getElementById('planets-layer');
    const form = document.getElementById('natal-form');

    refreshNatalBirthDateMaximum();
    if (form) {
        form.addEventListener('focusin', refreshNatalBirthDateMaximum);
        form.addEventListener('pointerdown', refreshNatalBirthDateMaximum, true);
        form.addEventListener('keydown', refreshNatalBirthDateMaximum, true);
    }
    window.addEventListener('focus', refreshNatalBirthDateMaximum);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshNatalBirthDateMaximum();
    });

    if (!zodiacGroup || !planetsGroup) {
        console.error('SVG elements not found!');
        return;
    }

    // Render Zodiac Ring
    renderZodiacRing(zodiacGroup);

    // Handle Form Submit
    if (form) {
        form.addEventListener('input', clearNatalResultAfterInputChange);
        form.addEventListener('change', clearNatalResultAfterInputChange);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await generateNatalChart(planetsGroup);
        });
    }

    // Handle "Use my profile" checkbox
    const useProfileCheckbox = document.getElementById('use-profile-natal');
    if (useProfileCheckbox) {
        let profileAutofillRequestId = 0;

        // Toggle visibility based on auth
        const wrapper = useProfileCheckbox.closest('.checkbox-wrapper');
        if (wrapper) {
            const updateVisibility = () => {
                setFlexVisible(wrapper, window.Auth && window.Auth.isLoggedIn());
            };
            updateVisibility();
            document.addEventListener('auth:changed', updateVisibility);
        }

        useProfileCheckbox.addEventListener('change', async (e) => {
            const requestId = ++profileAutofillRequestId;
            natalProfileAutofillInProgress = false;
            if (e.target.checked) {
                // Auth token is stored in an HttpOnly cookie; use the public auth state helper.
                if (!window.Auth?.isLoggedIn?.()) {
                    if (window.Auth?.showToast) {
                        window.Auth.showToast('Info', 'Pro použití profilu se prosím přihlaste.', 'info');
                    } else {
                        alert('Pro použití profilu se prosím přihlaste.');
                    }
                    e.target.checked = false;
                    return;
                }

                clearNatalResultAfterInputChange();
                natalProfileAutofillInProgress = true;
                setNatalStatus('Načítám údaje z profilu.');
                const inputRevision = natalFormInputRevision;

                try {
                    // Fetch fresh data from server using centralized method
                    const user = await window.Auth.getProfile();

                    if (requestId !== profileAutofillRequestId || !e.target.checked) return;
                    if (inputRevision !== natalFormInputRevision) {
                        setNatalStatus('Údaje se během načítání změnily. Zkontroluj je a spusť výpočet s aktuálními hodnotami.');
                        e.target.checked = false;
                        return;
                    }

                    if (!user) {
                        throw new Error('Nepodařilo se načíst profil.');
                    }


                    if (user.first_name) document.getElementById('name').value = user.first_name;

                    if (user.birth_date) {
                        try {
                            const d = new Date(user.birth_date);
                            if (!isNaN(d.getTime())) {
                                document.getElementById('birth-date').value = d.toISOString().split('T')[0];
                            } else {
                                document.getElementById('birth-date').value = user.birth_date;
                            }
                        } catch (err) {
                            console.warn('Error formatting birth_date:', err);
                        }
                    }

                    if (user.birth_time) {
                        const t = user.birth_time.toString();
                        document.getElementById('birth-time').value = t.length > 5 ? t.substring(0, 5) : t;
                    }

                    if (user.birth_place) document.getElementById('birth-place').value = user.birth_place;
                    setNatalStatus('Údaje z profilu jsou připravené. Zkontroluj je a spusť výpočet.');

                } catch (error) {
                    if (requestId !== profileAutofillRequestId || !e.target.checked) return;
                    console.error('Autofill Error:', error);
                    window.Auth?.showToast?.('Chyba', 'Nepodařilo se stáhnout data z profilu.', 'error');
                    setNatalStatus('Údaje z profilu se nepodařilo načíst. Vyplň je ručně nebo zkus načtení znovu.');
                    e.target.checked = false;
                } finally {
                    if (requestId === profileAutofillRequestId) {
                        natalProfileAutofillInProgress = false;
                    }
                }
            }
        });
    }
}

function renderZodiacRing(group) {
    // Widened ring for larger symbols
    const radius = 222; // Center of the ring text

    for (let degree = 0; degree < 360; degree += 5) {
        const angleRad = (degree - 90) * (Math.PI / 180);
        const isSignBoundary = degree % 30 === 0;
        const isTenDegree = degree % 10 === 0;
        const inner = isSignBoundary ? 194 : (isTenDegree ? 204 : 210);
        const outer = isSignBoundary ? 216 : 216;

        const tick = document.createElementNS(SVG_NS, "line");
        tick.setAttribute("x1", Math.cos(angleRad) * inner);
        tick.setAttribute("y1", Math.sin(angleRad) * inner);
        tick.setAttribute("x2", Math.cos(angleRad) * outer);
        tick.setAttribute("y2", Math.sin(angleRad) * outer);
        tick.setAttribute(
            "class",
            isSignBoundary
                ? "natal-zodiac-tick natal-zodiac-tick--sign"
                : (isTenDegree ? "natal-zodiac-tick natal-zodiac-tick--major" : "natal-zodiac-tick")
        );
        group.appendChild(tick);
    }

    ZODIAC_SIGNS.forEach((sign, index) => {
        const angleRad = (sign.angle - 90) * (Math.PI / 180);
        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central"); // Better vertical centering
        text.setAttribute("fill", "var(--color-mystic-gold)");
        text.setAttribute("font-size", "36"); // Reduced from 48 (-25%, close to requested 30%)
        text.setAttribute("transform", `rotate(${sign.angle}, ${x}, ${y})`);
        text.textContent = sign.symbol;

        const divAngleRad = (sign.angle - 15 - 90) * (Math.PI / 180);
        // Helper lines - adjusted for wide band
        const x1 = Math.cos(divAngleRad) * 195; // Inner radius
        const y1 = Math.sin(divAngleRad) * 195;
        const x2 = Math.cos(divAngleRad) * 248; // Outer radius (almost to edge 250)
        const y2 = Math.sin(divAngleRad) * 248;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "rgba(212, 175, 55, 0.2)");
        line.setAttribute("stroke-width", "1");

        group.appendChild(line);
        group.appendChild(text);
    });
}

function generatePlanets(group, planetPositions) {
    if (!planetPositions) return;

    // Clear existing
    group.innerHTML = '';

    // Add definitions for clip paths
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    group.appendChild(defs);

    PLANETS.forEach((planet, index) => {
        // Adjust sizes in data (done below via override or permanent change)
        // We will override sizes here for visual consistency
        planet.size = PLANET_VISUAL_SIZES[index];

        const isSun = index === 0;
        const isSaturn = planet.name === 'Saturn';
        const calculatedPlanet = planetPositions?.[planet.id];
        const hasCalculatedLongitude = typeof calculatedPlanet?.longitude === 'number';
        if (!hasCalculatedLongitude) return;

        const radius = PLANET_ORBIT_RADII[index];
        const angle = calculatedPlanet.longitude;

        // Create orbit wrapper for animation
        const orbitWrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
        orbitWrapper.setAttribute("class", "orbit-path");

        // Orbit ring
        if (!isSun) {
            const orbitRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            orbitRing.setAttribute("cx", 0);
            orbitRing.setAttribute("cy", 0);
            orbitRing.setAttribute("r", radius);
            orbitRing.setAttribute("fill", "none");
            orbitRing.setAttribute("stroke", "rgba(255,255,255,0.05)");
            orbitRing.setAttribute("stroke-width", "1");
            group.appendChild(orbitRing);

        }

        const angleRad = (angle - 90) * (Math.PI / 180);
        const x = isSun ? 0 : Math.cos(angleRad) * radius;
        const y = isSun ? 0 : Math.sin(angleRad) * radius;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${x}, ${y})`);
        g.setAttribute("class", "planet-node");

        // PLANET IMAGE
        const imgSize = planet.size;
        const radiusPx = imgSize / 2;

        // Create a group for the planet graphics
        const planetG = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // 1. Add a fallback circle (Hidden by default, shown on error)
        // We set it to display:none initially to prevent the "white edge" flash
        const fallback = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        fallback.setAttribute("r", radiusPx - 2);
        fallback.setAttribute("fill", planet.color || "#FFF");
        fallback.setAttribute("opacity", "0.8");
        fallback.setAttribute("display", "none");
        planetG.appendChild(fallback);

        // 2. Add the Image
        const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
        // Use both href and xlink:href for maximum compatibility
        image.setAttribute("href", planet.img);
        image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", planet.img);

        image.setAttribute("width", imgSize);
        image.setAttribute("height", imgSize);
        image.setAttribute("x", -radiusPx);
        image.setAttribute("y", -radiusPx);

        if (isSaturn) {
            // Use MASK logic for Saturn
            // We need to apply the mask to the image, and ensure the image is large enough
            // BUT specific mask handling requires matching dimensions.
            // Simplified approach: Render image normally, but use 'mask' attribute pointing to a clone of itself?
            // Actually, simply using the mix-blend-mode 'screen' SHOULD have worked perfectly if bg is black.
            // If it failed, it's likely due to browser composition.
            // Let's try explicit Masking:
            // We need a definition of the mask that IS the image.

            // Re-define mask specifically for this instance to capture size
            const maskId = `mask-saturn-${index}`;
            const sMask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
            sMask.setAttribute("id", maskId);
            const sMaskImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
            sMaskImg.setAttribute("href", planet.img);
            sMaskImg.setAttribute("width", imgSize * 1.5);
            sMaskImg.setAttribute("height", imgSize * 1.5);
            sMaskImg.setAttribute("x", -(imgSize * 1.5) / 2);
            sMaskImg.setAttribute("y", -(imgSize * 1.5) / 2);
            sMask.appendChild(sMaskImg);
            defs.appendChild(sMask);

            image.setAttribute("width", imgSize * 1.5);
            image.setAttribute("height", imgSize * 1.5);
            image.setAttribute("x", -(imgSize * 1.5) / 2);
            image.setAttribute("y", -(imgSize * 1.5) / 2);

            // Apply the mask
            image.setAttribute("mask", `url(#${maskId})`);
            image.classList.add('planet-image--normal');

            // Note: If the star background is behind, the black parts of the image (in the mask) become transparent.
            // However, the planet body itself (tan/brown) is lighter than black, so it stays opaque.
            // The black background is black (val 0), so it becomes transparent.

        } else {
            // For rounded planets: Use Clip Path
            const clipId = `clip-${index}`;
            const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
            clipPath.setAttribute("id", clipId);
            const clipCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            clipCircle.setAttribute("cx", 0);
            clipCircle.setAttribute("cy", 0);
            // Cut 3px to eliminate edges without cutting too much texture
            clipCircle.setAttribute("r", Math.max(0, radiusPx - 3));
            clipPath.appendChild(clipCircle);
            defs.appendChild(clipPath);

            image.setAttribute("clip-path", `url(#${clipId})`);

            // Removed drop-shadow to prevent "white edge" artifacts completely
            image.classList.add('planet-image--clean');
        }

        // Optional: Add simple rotation if desired, currently disabled to keep it stable
        // if (!isSun) { }

        // Show fallback only on error
        image.addEventListener('error', (e) => {
            console.error(`Failed to load image for ${planet.name}: ${planet.img}`);
            image.setAttribute("display", "none");
            fallback.removeAttribute("display");
        });

        planetG.appendChild(image);

        // Add a glow ring/atmosphere (only for Sun or if desired)
        // Removed for other planets to prevent "white edge" look if stroke is too bright
        if (isSun) {
            const atmosphere = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            atmosphere.setAttribute("r", radiusPx);
            atmosphere.setAttribute("fill", "none");
            atmosphere.setAttribute("stroke", "#FFD700");
            atmosphere.setAttribute("stroke-width", "2");
            atmosphere.setAttribute("opacity", "0.5");
            atmosphere.classList.add('sun-atmosphere');
            planetG.appendChild(atmosphere);
        }

        g.appendChild(planetG);

        // Add planet to orbit wrapper
        orbitWrapper.appendChild(g);
        group.appendChild(orbitWrapper);

        // Animation: Fade in
        orbitWrapper.classList.add('orbit-path--pending');
        setTimeout(() => {
            orbitWrapper.classList.add('orbit-path--visible');
        }, index * 150);
    });
}

function getPlanetVisualPoint(planetId, longitude) {
    const index = PLANETS.findIndex((planet) => planet.id === planetId);
    if (index < 0 || typeof longitude !== 'number') return null;

    const radius = PLANET_ORBIT_RADII[index];
    const angleRad = (longitude - 90) * (Math.PI / 180);
    return {
        x: Math.cos(angleRad) * radius,
        y: Math.sin(angleRad) * radius
    };
}

function clearNatalComputedLayers() {
    document.getElementById('houses-layer')?.replaceChildren();
    document.getElementById('aspects-layer')?.replaceChildren();
}

function renderNatalHouseLayer(chart) {
    const layer = document.getElementById('houses-layer');
    const houses = chart?.houses?.available ? chart.houses.houses : [];
    if (!layer || !houses.length) return;

    houses.forEach((house) => {
        const longitude = house.cuspLongitude;
        if (typeof longitude !== 'number') return;

        const angleRad = (longitude - 90) * (Math.PI / 180);
        const inner = 26;
        const outer = 192;
        const labelRadius = 184;
        const isAxis = [1, 4, 7, 10].includes(house.house);

        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", Math.cos(angleRad) * inner);
        line.setAttribute("y1", Math.sin(angleRad) * inner);
        line.setAttribute("x2", Math.cos(angleRad) * outer);
        line.setAttribute("y2", Math.sin(angleRad) * outer);
        line.setAttribute("class", isAxis ? "natal-house-line natal-house-line--axis" : "natal-house-line");
        layer.appendChild(line);

        const label = document.createElementNS(SVG_NS, "text");
        label.setAttribute("x", Math.cos(angleRad) * labelRadius);
        label.setAttribute("y", Math.sin(angleRad) * labelRadius);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "central");
        label.setAttribute("class", "natal-house-label");
        label.textContent = String(house.house);
        layer.appendChild(label);
    });
}

function renderNatalAspectLayer(chart) {
    const layer = document.getElementById('aspects-layer');
    const visualPlanetIds = new Set(PLANETS.map((planet) => planet.id));
    const aspects = Array.isArray(chart?.aspects)
        ? chart.aspects.filter((aspect) => (
            visualPlanetIds.has(aspect.planetA) && visualPlanetIds.has(aspect.planetB)
        )).slice(0, 8)
        : [];

    if (!layer || !aspects.length) return;

    aspects.forEach((aspect) => {
        const planetA = chart.planets?.[aspect.planetA];
        const planetB = chart.planets?.[aspect.planetB];
        const from = getPlanetVisualPoint(aspect.planetA, planetA?.longitude);
        const to = getPlanetVisualPoint(aspect.planetB, planetB?.longitude);
        if (!from || !to) return;

        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", from.x);
        line.setAttribute("y1", from.y);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y);
        line.setAttribute("class", `natal-aspect-line natal-aspect-line--${aspect.polarity || 'neutral'}`);

        const title = document.createElementNS(SVG_NS, "title");
        title.textContent = formatAspectSummary(aspect);
        line.appendChild(title);

        layer.appendChild(line);

        const label = document.createElementNS(SVG_NS, "text");
        label.setAttribute("x", (from.x + to.x) / 2);
        label.setAttribute("y", (from.y + to.y) / 2);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "central");
        label.setAttribute("class", `natal-aspect-label natal-aspect-label--${aspect.polarity || 'neutral'}`);
        label.textContent = `${ASPECT_SHORT_LABELS[aspect.aspect] || aspect.name} ${aspect.orb}°`;
        layer.appendChild(label);
    });
}

function renderNatalComputedLayers(chart) {
    clearNatalComputedLayers();
    if (!chart?.planets) return;
    renderNatalHouseLayer(chart);
    renderNatalAspectLayer(chart);
}

async function fetchCalculatedNatalChart({ birthDate, birthTime, birthPlace, name }) {
    const params = new URLSearchParams({
        birthDate,
        birthTime: birthTime || '',
        birthPlace: birthPlace || '',
        name: name || ''
    });
    const apiBase = window.API_CONFIG?.BASE_URL || '/api';
    const response = await fetch(`${apiBase}/natal-chart/calculate?${params.toString()}`, {
        credentials: 'include'
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || `Natal calculation failed: ${response.status}`);
    }

    return data.chart;
}

function formatCalculatedPlanet(planet) {
    if (!planet?.sign?.name) return '';
    return `${planet.sign.name} ${planet.degreeText || ''}`.trim();
}

function formatAspectSummary(aspect) {
    if (!aspect) return '';
    const orb = typeof aspect.orb === 'number' ? `, orb ${aspect.orb}°` : '';
    return `${aspect.planetALabel} ${aspect.name.toLowerCase()} ${aspect.planetBLabel}${orb}`;
}

function formatPlanetPlacement(planet) {
    if (!planet) return '';

    const house = typeof planet.house === 'number' ? `, ${planet.house}. dům` : '';
    const retrograde = planet.retrograde ? ' R' : '';
    return `${planet.name}: ${planet.sign?.name || '--'} ${planet.degreeText || ''}${retrograde}${house}`.trim();
}

function renderNatalEngineSummary(chart) {
    const elementValue = document.getElementById('natal-element-value');
    const qualityValue = document.getElementById('natal-quality-value');
    const planetsList = document.getElementById('natal-planets-list');
    const aspectsList = document.getElementById('natal-aspects-list');
    const note = document.getElementById('natal-engine-note');

    if (elementValue) {
        elementValue.textContent = chart.elementBalance?.dominant?.label || '--';
    }
    if (qualityValue) {
        qualityValue.textContent = chart.qualityBalance?.dominant?.label || '--';
    }
    if (planetsList) {
        planetsList.innerHTML = '';
        const planets = NATAL_PLANET_ORDER
            .map((planetId) => chart.planets?.[planetId])
            .filter(Boolean);

        planets.forEach((planet) => {
            const item = document.createElement('li');
            item.textContent = formatPlanetPlacement(planet);
            planetsList.appendChild(item);
        });
    }
    if (aspectsList) {
        aspectsList.innerHTML = '';
        const aspects = Array.isArray(chart.aspects) ? chart.aspects.slice(0, 3) : [];

        if (!aspects.length) {
            const item = document.createElement('li');
            item.textContent = 'Bez hlavních aspektů v nastaveném orbu.';
            aspectsList.appendChild(item);
        } else {
            aspects.forEach((aspect) => {
                const item = document.createElement('li');
                item.textContent = formatAspectSummary(aspect);
                aspectsList.appendChild(item);
            });
        }
    }
    if (note) {
        note.textContent = chart.houses?.available
            ? `Ascendent a domy: ${chart.houses.system === 'whole_sign' ? 'whole-sign' : chart.houses.system}.`
            : (chart.houses?.reason || 'Ascendent vyžaduje přesný čas a rozpoznané místo narození.');
    }
}

function trackNatalCalculation(chart, input = {}) {
    window.MH_ANALYTICS?.trackEvent?.('natal_chart_calculated', {
        engine_version: chart?.engine?.version || null,
        precision: chart?.engine?.precision || null,
        has_birth_time: Boolean(input.birthTime),
        has_birth_place: Boolean(input.birthPlace),
        location_resolved: Boolean(chart?.location),
        ascendant_available: Boolean(chart?.houses?.available),
        dominant_element: chart?.elementBalance?.dominant?.key || null
    });
}

function applyComputedNatalChart(chart) {
    if (!chart?.planets) return false;

    const sun = formatCalculatedPlanet(chart.planets.sun);
    const moon = formatCalculatedPlanet(chart.planets.moon);
    const ascendant = chart.houses?.ascendant
        ? formatCalculatedPlanet(chart.houses.ascendant)
        : 'bez přesné polohy';

    const sunElement = document.getElementById('res-sun');
    const moonElement = document.getElementById('res-moon');
    const ascElement = document.getElementById('res-asc');
    const tipElement = document.getElementById('tip-sign');

    if (sun && sunElement) {
        sunElement.textContent = sun;
        if (tipElement) tipElement.textContent = chart.planets.sun.sign.name;
    }
    if (moon && moonElement) {
        moonElement.textContent = moon;
    }
    if (ascElement) {
        ascElement.textContent = ascendant;
    }

    renderNatalEngineSummary(chart);

    return true;
}

function hasRequiredNatalPlanetPositions(chart) {
    return Boolean(chart?.planets) && PLANETS.every((planet) =>
        Number.isFinite(chart.planets?.[planet.id]?.longitude)
    );
}

function showNatalCalculationError(message) {
    let errorContainer = document.getElementById('natal-calculation-error');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'natal-calculation-error';
        errorContainer.className = 'natal-ai';
        errorContainer.setAttribute('role', 'alert');
        document.getElementById('chart-results')?.insertAdjacentElement('afterend', errorContainer);
    }

    errorContainer.innerHTML = `
        <h4 class="natal-ai__title">Výpočet mapy se nepodařilo načíst</h4>
        <div class="ai-content natal-ai__content">
            <p>${message}</p>
            <button type="button" class="btn btn--primary natal-calculation-retry">Zkusit výpočet znovu</button>
        </div>
    `;
    errorContainer.querySelector('.natal-calculation-retry')?.addEventListener('click', () => {
        document.getElementById('natal-form')?.requestSubmit();
    });
    setBlockVisible(errorContainer, true);
    errorContainer.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
}

function hasSameNatalRequestSession(requestSession) {
    const isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());
    if (isLoggedIn !== requestSession?.isLoggedIn) return false;
    if (!isLoggedIn) return true;

    return typeof requestSession.userId === 'string'
        && requestSession.userId.length > 0
        && window.Auth?.user?.id === requestSession.userId;
}

function discardNatalResultAfterSessionChange({ planetsGroup, aiResultsDiv, btn, originalHTML }) {
    planetsGroup?.replaceChildren();
    clearNatalComputedLayers();
    ++transitRequestVersion;
    window.currentNatalChartReadingId = null;
    setBlockVisible(document.getElementById('chart-results'), false);
    setBlockVisible(document.getElementById('transits-now'), false);
    setBlockVisible(aiResultsDiv, false);
    setNatalStatus('');

    if (btn) {
        btn.innerHTML = originalHTML;
        btn.classList.remove('btn--processing');
        btn.disabled = false;
    }

    showNatalCalculationError('Účet se během výpočtu změnil, proto jsem výsledek skryl. Zkontroluj údaje a spusť výpočet znovu.');
}

function showNatalInterpretationError(container) {
    const content = container?.querySelector('.ai-content');
    if (!content) return;

    content.innerHTML = '';
    const text = document.createElement('p');
    text.textContent = 'Vypočtená mapa zůstává zobrazená. Pro osobní výklad zkus požadavek znovu.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn btn--primary natal-interpretation-retry';
    retry.textContent = 'Zkusit výklad znovu';
    retry.addEventListener('click', () => document.getElementById('natal-form')?.requestSubmit());
    content.append(text, retry);
    setBlockVisible(container, true);
}

let natalChartGenerationInProgress = false;

async function generateNatalChart(planetsGroup) {
    if (natalChartGenerationInProgress) return;
    if (natalProfileAutofillInProgress) {
        setNatalStatus('Načítají se údaje z profilu. Počkej chvíli a spusť výpočet znovu.');
        return;
    }
    natalChartGenerationInProgress = true;
    const isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());
    const readingOwnerId = isLoggedIn ? window.Auth.user?.id : null;
    const requestSession = { isLoggedIn, userId: readingOwnerId };

    const form = document.getElementById('natal-form');
    const formControls = [...new Set([
        ...(form?.querySelectorAll('input, select, textarea, button') || []),
        document.getElementById('use-profile-natal')
    ].filter(Boolean))];
    const previouslyDisabled = formControls.map((control) => control.disabled);
    const previousBusy = form?.getAttribute('aria-busy');
    formControls.forEach((control) => { control.disabled = true; });
    form?.setAttribute('aria-busy', 'true');

    try {
        await performNatalChartGeneration(planetsGroup, readingOwnerId, requestSession);
    } finally {
        natalChartGenerationInProgress = false;
        if (previousBusy === null || previousBusy === undefined) form?.removeAttribute('aria-busy');
        else form?.setAttribute('aria-busy', previousBusy);
        formControls.forEach((control, index) => {
            control.disabled = previouslyDisabled[index];
        });
    }
}

async function performNatalChartGeneration(planetsGroup, readingOwnerId = null, requestSession = { isLoggedIn: false, userId: null }) {
    const btn = document.querySelector('#natal-form button');
    const originalHTML = btn.innerHTML; // Capture full HTML (icons etc.)
    const name = document.getElementById('name').value;
    const birthDate = document.getElementById('birth-date').value;
    const birthTime = document.getElementById('birth-time').value;
    const birthPlace = document.getElementById('birth-place').value;

    setNatalStatus('Počítám polohy planet pro tvoji mapu.');
    ++transitRequestVersion;
    setBlockVisible(document.getElementById('transits-now'), false);
    btn.innerHTML = '<span class="loading-spinner"></span> Počítají se polohy planet…';
    btn.classList.add('btn--processing');
    btn.disabled = true;

    // Clear previous
    planetsGroup.innerHTML = '';
    clearNatalComputedLayers();
    setBlockVisible(document.getElementById('chart-results'), false);

    setBlockVisible(document.getElementById('natal-calculation-error'), false);

    // Hide a previous interpretation while a fresh server calculation is pending.
    let aiResultsDiv = document.getElementById('ai-interpretation');
    setBlockVisible(aiResultsDiv, false);

    try {
        // Only server-calculated positions may be presented as a personal chart.
        let computedChart;
        try {
            computedChart = await fetchCalculatedNatalChart({ birthDate, birthTime, birthPlace, name });
            if (!hasRequiredNatalPlanetPositions(computedChart)) {
                throw new Error('Natal calculation returned incomplete planetary positions.');
            }
            if (!hasSameNatalRequestSession(requestSession)) {
                discardNatalResultAfterSessionChange({ planetsGroup, aiResultsDiv, btn, originalHTML });
                return;
            }
            trackNatalCalculation(computedChart, { birthTime, birthPlace });
        } catch (calcError) {
            console.warn('Natal engine calculation unavailable:', calcError.message);
            setNatalStatus('');
            showNatalCalculationError('Zadané údaje zůstaly ve formuláři. Zkontroluj připojení a zkus výpočet znovu.');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('btn--processing');
            return;
        }
        generatePlanets(planetsGroup, computedChart.planets);
        renderNatalComputedLayers(computedChart);

        // Update Transits (Phase 2)
        if (typeof updateTransits === 'function') {
            updateTransits({ birthDate, birthTime, birthPlace, name });
        }

        // Show basic results (Text)
        if (!applyComputedNatalChart(computedChart)) {
            throw new Error('Natal calculation could not be displayed.');
        }
        setBlockVisible(document.getElementById('chart-results'), true);
        setNatalStatus('Základní mapa je připravená.');

        if (!aiResultsDiv) {
            aiResultsDiv = createAIResultsContainer();
        }

        // Call AI for interpretation
        btn.innerHTML = '<span class="loading-spinner"></span> Připravuje se výklad…';

        // Login required for AI interpretation (chart graphic stays public)
        if (!window.Auth || !window.Auth.isLoggedIn()) {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('btn--processing');
            setBlockVisible(aiResultsDiv, true);
            setNatalStatus('Základní mapa je připravená. Pro osobní slovní výklad se přihlas.');
            const contentDiv = aiResultsDiv.querySelector('.ai-content');
            if (window.Premium) {
                window.Premium.showLoginGate(
                    contentDiv,
                    '\u2B50 Vytvo\u0159te \u00FA\u010Det a pokra\u010Dujte k odem\u010Den\u00ED sv\u00E9ho vesm\u00EDrn\u00E9ho pl\u00E1nu',
                    'natalni_interpretace',
                    'natal_teaser_gate'
                );
            }
            return;
        }

        // Premium required for AI interpretation
        if (!window.Auth.isPremium()) {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('btn--processing');
            setNatalStatus('Základní mapa je připravená. Osobní slovní výklad otevře nabídka členství.');
            if (window.Premium?.showTrialPaywall) {
                window.Premium.showTrialPaywall('natalni_interpretace');
            }
            return;
        }

        // Call API via centralized helper
        setNatalStatus('Připravuji osobní slovní výklad.');
        const data = await window.callAPI('/natal-chart', {
            birthDate,
            birthTime,
            birthPlace,
            name
        });

        if (!hasSameNatalRequestSession(requestSession)) {
            discardNatalResultAfterSessionChange({ planetsGroup, aiResultsDiv, btn, originalHTML });
            return;
        }

        if (data.success || data.response) {
            const finalChart = data.chart || computedChart;
            applyComputedNatalChart(finalChart);
            renderNatalComputedLayers(finalChart);

            // Display AI interpretation
            setBlockVisible(aiResultsDiv, true);
            const contentDiv = aiResultsDiv.querySelector('.ai-content');
            
            // Clean and format the response
            const responseText = data.response || data.message || '';
            
            // Safer cleaning: remove <html>, <body>, <head>, <script>, <style> only
            let cleanContent = responseText.replace(/<\/?(html|body|head|script|style)[^>]*>/gi, '');
            const textToSearch = cleanContent.replace(/<[^>]+>/g, ' ');

            // Ensure our specific structure is preserved and enhanced
            let formattedContent = cleanContent
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.*?)__/g, '<strong>$1</strong>')
                // If it doesn't already have H4/P tags, wrap it (handle mixed content)
                .split('\n\n').map(para => {
                    if (para.trim().startsWith('<h4')) return para;
                    return `<p>${para.replace(/\n/g, '<br>')}</p>`;
                }).join('');

            contentDiv.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(formattedContent) : formattedContent.replace(/<[^>]*>/g, '');
            
            // --- STRUCTURED DATA EXTRACTION ---
            // Prefer the server-parsed signs: the server now strips the "DATA: ..." block
            // itself, so this is authoritative and doesn't depend on the AI's exact formatting.
            if (data.aiSigns && data.aiSigns.moon && data.aiSigns.ascendant) {
                document.getElementById('res-moon').textContent = data.aiSigns.moon;
                document.getElementById('res-asc').textContent = data.aiSigns.ascendant;
            } else {
                // Fallback for older cached responses that still carry the raw DATA line.
                const dataMatch = responseText.match(/DATA:\s*Slunce=([^,]+),\s*Měsíc=([^,]+),\s*Ascendent=([^|\n\r]+)/i);

                if (dataMatch) {
                    document.getElementById('res-moon').textContent = dataMatch[2].trim();
                    document.getElementById('res-asc').textContent = dataMatch[3].trim();
                } else {
                    // Last resort: strict sign names search in the free text.
                    const signNames = ZODIAC_SIGNS.map(s => s.name).join('|');
                    const moonRegex = new RegExp(`(?:Měsíc|Luna)\\s+(?:ve|v)\\s+(?:znamení\\s+)?(${signNames})`, 'i');
                    const moonMatch = textToSearch.match(moonRegex);
                    if (moonMatch && moonMatch[1]) {
                        document.getElementById('res-moon').textContent = moonMatch[1];
                    }

                    const ascRegex = new RegExp(`(?:Ascendent|Vycházející\\s+znamení)\\s+(?:je|v)\\s+(${signNames})`, 'i');
                    const ascMatch = textToSearch.match(ascRegex);
                    if (ascMatch && ascMatch[1]) {
                        document.getElementById('res-asc').textContent = ascMatch[1];
                    }
                }
            }

            // Belt-and-suspenders: strip any leftover DATA block from visible content.
            // Should be a no-op now that the server strips it, but stays safe either way.
            if (/DATA:\s*Slunce=/i.test(contentDiv.innerHTML)) {
                const cleaned = contentDiv.innerHTML.replace(/DATA:\s*Slunce=[^<]+/i, '').replace(/<p><\/p>/g, '');
                contentDiv.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(cleaned) : cleaned.replace(/<[^>]*>/g, '');
            }
            
            // Handle Teaser for non-premium
            if (data.isTeaser) {
                const teaserMsg = document.createElement('div');
                teaserMsg.className = 'teaser-overlay';
                teaserMsg.innerHTML = `
                    <div class="teaser-content">
                        <p>Chceš podrobnější výklad své natální mapy?</p>
                        <a href="${buildNatalUpgradeUrl('natal_teaser_gate')}" class="btn btn--premium natal-teaser-upgrade-btn">Pokračovat s Premium</a>
                        <p class="natal-teaser-reassurance">${NATAL_PAYMENT_REASSURANCE}</p>
                    </div>
                `;
                contentDiv.appendChild(teaserMsg);
                teaserMsg.querySelector('.natal-teaser-upgrade-btn')?.addEventListener('click', (event) => {
                    event.preventDefault();
                    startNatalUpgradeFlow('natal_teaser_gate');
                });
            }

            showFallbackNotice(contentDiv, data.fallback);
            setNatalStatus(data.fallback
                ? 'Základní mapa i stručný výklad jsou připravené.'
                : 'Základní mapa i osobní výklad jsou připravené.');

            // Save to history if logged in and add favorite button
            if (!data.isTeaser && window.Auth && window.Auth.saveReading) {
                let saveResult = null;
                try {
                    saveResult = await window.Auth.saveReading('natal-chart', {
                        name,
                        birthDate,
                        birthTime,
                        birthPlace,
                        interpretation: data.response,
                        chart: data.chart || computedChart,
                        fallback: !!data.fallback
                    }, readingOwnerId);
                } catch (saveError) {
                    console.warn('Natal chart history save failed:', saveError.message);
                }

                if (!hasSameNatalRequestSession(requestSession)) {
                    discardNatalResultAfterSessionChange({ planetsGroup, aiResultsDiv, btn, originalHTML });
                    return;
                }

                // Store reading ID and add favorite button
                if (saveResult && saveResult.id) {
                    window.currentNatalChartReadingId = saveResult.id;

                    // Add favorite button after interpretation
                    const favoriteBtn = document.createElement('div');
                    favoriteBtn.className = 'text-center favorite-reading-action';
                    favoriteBtn.innerHTML = `
                        <button id="favorite-natal-btn" class="btn btn--glass favorite-reading-action__button">
                            <svg class="mh-symbol mh-symbol--inline favorite-icon" viewBox="0 0 48 48" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg> Přidat do oblíbených
                        </button>
                    `;
                    contentDiv.appendChild(favoriteBtn);

                    // Attach listener
                    document.getElementById('favorite-natal-btn').addEventListener('click', async () => {
                        await toggleFavorite(window.currentNatalChartReadingId, 'favorite-natal-btn');
                    });
                } else {
                    const saveNotice = document.createElement('p');
                    saveNotice.className = 'result-context-notice';
                    saveNotice.setAttribute('role', 'status');
                    saveNotice.textContent = 'Výklad je hotový, ale nepodařilo se ho uložit do profilu.';
                    contentDiv.appendChild(saveNotice);
                    setNatalStatus('Osobní výklad je hotový, ale nepodařilo se ho uložit do profilu.');
                }
            }

        } else {
            throw new Error(data.error);
        }

    } catch (error) {
        console.error('Natal Chart Error:', error);
        if (aiResultsDiv) {
            setNatalStatus('Základní mapa je připravená, osobní výklad se nepodařilo načíst.');
            showNatalInterpretationError(aiResultsDiv);
        } else {
            setNatalStatus('');
            setBlockVisible(document.getElementById('chart-results'), false);
            showNatalCalculationError('Zadané údaje zůstaly ve formuláři. Zkus výpočet znovu.');
        }
    }

    btn.innerHTML = originalHTML; // Restore full HTML
    btn.disabled = false;
    btn.classList.remove('btn--processing');
    document.getElementById('chart-results').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function createAIResultsContainer() {
    const container = document.createElement('div');
    container.id = 'ai-interpretation';
    container.className = 'natal-ai';
    container.innerHTML = `
        <h4 class="natal-ai__title">
            Výklad k vypočtené mapě
        </h4>
        <div class="ai-content natal-ai__content"></div>
        <aside class="natal-personal-map-next" aria-label="Navazující výklad na 12 měsíců">
            <span class="natal-personal-map-next__eyebrow">Chceš z mapy udělat konkrétní plán?</span>
            <strong>Osobní mapa rozpracuje jednu otázku do 12 navazujících měsíců.</strong>
            <p>Jednorázový PDF výklad propojí vztahy, práci, energii a praktické kroky. Začíná dnem objednávky, ne koncem kalendářního roku.</p>
            <a class="btn btn--primary" href="/osobni-mapa.html?source=natal_chart_result&amp;feature=osobni_mapa_2026" data-personal-map-next data-analytics-cta="natal_result_personal_map" data-analytics-feature="osobni_mapa_2026" data-analytics-product="osobni_mapa_2026" data-analytics-intent="one_time_purchase">Prohlédnout ukázku · 299 Kč</a>
        </aside>
    `;

    // Insert after chart-results
    const chartResults = document.getElementById('chart-results');
    chartResults.parentNode.insertBefore(container, chartResults.nextSibling);

    const context = {
        source: 'natal_chart_result',
        feature: 'osobni_mapa_2026',
        planId: 'osobni_mapa_2026',
        planType: 'personal_map',
        metadata: {
            product_id: 'osobni_mapa_2026',
            product_type: 'personal_map',
            placement: 'natal_chart_result',
            path: window.location.pathname
        }
    };
    void window.Auth?.sendServerFunnelEvent?.({
        eventName: 'one_time_product_viewed',
        ...context
    });
    container.querySelector('[data-personal-map-next]')?.addEventListener('click', () => {
        void window.Auth?.sendServerFunnelEvent?.({
            eventName: 'pricing_product_cta_clicked',
            ...context
        });
    });

    return container;
}

async function typewriterEffect(element, htmlContent) {
    element.classList.add('content-fade-enter');
    element.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(htmlContent) : htmlContent.replace(/<[^>]*>/g, '');

    // Small delay to ensure DOM update
    await new Promise(r => setTimeout(r, 100));

    element.classList.add('content-fade-enter-active');

    // Scroll into view if needed
    element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function renderTransitSnapshot(transit) {
    const section = document.getElementById('transits-now');
    if (!section) return;

    const now = transit?.engine?.calculatedAt ? new Date(transit.engine.calculatedAt) : new Date();

    document.getElementById('transit-date').textContent = now.toLocaleDateString('cs-CZ');
    document.getElementById('transit-title').textContent = transit?.title || `Slunce ve znamení ${transit?.current?.sunSign || '...'}`;
    document.getElementById('transit-subtitle').textContent = transit?.subtitle || 'aktuální tranzity';
    document.getElementById('transit-message').textContent = transit?.message || 'Aktuální tranzity se nepodařilo načíst.';

    setBlockVisible(section, true);
}

async function updateTransits({ birthDate, birthTime, birthPlace, name }) {
    const version = ++transitRequestVersion;
    const section = document.getElementById('transits-now');
    if (!section) return;

    try {
        const params = new URLSearchParams({
            birthDate,
            birthTime: birthTime || '',
            birthPlace: birthPlace || '',
            name: name || ''
        });
        const apiBase = window.API_CONFIG?.BASE_URL || '/api';
        const response = await fetch(`${apiBase}/transits/current?${params.toString()}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Transit calculation failed: ${response.status}`);
        }

        if (version !== transitRequestVersion) return;
        renderTransitSnapshot(data.transit);
        return;
    } catch (transitError) {
        console.warn('Transit engine fallback:', transitError.message);
    }

    if (version !== transitRequestVersion) return;
    document.getElementById('transit-date').textContent = '';
    document.getElementById('transit-title').textContent = 'Aktuální tranzity nejsou dostupné';
    document.getElementById('transit-subtitle').textContent = '';
    const message = document.getElementById('transit-message');
    message.setAttribute('role', 'status');
    message.textContent = 'Mapa narození zůstává dostupná. Aktuální tranzity se nepodařilo načíst.';
    const retry = document.createElement('button');
    retry.type = 'button'; retry.className = 'btn btn--glass btn--sm';
    retry.textContent = 'Zkusit načíst tranzity znovu';
    retry.addEventListener('click', () => {
        retry.disabled = true;
        updateTransits({ birthDate, birthTime, birthPlace, name });
    });
    message.append(document.createElement('br'), retry);
    setBlockVisible(section, true);
}
