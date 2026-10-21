import { getLunarState as getMoonPhase } from './utils/lunar-state.js';

/**
 * Mystická Hvězda — Lunární Rituály: Landing page logika
 * Závisí na: ritualy-content.js (window.RitualContent), moon-phase.js (ES module import)
 */

(function () {
    'use strict';

    const RITUAL_DESC = {
        'new-moon':        'Čas pro nové začátky a setí záměrů do temnoty.',
        'waxing-crescent': 'Odvaha k prvním krokům a budování impulzu.',
        'first-quarter':   'Vůle překonat překážky a jednat rozhodně.',
        'waxing-gibbous':  'Vyladění jednoho rozpracovaného detailu.',
        'full-moon':       'Vrchol energie, oslava a vědomé propuštění.',
        'waning-gibbous':  'Reflexe, sdílení moudrosti a vděčnost.',
        'last-quarter':    'Hluboké čistění — prostor pro nový začátek.',
        'waning-crescent': 'Odpočinek, ticho a příprava na nový cyklus.',
    };

    /* ── Stav ─────────────────────────────────────────────────────── */
    let currentPhase = null;
    let currentSign  = null;
    let checkedItems = new Set();

    /* ── Inicializace ─────────────────────────────────────────────── */
    function init() {
        currentPhase = getMoonPhase();

        // Hero sekce — fáze měsíce
        const iconEl = document.getElementById('ritual-moon-icon');
        const nameEl = document.getElementById('ritual-moon-name');
        const descEl = document.getElementById('ritual-moon-desc');
        window.MH_MOON_ART?.render(iconEl, currentPhase.icon, currentPhase.name);
        if (nameEl) nameEl.textContent = currentPhase.name;
        if (descEl) descEl.textContent = RITUAL_DESC[currentPhase.slug] || '';

        // Načti poslední použité znamení
        try {
            const saved = localStorage.getItem('mh_ritual_sign');
            if (saved && window.RitualContent) {
                const signs = window.RitualContent.getAllSigns();
                if (signs[saved]) showRitual(saved);
            }
        } catch (e) { /* ignore */ }

        // Zvýrazni uložené znamení ze `mh_user_prefs`
        try {
            const prefs = JSON.parse(localStorage.getItem('mh_user_prefs') || '{}');
            if (prefs.sign) markPreferredSign(prefs.sign);
        } catch (e) { /* ignore */ }

        // Kliknutí na znamení
        document.querySelectorAll('.zodiac-btn[data-sign]').forEach(btn => {
            btn.addEventListener('click', () => showRitual(btn.dataset.sign));
        });

        // The six-step session is the free ritual promised on this page.
        // Only saving its notes to the profile requires membership.
    }

    function markPreferredSign(sign) {
        const btn = document.querySelector(`.zodiac-btn[data-sign="${sign}"]`);
        if (!btn) return;
        btn.classList.add('zodiac-btn--preferred');
        btn.title = 'Tvé uložené znamení';
    }

    /* ── Zobrazení rituálu ────────────────────────────────────────── */
    function showRitual(signSlug) {
        if (!window.RitualContent) return;

        currentSign  = signSlug;
        checkedItems = new Set();

        const ritual = window.RitualContent.getRitual(currentPhase.slug, signSlug);

        // Aktivní tlačítko
        document.querySelectorAll('.zodiac-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        const activeBtn = document.querySelector(`.zodiac-btn[data-sign="${signSlug}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-pressed', 'true');
        }

        // Naplnit kartu
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        const phaseBadge = document.getElementById('rc-badge');
        if (phaseBadge) {
            const icon = phaseBadge.querySelector('[data-moon-icon]');
            const label = phaseBadge.querySelector('[data-moon-label]');
            if (icon) window.MH_MOON_ART?.render(icon, currentPhase.icon, currentPhase.name);
            if (label) label.textContent = currentPhase.name;
        }
        setEl('rc-sign-emoji', ritual.signEmoji);
        setEl('rc-sign-name',  ritual.signName.toUpperCase());
        setEl('rc-title',      ritual.nazev);
        setEl('rc-popis',      ritual.popis);
        setEl('rc-duration',   ritual.duration);
        setEl('rc-element',    ritual.signElement);
        setEl('rc-ruler',      ritual.signRuler);

        // Přípravný checklist
        renderChecklist(ritual.prepList);

        // CTA button
        updateCTA();

        // Ukázat kartu
        const card = document.getElementById('ritual-card');
        if (card) {
            card.classList.add('show');
            card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
        }

        // Uložit do localStorage
        try { localStorage.setItem('mh_ritual_sign', signSlug); } catch (e) { /* ignore */ }
    }

    function renderChecklist(items) {
        const list = document.getElementById('prep-list');
        if (!list) return;

        list.innerHTML = '';
        items.forEach((item, i) => {
            const li = document.createElement('li');
            li.dataset.idx = i;
            li.setAttribute('role', 'checkbox');
            li.setAttribute('tabindex', '0');
            li.setAttribute('aria-checked', 'false');
            li.textContent = item;
            li.addEventListener('click', () => toggleCheck(li, i));
            li.addEventListener('keydown', (event) => {
                if (event.key !== ' ' && event.key !== 'Enter') return;
                event.preventDefault();
                toggleCheck(li, i);
            });
            list.appendChild(li);
        });
    }

    function toggleCheck(li, idx) {
        if (checkedItems.has(idx)) {
            checkedItems.delete(idx);
            li.classList.remove('checked');
        } else {
            checkedItems.add(idx);
            li.classList.add('checked');
        }
        li.setAttribute('aria-checked', String(checkedItems.has(idx)));
        updateCTA();
    }

    function updateCTA() {
        const btn  = document.getElementById('btn-enter-ritual');
        const hint = document.getElementById('checklist-hint');
        if (!btn || !currentPhase || !currentSign) return;

        const url  = `session.html?phase=${currentPhase.slug}&sign=${currentSign}`;
        btn.href   = url;

        const total   = document.querySelectorAll('#prep-list li').length;
        const checked = checkedItems.size;

        if (checked === 0) {
            hint.textContent = 'Odklikněte vše co máte připraveno — nebo rovnou vstupte';
        } else if (checked < total) {
            hint.textContent = `${checked} z ${total} připraveno`;
        } else {
            hint.textContent = 'Vše připraveno — jste připraveni vstoupit.';
        }
    }

    /* ── Spuštění ─────────────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // ritualy-content.js ještě nemusí být načtený — chvíli počkáme
        const tryInit = () => window.RitualContent ? init() : setTimeout(tryInit, 50);
        tryInit();
    }

})();
