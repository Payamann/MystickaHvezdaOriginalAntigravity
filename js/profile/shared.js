/**
 * Shared utility functions for profile modules
 */

// Helper: Escape HTML to prevent XSS
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper: API base URL
export function apiUrl() {
    return window.API_CONFIG?.BASE_URL || '/api';
}

// Helper: Auth headers (Authorization kept as fallback during cookie migration)
export function authHeaders(json = false) {
    const token = window.Auth?.token;
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
}

export async function authHeadersWithCsrf(json = false) {
    const headers = authHeaders(json);
    const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    return headers;
}

// Helper: Fetch options with credentials for HttpOnly cookie auth
export function authFetchOptions(opts = {}) {
    return {
        credentials: 'include',
        headers: authHeaders(opts.json || false),
        ...opts
    };
}

const PLAN_TYPE_ALIASES = {
    vip: 'vip_majestrat'
};

const FALLBACK_PLAN_LABELS = {
    free: 'Poutn\u00edk',
    premium_monthly: '\u010clenstv\u00ed Mystick\u00e9 Hv\u011bzdy',
    exclusive_monthly: '\u010clenstv\u00ed Mystick\u00e9 Hv\u011bzdy',
    vip_majestrat: '\u010clenstv\u00ed Mystick\u00e9 Hv\u011bzdy'
};

const FALLBACK_PLAN_PRICES_CZK = {
    pruvodce: 199,
    'pruvodce-rocne': 1990,
    osviceni: 499,
    'osviceni-rocne': 4990,
    'vip-majestrat': 999
};

let planManifestPromise = null;
let plansById = new Map();
let plansByType = new Map();

export function normalizePlanType(planType) {
    return PLAN_TYPE_ALIASES[planType] || planType || 'free';
}

function readablePlanName(name) {
    return String(name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function indexPlanManifest(manifest) {
    const plans = Array.isArray(manifest?.plans) ? manifest.plans : [];
    plansById = new Map(plans.map(plan => [plan.id, plan]));
    plansByType = new Map();

    for (const plan of plans) {
        const planType = normalizePlanType(plan.planType);
        if (!planType) continue;

        if (!plansByType.has(planType) || plan.billingInterval === 'monthly') {
            plansByType.set(planType, plan);
        }
    }

    return manifest;
}

export async function loadPlanManifest() {
    if (planManifestPromise) return planManifestPromise;

    planManifestPromise = fetch(`${apiUrl()}/plans`, { credentials: 'same-origin' })
        .then(async response => {
            if (!response.ok) throw new Error(`Plan manifest returned ${response.status}`);
            const manifest = await response.json();
            if (!manifest.success || !Array.isArray(manifest.plans)) {
                throw new Error('Plan manifest has invalid shape');
            }
            return indexPlanManifest(manifest);
        })
        .catch(error => {
            console.warn('[Plans] Using fallback plan labels:', error.message);
            plansById = new Map();
            plansByType = new Map();
            return null;
        });

    return planManifestPromise;
}

export function formatPlanLabel(planType, options = {}) {
    const normalizedPlanType = normalizePlanType(planType);
    const manifestPlan = plansByType.get(normalizedPlanType);
    const baseLabel = FALLBACK_PLAN_LABELS[normalizedPlanType] || readablePlanName(manifestPlan?.name) || 'Přístup k výkladům';

    if (normalizedPlanType === 'free' && options.freeSuffix) {
        return `${baseLabel} (zdarma)`;
    }

    return baseLabel;
}

export function getPlanPriceCzk(planId) {
    const manifestPlan = plansById.get(planId);
    const manifestPrice = Number(manifestPlan?.priceCzk);

    if (Number.isFinite(manifestPrice)) {
        return manifestPrice;
    }

    return FALLBACK_PLAN_PRICES_CZK[planId] || null;
}

// Get icon for reading type
export function getReadingIcon(type) {
    const icons = {
        'angel': 'angel', 'angel-card': 'angel', 'astrocartography': 'globe',
        'crystal': 'crystal', 'crystal-ball': 'crystal', 'daily-wisdom': 'star',
        'horoscope': 'chart', 'journal': 'pen', 'medicine-wheel': 'compass',
        'natal': 'chart', 'natal-chart': 'chart', 'numerology': 'numbers',
        'past-life': 'hourglass', 'runes': 'rune', 'synastry': 'partner',
        'tarot': 'tarot', 'oracle': 'eye'
    };
    const iconName = icons[type] || 'star';
    return profileIconMarkup(iconName);
}

// Get title for reading type
export function getReadingTitle(type) {
    const titles = {
        'angel': 'Andělský vzkaz',
        'angel-card': 'Andělská karta',
        'astrocartography': 'Astro mapa',
        'crystal': 'Křišťálová koule',
        'crystal-ball': 'Křišťálová koule',
        'daily-wisdom': 'Denní moudrost',
        'horoscope': 'Horoskop',
        'journal': 'Osobní poznámka',
        'medicine-wheel': 'Šamanské kolo',
        'natal': 'Natální karta',
        'natal-chart': 'Natální karta',
        'numerology': 'Numerologie',
        'oracle': 'Orákulum',
        'past-life': 'Minulý život',
        'runes': 'Runový výklad',
        'synastry': 'Partnerská shoda',
        'tarot': 'Tarotový výklad'
    };
    return titles[type] || 'Výklad';
}

export const READING_FILTERS = [
    { value: 'all', label: 'Vše' },
    ...[
        ['tarot', 'Tarot'], ['horoscope', 'Horoskopy'], ['journal', 'Moje poznámky'],
        ['crystal-ball', 'Křišťálová koule', ['crystal-ball', 'crystal']],
        ['natal-chart', 'Natální karta', ['natal-chart', 'natal']],
        ['numerology', 'Numerologie'], ['synastry', 'Partnerská shoda'],
        ['angel-card', 'Andělské karty', ['angel-card', 'angel']],
        ['runes', 'Runy'], ['astrocartography', 'Astro mapa'], ['past-life', 'Minulý život'],
        ['medicine-wheel', 'Šamanské kolo'], ['daily-wisdom', 'Denní moudrost'], ['oracle', 'Orákulum']
    ].map(([value, label, types]) => ({ value, label, types: types || [value] }))
];

export function getReadingData(reading) {
    let data = reading.data;
    if (reading.type === 'journal') return data;
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { return data; }
    }
    return data;
}

export function getReadingLabel(reading) {
    const data = getReadingData(reading || {});
    if (reading?.type === 'tarot') {
        if (data?.tool === 'tarot_yes_no') return 'Tarot ano/ne';
        const spreads = {
            'Tarot karta dne': 'Tarot karta dne', 'daily': 'Tarot karta dne',
            'Jedna karta': 'Tarot · jedna karta', 'Tři karty': 'Tarot · tři karty',
            'Celtic Cross': 'Tarot · Keltský kříž'
        };
        if (spreads[data?.spreadType]) return spreads[data.spreadType];
        if (typeof data?.spreadType === 'string' && data.spreadType.endsWith(' (Ukázka)')) {
            return `${spreads[data.spreadType.slice(0, -9)] || 'Tarotový výklad'} · ukázka`;
        }
    }
    if (reading?.type !== 'horoscope') return getReadingTitle(reading?.type);
    const periods = { daily: 'Denní horoskop', weekly: 'Týdenní horoskop', monthly: 'Měsíční horoskop', yearly: 'Roční horoskop' };
    return [periods[data?.period] || 'Horoskop', data?.sign].filter(value => typeof value === 'string' && value).join(' · ');
}

export function getReadingPreview(reading) {
    const data = getReadingData(reading || {});
    const text = reading?.type === 'journal' && typeof data === 'string' ? data
        : typeof data?.question === 'string' ? data.question : typeof data?.intention === 'string' ? data.intention
            : Array.isArray(data?.cards) ? data.cards.map(card => typeof card === 'string' ? card : card?.name || '').join(' · ')
                : data?.cardName || '';
    return typeof text === 'string' ? text.replace(/\s+/g, ' ').trim().slice(0, 160) : '';
}

export const PROFILE_AVATARS = [
    { symbol: 'star', label: 'Hvězda' }, { symbol: 'dream', label: 'Měsíc' },
    { symbol: 'leaf', label: 'List' }, { symbol: 'flower', label: 'Květ' },
    { symbol: 'compass', label: 'Kompas' }, { symbol: 'tarot', label: 'Karty' }
];

export function renderProfileAvatar(element, value) {
    if (!element) return;
    const symbol = typeof value === 'string' && value.startsWith('symbol:') ? value.slice(7) : null;
    const avatar = PROFILE_AVATARS.find(item => item.symbol === symbol);
    element.innerHTML = profileIconMarkup(avatar?.symbol || 'user');
    element.dataset.avatar = value || '';
    element.setAttribute('aria-label', `Změnit avatar${avatar ? `: ${avatar.label}` : ''}`);
}
// Get Zodiac Sign from birth date string
export function getZodiacSign(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const month = date.getMonth() + 1;
    const day = date.getDate();

    const signs = [
        { name: 'Kozoroh', symbol: '♑', start: [1, 1], end: [1, 19] },
        { name: 'Vodnář', symbol: '♒', start: [1, 20], end: [2, 18] },
        { name: 'Ryby', symbol: '♓', start: [2, 19], end: [3, 20] },
        { name: 'Beran', symbol: '♈', start: [3, 21], end: [4, 19] },
        { name: 'Býk', symbol: '♉', start: [4, 20], end: [5, 20] },
        { name: 'Blíženci', symbol: '♊', start: [5, 21], end: [6, 20] },
        { name: 'Rak', symbol: '♋', start: [6, 21], end: [7, 22] },
        { name: 'Lev', symbol: '♌', start: [7, 23], end: [8, 22] },
        { name: 'Panna', symbol: '♍', start: [8, 23], end: [9, 22] },
        { name: 'Váhy', symbol: '♎', start: [9, 23], end: [10, 22] },
        { name: 'Štír', symbol: '♏', start: [10, 23], end: [11, 21] },
        { name: 'Střelec', symbol: '♐', start: [11, 22], end: [12, 21] },
        { name: 'Kozoroh', symbol: '♑', start: [12, 22], end: [12, 31] }
    ];

    return signs.find(s => 
        (month === s.start[0] && day >= s.start[1]) || 
        (month === s.end[0] && day <= s.end[1])
    ) || signs[0];
}

// Get Lucide icon name for zodiac symbol
export function getZodiacIconName(symbol) {
    const map = {
        '♈': 'ram', '♉': 'mountain', '♊': 'users', '♋': 'crab',
        '♌': 'lion', '♍': 'leaf', '♎': 'scale', '♏': 'bug',
        '♐': 'send', '♑': 'mountain', '♒': 'droplets', '♓': 'fish'
    };
    // Note: Lucide doesn't have all zodiac signs directly, using closest analogs
    return map[symbol] || 'sparkles';
}

// Decorative UI markup only. Never interpolate user text into an SVG URL.
export function profileIconMarkup(name) {
 const allowed = new Set(['book', 'bookmark', 'warning', 'angel', 'globe', 'crystal', 'star', 'chart', 'pen', 'compass', 'numbers', 'hourglass', 'rune', 'partner', 'tarot', 'eye', 'dream', 'leaf', 'flower', 'user', 'check']);
 if (!allowed.has(name)) throw new Error('Unknown profile UI icon');
 return '<svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#' + name + '"></use></svg>';
}
