/**
 * Mystická Hvězda — Rituální Seance: Logika
 * Závisí na: ritualy-content.js (window.RitualContent)
 */

(function () {
    'use strict';

    /* ── Konstanty ────────────────────────────────────────────────── */
    const SCREENS = {
        BEFORE:     'screen-checkin-before',
        STEP:       'screen-step',
        AFTER:      'screen-checkin-after',
        COMPLETION: 'screen-completion',
    };

    const MOOD_LABELS = { 1: 'Únava', 2: 'Neutrálně', 3: 'Klid', 4: 'Dobře', 5: 'Skvěle' };
    const STREAK_KEY  = 'mh_ritual_streak';
    const BEST_KEY    = 'mh_ritual_best_streak';
    const DATE_KEY    = 'mh_ritual_last_date';

    /* ── Stav ─────────────────────────────────────────────────────── */
    let ritual       = null;
    let currentStep  = 0;   // 0-based index do ritual.kroky
    let moodBefore   = null;
    let moodAfter    = null;
    let journalSavePending = false;
    let journalOwnerId = null;
    let savedJournalText = null;

    /* ── Pomocné ──────────────────────────────────────────────────── */
    function getTodayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    function getYesterdayStr() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    function parseParams() {
        const p = new URLSearchParams(window.location.search);
        return {
            phase: p.get('phase') || 'full-moon',
            sign:  p.get('sign')  || (tryLS('mh_ritual_sign') || 'beran'),
        };
    }

    function tryLS(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function setLS(key, val) {
        try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
    }

    /* ── Screen management ───────────────────────────────────────── */
    function showScreen(id) {
        Object.values(SCREENS).forEach(s => {
            const el = document.getElementById(s);
            if (el) { el.classList.remove('active'); }
        });
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
    }

    function updateProgress(stepIdx) {
        // stepIdx = -1 (before), 0-5 (steps), 6 (after), 7 (completion)
        const total = 8; // Eight transitions from initial check-in to completion.
        const pct   = Math.round(((stepIdx + 1) / total) * 100);
        const bar   = document.getElementById('progress-bar');
        if (bar) {
            bar.dataset.progress = String(pct);
            bar.setAttribute('aria-valuenow', pct);
        }
    }

    /* ── BREATHING GUIDE ─────────────────────────────────────────── */
    function startBreathGuide() {
        const container = document.getElementById('breath-container');
        const circle    = document.getElementById('breath-circle');
        const label     = document.getElementById('breath-label');
        const counter   = document.getElementById('breath-counter');
        const btnNext   = document.getElementById('btn-next');

        if (!container) return;

        container.hidden = false;
        container.classList.add('ritual-breath-visible');
        btnNext.hidden = true; // schovat, dokud nedokončí dech

        let cycle = 0;
        const CYCLES = 3;

        function runCycle() {
            if (cycle >= CYCLES) {
                // Dech dokončen
                container.hidden = true;
                container.classList.remove('ritual-breath-visible');
                btnNext.hidden = false;
                return;
            }

            cycle++;
            // Nádech (4s)
            circle.className = 'breath-guide inhale';
            label.textContent  = 'Nadechni se…';
            counter.textContent = cycle;

            setTimeout(() => {
                // Zadržet (4s)
                circle.className   = 'breath-guide hold';
                label.textContent  = 'Na chvíli zadrž…';
            }, 4000);

            setTimeout(() => {
                // Výdech (6s)
                circle.className   = 'breath-guide exhale';
                label.textContent  = 'Pomalu vydechni…';
            }, 8000);

            setTimeout(() => {
                circle.className   = 'breath-guide';
                label.textContent  = '';
                runCycle();
            }, 14000); // 4 + 4 + 6
        }

        runCycle();
    }

    /* ── KROKY ───────────────────────────────────────────────────── */
    function renderStep(idx) {
        const krok = ritual.kroky[idx];
        if (!krok) return;

        const labelEl   = document.getElementById('step-label');
        const titleEl   = document.getElementById('step-title');
        const textEl    = document.getElementById('step-text');
        const subtextEl = document.getElementById('step-subtext');
        const counter   = document.getElementById('step-counter');

        if (labelEl)   labelEl.textContent   = `Krok ${krok.cislo} / ${ritual.kroky.length}`;
        if (titleEl)   titleEl.textContent   = krok.title;
        if (subtextEl) subtextEl.textContent = krok.subtext;

        // Mantra krok — speciální formátování
        if (idx === 4) {
            const parts = krok.text.split('\n\n');
            const intro = parts[0] || '';
            const mantraRaw = parts[1] || krok.text;
            const cleanMantra = DOMPurify ? DOMPurify.sanitize(mantraRaw, {ALLOWED_TAGS: []}) : mantraRaw;
            if (textEl) {
                textEl.innerHTML = '';
                if (intro) {
                    const p = document.createElement('p');
                    p.className = 'ritual-mantra-intro';
                    p.textContent = intro;
                    textEl.appendChild(p);
                }
                const m = document.createElement('div');
                m.className   = 'mantra-text';
                m.textContent = `„${cleanMantra}"`;
                textEl.appendChild(m);
            }
        } else {
            if (textEl) textEl.textContent = krok.text;
        }

        if (counter) counter.textContent = `Krok ${krok.cislo} / ${ritual.kroky.length}`;

        updateProgress(idx);

        // Krok 1 = dechový průvodce
        if (idx === 0) {
            startBreathGuide();
        } else {
            const breathContainer = document.getElementById('breath-container');
            if (breathContainer) {
                breathContainer.hidden = true;
                breathContainer.classList.remove('ritual-breath-visible');
            }
            const btnNext = document.getElementById('btn-next');
            if (btnNext) btnNext.hidden = false;
        }
    }

    /* ── STREAK ──────────────────────────────────────────────────── */
    function updateStreak() {
        const today     = getTodayStr();
        const yesterday = getYesterdayStr();
        const lastDate  = tryLS(DATE_KEY);
        let   streak    = parseInt(tryLS(STREAK_KEY) || '0', 10);
        let   best      = parseInt(tryLS(BEST_KEY)   || '0', 10);

        if (lastDate === today) return { streak, best }; // already done

        streak = (lastDate === yesterday) ? streak + 1 : 1;
        if (streak > best) best = streak;

        setLS(DATE_KEY,   today);
        setLS(STREAK_KEY, String(streak));
        setLS(BEST_KEY,   String(best));

        return { streak, best };
    }

    /* ── COMPLETION SCREEN ───────────────────────────────────────── */
    function showCompletion() {
        showScreen(SCREENS.COMPLETION);
        updateProgress(7);
        const counter = document.getElementById('step-counter');
        if (counter) counter.textContent = 'Hotovo ✦';

        // Subtitle
        const sub = document.getElementById('completion-subtitle');
        if (sub) sub.textContent = `${ritual.nazev} — dokončeno`;

        // Posun nálady
        const moodEl = document.getElementById('mood-shift');
        if (moodEl && moodBefore && moodAfter) {
            moodEl.textContent = `${MOOD_LABELS[moodBefore]}  →  ${MOOD_LABELS[moodAfter]}`;
            moodEl.hidden = false;
            moodEl.classList.add('mood-shift--visible');
        }

        // Streak
        const { streak } = updateStreak();
        const numEl   = document.getElementById('streak-number');
        const lblEl   = document.getElementById('streak-label');
        if (numEl) numEl.textContent = streak;
        if (lblEl) {
            lblEl.textContent = streak === 1 ? 'rituál dnes' : streak < 5 ? 'rituály v řadě' : 'rituálů v řadě';
        }

        // Journal prompts
        const promptsList = document.getElementById('journal-prompts-list');
        if (promptsList && ritual.journalPrompts) {
            promptsList.innerHTML = ritual.journalPrompts.map(
                p => `<p class="journal-prompt">${p}</p>`
            ).join('');
        }

        // Journal save (Premium gate)
        renderJournalAction();
    }

    function renderJournalAction() {
        const actionEl = document.getElementById('journal-action');
        if (!actionEl) return;

        // Auth může být async — chvíli počkáme
        const isPremium = window.Auth && typeof window.Auth.isPremium === 'function'
            ? window.Auth.isPremium()
            : false;

        if (isPremium) {
            journalOwnerId = window.Auth?.user?.id || null;
            actionEl.innerHTML = `<p>Zápis se uloží do deníku tvého profilu.</p><button class="btn-save-journal" id="btn-save-journal">Uložit do deníku</button>`;
            document.getElementById('btn-save-journal').addEventListener('click', saveJournal);
            document.getElementById('journal-notes')?.addEventListener('input', () => {
                const button = document.getElementById('btn-save-journal');
                if (button && !journalSavePending) button.disabled = false;
                const status = document.getElementById('journal-saved');
                if (status) status.hidden = true;
            });
        } else {
            actionEl.innerHTML = `
                <div class="journal-premium-gate">
                    Uložení zápisků je součástí
                    <a href="../cenik.html">Premium</a>.
                    Zápisky si zatím můžeš zkopírovat. Přihlášení a členství můžeš otevřít později.
                </div>`;
        }
    }

    async function saveJournal() {
        const notes    = document.getElementById('journal-notes');
        const savedMsg = document.getElementById('journal-saved');
        const button = document.getElementById('btn-save-journal');
        if (!notes || journalSavePending) return;
        const text = notes.value.trim();
        const showStatus = (message, error = false) => {
            if (!savedMsg) return;
            savedMsg.textContent = message;
            savedMsg.setAttribute('role', error ? 'alert' : 'status');
            savedMsg.hidden = false;
            savedMsg.classList.add('journal-saved-msg--visible');
        };
        if (!text) { showStatus('Nejdřív napiš krátkou poznámku.', true); return; }
        if (savedJournalText === text) { showStatus('Tento zápis už je uložený v deníku.'); return; }
        journalSavePending = true;
        if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
        try {
            await window.Auth?.refreshSession?.();
            const profile = await window.Auth?.getProfile?.();
            if (!journalOwnerId || profile?.id !== journalOwnerId || window.Auth?.user?.id !== journalOwnerId) {
                throw new Error('Journal account changed or expired');
            }
            const content = `${ritual.nazev}\n${getTodayStr()}\nNálada: ${MOOD_LABELS[moodBefore]} → ${MOOD_LABELS[moodAfter]}\n\n${text}`;
            const saved = await window.Auth.saveReading('journal', content);
            if (window.Auth?.user?.id !== journalOwnerId) throw new Error('Journal account changed');
            if (!saved?.id) throw new Error('Journal save not confirmed');
            savedJournalText = text;
            showStatus('Zápisky jsou uložené v deníku tvého profilu.');
        } catch (error) {
            console.warn('[Ritual] Journal save not confirmed:', error.message);
            showStatus('Uložení se nepodařilo potvrdit. Text zůstává tady. Zkontroluj přihlášení a zkus to znovu.', true);
        } finally {
            journalSavePending = false;
            if (button) {
                button.disabled = savedJournalText === notes.value.trim();
                button.removeAttribute('aria-busy');
            }
        }
    }

    /* ── INICIALIZACE ────────────────────────────────────────────── */
    function init() {
        if (!window.RitualContent) {
            setTimeout(init, 60);
            return;
        }

        const { phase, sign } = parseParams();
        ritual = window.RitualContent.getRitual(phase, sign);

        // Header
        const headerName = document.getElementById('header-ritual-name');
        if (headerName) headerName.textContent = ritual.nazev;

        // Uložit poslední sign
        setLS('mh_ritual_sign', sign);

        // Before check-in — výběr nálady
        document.querySelectorAll('#screen-checkin-before .emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                moodBefore = parseInt(btn.dataset.mood, 10);
                // Přejít na kroky
                showScreen(SCREENS.STEP);
                renderStep(0);
                updateProgress(0);
            });
        });

        // Tlačítko "Jsem připraven/a"
        const btnNext = document.getElementById('btn-next');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                currentStep++;
                if (currentStep < ritual.kroky.length) {
                    renderStep(currentStep);
                } else {
                    // Všechny kroky hotovy → after check-in
                    showScreen(SCREENS.AFTER);
                    updateProgress(6);
                    const counter = document.getElementById('step-counter');
                    if (counter) counter.textContent = 'Reflexe';
                }
            });
        }

        // After check-in
        document.querySelectorAll('#screen-checkin-after .emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                moodAfter = parseInt(btn.dataset.mood, 10);
                showCompletion();
            });
        });

        // Ukázat první screen
        showScreen(SCREENS.BEFORE);
        updateProgress(-1);
        const counter = document.getElementById('step-counter');
        if (counter) counter.textContent = 'Příprava';
    }

    /* ── Start ───────────────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
