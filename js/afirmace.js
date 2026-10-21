import { getLunarState } from './utils/lunar-state.js';

/**
 * afirmace.js — Denní afirmace generované AI (konzistentní s horoskopem)
 * Volá stejné API jako horoscope.js — výsledek je identický s afirmací v horoskopu.
 */

const signs = {
    beran:   { name: 'Beran',    emoji: '♈', color: '#e74c3c', apiName: 'Beran' },
    byk:     { name: 'Byk',      emoji: '♉', color: '#27ae60', apiName: 'Býk' },
    blizenci:{ name: 'Blíženci', emoji: '♊', color: '#f39c12', apiName: 'Blíženci' },
    rak:     { name: 'Rak',      emoji: '♋', color: '#2980b9', apiName: 'Rak' },
    lev:     { name: 'Lev',      emoji: '♌', color: '#e67e22', apiName: 'Lev' },
    panna:   { name: 'Panna',    emoji: '♍', color: '#8e44ad', apiName: 'Panna' },
    vahy:    { name: 'Váhy',     emoji: '♎', color: '#16a085', apiName: 'Váhy' },
    stir:    { name: 'Štír',     emoji: '♏', color: '#c0392b', apiName: 'Štír' },
    strelec: { name: 'Střelec',  emoji: '♐', color: '#d35400', apiName: 'Střelec' },
    kozoroh: { name: 'Kozoroh',  emoji: '♑', color: '#7f8c8d', apiName: 'Kozoroh' },
    vodnar:  { name: 'Vodnář',   emoji: '♒', color: '#2471a3', apiName: 'Vodnář' },
    ryby:    { name: 'Ryby',     emoji: '♓', color: '#1a5276', apiName: 'Ryby' }
};

const affirmationSignClasses = Object.keys(signs).map(sign => `affirmation-card--${sign}`);
let affirmationRequestId = 0;
let copyStatusTimer = 0;

function setAffirmationCardTheme(card, sign) {
    card.classList.remove(...affirmationSignClasses);
    card.classList.add(`affirmation-card--${sign}`);
}

function getMoonPhase() {
    const state = getLunarState();
    return { name: state.name, emoji: state.icon };
}

function renderMoonBadge(moon) {
    const badge = document.getElementById('moon-badge');
    if (!badge) return;

    const icon = badge.querySelector('[data-moon-icon]');
    const label = badge.querySelector('[data-moon-label]');
    if (icon) window.MH_MOON_ART?.render(icon, moon.emoji, moon.name);
    if (label) label.textContent = moon.name;
}

function setAffirmationStatus(message) {
    const status = document.getElementById('affirmation-status');
    if (status) status.textContent = message;
}

// Jednoduché fallbacky pro případ výpadku API
const fallbackAffirmations = {
    beran:    'Má odvaha tvoří mosty tam, kde ostatní vidí propasti.',
    byk:      'Jsem pevným základem, ze kterého roste vše krásné a trvalé.',
    blizenci: 'Má zvídavost otvírá dveře, které jiní ani nevidí.',
    rak:      'Má intuice je dnes nejjasnějším světlem na mé cestě.',
    lev:      'Nesu v sobě slunce — a dnes ho naplno sdílím se světem.',
    panna:    'V každém detailu nalézám krásu a smysl, který ostatní přehlíží.',
    vahy:     'Přináším rovnováhu tam, kde ji svět nejvíce potřebuje.',
    stir:     'Z každé hloubky stoupám silnější — to je má přirozenost.',
    strelec:  'Má svoboda je má síla — dnes ji naplno žiji a sdílím.',
    kozoroh:  'Každý krok, který dělám, je investicí do mé budoucnosti.',
    vodnar:   'Má originalita je dar světu — dnes ji přijímám bez omluvy.',
    ryby:     'Jsem oceánem soucitu — hluboký, klidný a nekonečný.',
};

window.showAffirmation = async function (sign) {
    const signData = signs[sign];
    if (!signData) return;
    const requestId = ++affirmationRequestId;

    // Aktivní tlačítko
    document.querySelectorAll('.zodiac-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.zodiac-btn[data-sign="${sign}"]`);
    if (btn) btn.classList.add('active');

    const horoskopLink = document.getElementById('btn-horoskop-link');
    if (horoskopLink) horoskopLink.href = `horoskopy.html#${sign}`;

    const moon = getMoonPhase();
    renderMoonBadge(moon);
    document.getElementById('sign-emoji').textContent = signData.emoji;
    document.getElementById('sign-name').textContent = signData.name.toUpperCase();

    const card = document.getElementById('affirmation-card');
    setAffirmationCardTheme(card, sign);

    // Zobraz kartu s loading textem
    setAffirmationStatus(`Připravuji dnešní afirmaci pro znamení ${signData.name}.`);
    document.getElementById('affirmation-text').textContent = 'Připravuju dnešní afirmaci…';
    document.getElementById('affirmation-sub').textContent = '';
    card.classList.add('show');
    card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });

    // Session cache — vyhne se opakovaným API voláním
    const cacheKey = `mh_aff_${sign}_${new Date().toDateString()}`;
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            const { text } = JSON.parse(cached);
            document.getElementById('affirmation-text').textContent = `"${text}"`;
            document.getElementById('affirmation-sub').textContent = moon.name;
            setAffirmationStatus(`Afirmace pro znamení ${signData.name} je připravená.`);
            try { localStorage.setItem('mh_last_affirmation_sign', sign); } catch (e) { }
            return;
        }
    } catch (e) { }

    try {
        const data = await window.callAPI('/horoscope', { sign: signData.apiName, period: 'daily' });

        const parsed = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
        const affirmation = parsed?.affirmation;
        if (!affirmation) throw new Error('No affirmation in response');

        // Cache the completed answer, but never let an older request replace the
        // result for a sign selected more recently.
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ text: affirmation })); } catch (e) { }
        if (requestId !== affirmationRequestId) return;

        document.getElementById('affirmation-text').textContent = `"${affirmation}"`;
        document.getElementById('affirmation-sub').textContent = moon.name;
        setAffirmationStatus(`Afirmace pro znamení ${signData.name} je připravená.`);

    } catch (err) {
        if (requestId !== affirmationRequestId) return;
        console.warn('[Afirmace] API fallback:', err.message);
        const text = fallbackAffirmations[sign] || 'Jsem v souladu se svou nejhlubší pravdou.';
        document.getElementById('affirmation-text').textContent = `"${text}"`;
        document.getElementById('affirmation-sub').textContent = moon.name;
        setAffirmationStatus(`Služba je teď nedostupná. Zobrazuji připravenou náhradní afirmaci pro znamení ${signData.name}.`);
    }

    if (requestId !== affirmationRequestId) return;
    try { localStorage.setItem('mh_last_affirmation_sign', sign); } catch (e) { }
};

async function copyAffirmation() {
    const raw = document.getElementById('affirmation-text').textContent;
    const text = raw.replace(/^"|"$/g, '').trim();
    clearAffirmationActionStatus();
    let copied = false;

    try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API is unavailable');
        await navigator.clipboard.writeText(text + ' — Mystická Hvězda');
        copied = true;
    } catch {
        copied = false;
    }

    showAffirmationActionStatus(copied
        ? 'Zkopírováno!'
        : 'Kopírování se nepodařilo. Označ text afirmace a zkopíruj ho ručně.', !copied, copied ? 2000 : 0);
}

function clearAffirmationActionStatus() {
    clearTimeout(copyStatusTimer);
    const el = document.getElementById('affirmation-action-status');
    el.hidden = true;
    el.classList.remove('mh-block-visible', 'affirmation-action-status--error');
}

function showAffirmationActionStatus(text, isError = false, dismissAfter = 0) {
    const el = document.getElementById('affirmation-action-status');
    const message = document.getElementById('affirmation-action-message');
    el.classList.toggle('affirmation-action-status--error', isError);
    el.hidden = false;
    el.classList.add('mh-block-visible');
    message.textContent = text;

    if (dismissAfter > 0) {
        copyStatusTimer = window.setTimeout(() => {
            el.hidden = true;
            el.classList.remove('mh-block-visible');
        }, dismissAfter);
    }
}

async function shareAffirmation() {
    const raw = document.getElementById('affirmation-text').textContent;
    const text = raw.replace(/^"|"$/g, '').trim();
    clearAffirmationActionStatus();

    if (navigator.share) {
        try {
            await navigator.share({ title: 'Moje dnešní afirmace', text, url: 'https://www.mystickahvezda.cz/afirmace.html' });
        } catch (error) {
            // Dismissing the native share sheet is an expected user action.
            if (error?.name !== 'AbortError') {
                showAffirmationActionStatus('Sdílení se nepodařilo. Afirmaci můžeš zkopírovat tlačítkem „Kopírovat“.', true);
            }
        }
    } else {
        await copyAffirmation();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderMoonBadge(getMoonPhase());
    document.querySelectorAll('.zodiac-btn[data-sign]').forEach(btn => {
        btn.addEventListener('click', () => showAffirmation(btn.dataset.sign));
    });
    document.getElementById('btn-copy-affirmation').addEventListener('click', copyAffirmation);
    document.getElementById('btn-share-affirmation').addEventListener('click', shareAffirmation);

    try {
        const last = localStorage.getItem('mh_last_affirmation_sign');
        if (last && signs[last]) showAffirmation(last);
    } catch (e) { }
});
