import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const source = fs.readFileSync(path.resolve(process.cwd(), 'js/ritualy-session.js'), 'utf8');

function makeElement(id = '') {
    const listeners = {};
    const classes = new Set();
    return {
        id, hidden: false, disabled: false, value: '', textContent: '', innerHTML: '', dataset: {}, attrs: {}, isConnected: true,
        classList: {
            add: value => classes.add(value),
            remove: value => classes.delete(value),
            contains: value => classes.has(value)
        },
        addEventListener(type, handler) { listeners[type] = handler; },
        focus() {},
        click() { return listeners.click?.(); },
        setAttribute(name, value) { this.attrs[name] = value; },
        removeAttribute(name) { delete this.attrs[name]; }
        ,querySelector() { return null; }
    };
}

function deferred() {
    let resolve;
    const promise = new Promise(yes => { resolve = yes; });
    return { promise, resolve };
}

function createSession({ profileId = 'user-1', currentUserId = profileId, saveReading = async () => ({ id: 'reading-1' }), withBreathGuide = false, reducedMotion = false } = {}) {
    const ids = [
        'screen-checkin-before', 'screen-step', 'screen-checkin-after', 'screen-completion', 'progress-bar',
        'step-counter', 'header-ritual-name', 'btn-next', 'step-label', 'step-title', 'step-text',
        'step-subtext', 'completion-subtitle', 'mood-shift', 'streak-number', 'streak-label',
        'journal-prompts-list', 'journal-action', 'journal-notes', 'journal-saved', 'btn-save-journal'
    ];
    if (withBreathGuide) ids.push('breath-container', 'breath-circle', 'breath-label', 'breath-counter');
    const nodes = Object.fromEntries(ids.map(id => [id, makeElement(id)]));
    nodes['journal-notes'].value = '  Moje reflexe  ';
    const beforeMood = makeElement('mood-before');
    beforeMood.dataset.mood = '3';
    const afterMood = makeElement('mood-after');
    afterMood.dataset.mood = '5';
    const localStorage = new Map();
    const Auth = {
        user: { id: currentUserId },
        isLoggedIn: () => Boolean(Auth.user?.id),
        isPremium: () => true,
        getProfile: async () => ({ id: profileId }),
        saveReading
    };
    const documentListeners = {};
    const document = {
        readyState: 'complete',
        getElementById: id => nodes[id] || null,
        querySelectorAll: selector => selector === '#screen-checkin-before .emoji-btn'
            ? [beforeMood]
            : selector === '#screen-checkin-after .emoji-btn' ? [afterMood] : [],
        createElement: () => makeElement(),
        addEventListener(type, handler) { documentListeners[type] = handler; },
        dispatchEvent(event) { documentListeners[event.type]?.(event); }
    };
    const window = {
        addEventListener() {}, removeEventListener() {},
        location: { search: '' },
        matchMedia: query => ({ matches: reducedMotion && query === '(prefers-reduced-motion: reduce)' }),
        Auth,
        RitualContent: {
            getRitual: () => ({
                nazev: 'Večerní ztišení',
                kroky: [{ cislo: 1, title: 'Zastav se', text: 'Nadechni se.', subtext: '' }],
                journalPrompts: ['Co si chceš zapamatovat?']
            })
        }
    };
    const scheduledTimeouts = [];
    vm.runInNewContext(source, {
        window, document, console: { warn() {} }, URLSearchParams,
        setTimeout: (callback, delay) => scheduledTimeouts.push({ callback, delay }),
        localStorage: {
            getItem: key => localStorage.get(key) ?? null,
            setItem: (key, value) => localStorage.set(key, String(value))
        },
        Date
    });

    beforeMood.click();
    nodes['btn-next'].click();
    afterMood.click();
    return { nodes, Auth, document, scheduledTimeouts };
}

test('reduced motion leaves the breathing prompt optional and unlocks continue immediately', () => {
    const { nodes, scheduledTimeouts } = createSession({ withBreathGuide: true, reducedMotion: true });

    expect(nodes['breath-container'].hidden).toBe(false);
    expect(nodes['breath-container'].classList.contains('ritual-breath-visible')).toBe(true);
    expect(nodes['breath-circle'].className).toBe('breath-guide');
    expect(nodes['breath-label'].textContent).toBe('Pokud chceš, zkus tři pohodlné nádechy vlastním tempem.');
    expect(nodes['breath-counter'].textContent).toBe('');
    expect(nodes['btn-next'].hidden).toBe(false);
    expect(scheduledTimeouts).toHaveLength(0);
});

test('confirmed reading id shows success and saves the after-session mood', async () => {
    const saveReading = jest.fn(async () => ({ id: 'reading-42' }));
    const { nodes } = createSession({ saveReading });

    await nodes['btn-save-journal'].click();

    expect(saveReading).toHaveBeenCalledTimes(1);
    expect(saveReading.mock.calls[0][0]).toBe('journal');
    expect(saveReading.mock.calls[0][1]).toContain('Nálada: Klid → Skvěle');
    expect(saveReading.mock.calls[0][1]).toContain('Moje reflexe');
    expect(nodes['journal-saved'].textContent).toBe('Zápisky jsou uložené v deníku tvého profilu.');
    expect(nodes['journal-saved'].attrs.role).toBe('status');
    expect(nodes['btn-save-journal'].disabled).toBe(true);
    expect(nodes['progress-bar'].attrs['aria-valuenow']).toBe(100);
});

test('unconfirmed save keeps the note and allows retry', async () => {
    const saveReading = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'reading-43' });
    const { nodes } = createSession({ saveReading });

    await nodes['btn-save-journal'].click();

    expect(nodes['journal-notes'].value).toBe('  Moje reflexe  ');
    expect(nodes['journal-saved'].textContent).toContain('Text zůstává tady.');
    expect(nodes['journal-saved'].attrs.role).toBe('alert');
    expect(nodes['btn-save-journal'].disabled).toBe(false);

    await nodes['btn-save-journal'].click();

    expect(saveReading).toHaveBeenCalledTimes(2);
    expect(nodes['journal-saved'].textContent).toBe('Zápisky jsou uložené v deníku tvého profilu.');
});

test('pending save ignores a second click', async () => {
    const saving = deferred();
    const started = deferred();
    const saveReading = jest.fn(() => { started.resolve(); return saving.promise; });
    const { nodes } = createSession({ saveReading });

    const firstClick = nodes['btn-save-journal'].click();
    const secondClick = nodes['btn-save-journal'].click();
    await started.promise;
    expect(saveReading).toHaveBeenCalledTimes(1);
    expect(nodes['btn-save-journal'].disabled).toBe(true);
    expect(nodes['btn-save-journal'].attrs['aria-busy']).toBe('true');

    saving.resolve({ id: 'reading-44' });
    await firstClick;
    await secondClick;
    expect(saveReading).toHaveBeenCalledTimes(1);
});

test('profile mismatch after fetching profile prevents saving', async () => {
    const saveReading = jest.fn(async () => ({ id: 'should-not-save' }));
    const { nodes } = createSession({ profileId: 'user-2', currentUserId: 'user-1', saveReading });

    await nodes['btn-save-journal'].click();

    expect(saveReading).not.toHaveBeenCalled();
    expect(nodes['journal-notes'].value).toBe('  Moje reflexe  ');
    expect(nodes['journal-saved'].textContent).toContain('Text zůstává tady.');
    expect(nodes['btn-save-journal'].disabled).toBe(false);
});

test('changing accounts clears the previous account ritual journal', () => {
    const { nodes, Auth, document } = createSession();

    Auth.user = { id: 'user-2' };
    document.dispatchEvent({ type: 'auth:changed' });

    expect(nodes['journal-notes'].value).toBe('');
    expect(nodes['journal-saved'].hidden).toBe(true);
    expect(nodes['screen-checkin-before'].classList.contains('active')).toBe(true);
});

test('a pending journal save cannot update the interface after an account switch', async () => {
    const saving = deferred();
    const started = deferred();
    const saveReading = jest.fn(() => { started.resolve(); return saving.promise; });
    const { nodes, Auth, document } = createSession({ saveReading });

    const save = nodes['btn-save-journal'].click();
    await started.promise;
    Auth.user = { id: 'user-2' };
    document.dispatchEvent({ type: 'auth:changed' });
    expect(nodes['journal-notes'].value).toBe('');

    saving.resolve({ id: 'reading-old-account' });
    await save;

    expect(nodes['journal-saved'].hidden).toBe(true);
    expect(nodes['journal-notes'].value).toBe('');
});

test('journal status keeps the shared icon while its message and state change', async () => {
    const saveReading = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'reading-45' });
    const { nodes } = createSession({ saveReading });
    const message = makeElement('journal-saved-text');
    const iconUse = makeElement('journal-saved-icon-use');
    nodes['journal-saved'].querySelector = selector => {
        if (selector === '[data-journal-saved-text]') return message;
        if (selector === '[data-journal-saved-icon] use') return iconUse;
        return null;
    };

    await nodes['btn-save-journal'].click();
    expect(message.textContent).toContain('Text zůstává tady.');
    expect(iconUse.attrs.href).toBe('/img/icons/mh-symbols.svg#warning');
    expect(nodes['journal-saved'].attrs.role).toBe('alert');

    await nodes['btn-save-journal'].click();
    expect(message.textContent).toBe('Zápisky jsou uložené v deníku tvého profilu.');
    expect(iconUse.attrs.href).toBe('/img/icons/mh-symbols.svg#check');
    expect(nodes['journal-saved'].attrs.role).toBe('status');
});
