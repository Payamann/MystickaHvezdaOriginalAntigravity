import { jest } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

jest.unstable_mockModule('../../js/profile/shared.js', () => ({
    profileIconMarkup: name => `<svg data-icon="${name}"></svg>`,
    escapeHtml: value => String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]),
    apiUrl: () => '/api',
    authHeaders: () => ({}),
    getReadingIcon: () => '',
    getReadingLabel: reading => reading.type,
    getReadingPreview: reading => reading?.data?.question || '',
    READING_FILTERS: [{ value: 'all', label: 'Vše' }]
}));

const readings = await import('../../js/profile/readings.js');
const originalGlobals = Object.fromEntries(['document', 'window', 'fetch'].map(key => [key, globalThis[key]]));
const dashboardSource = fs.readFileSync(path.resolve(process.cwd(), 'js/profile/dashboard.js'), 'utf8')
    .replace(/^import\s+[\s\S]*?;\s*$/gm, '');

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

function response(reading, favorites = Number(Boolean(reading?.is_favorite))) {
    return {
        ok: true,
        json: async () => ({
            success: true,
            readings: reading ? [reading] : [],
            pagination: { page: 1, total: reading ? 1 : 0, totalPages: 1 },
            summary: { total: reading ? 1 : 0, favorites }
        })
    };
}

function makeElement() {
    const classes = new Set();
    return {
        hidden: false, innerHTML: '', textContent: '',
        classList: {
            contains: name => classes.has(name),
            add: name => classes.add(name),
            remove: name => classes.delete(name),
            toggle: (name, force) => force ? classes.add(name) : classes.delete(name)
        },
        replaceChildren() { this.innerHTML = ''; }
    };
}

function createDashboardHarness() {
    const ids = [
        'readings-list', 'readings-pagination', 'readings-load-more', 'tab-favorites',
        'profile-context-status', 'journal-entries', 'ritual-memory-strength',
        'ritual-memory-copy', 'ritual-memory-themes', 'ritual-memory-actions',
        'daily-guidance-title', 'daily-guidance-date', 'daily-guidance-plan',
        'daily-guidance-copy', 'daily-guidance-focus', 'daily-guidance-actions', 'user-plan'
    ];
    const nodes = Object.fromEntries(ids.map(id => [id, makeElement()]));
    nodes['tab-favorites'].classList.add('is-active');

    const document = {
        body: makeElement(),
        getElementById: id => nodes[id] || null,
        addEventListener() {},
        querySelector() { return null; },
        querySelectorAll() { return []; },
        createElement() { return makeElement(); }
    };
    const window = {
        Auth: { user: { id: 'synthetic-user' }, isLoggedIn: () => true },
        MH_ANALYTICS: { trackEvent: jest.fn(), trackCTA: jest.fn() },
        matchMedia: () => ({ matches: true }),
        location: { hash: '', origin: 'https://local.invalid' }
    };
    const noop = () => {};
    const context = vm.createContext({
        document, window, console,
        CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
        fetch: (...args) => globalThis.fetch(...args),
        URL, URLSearchParams,
        setTimeout, clearTimeout,
    escapeHtml: value => String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]),
        apiUrl: () => '/api', authHeaders: () => ({}), authHeadersWithCsrf: async () => ({}),
        getZodiacSign: noop, getZodiacIconName: noop, getReadingTitle: type => type,
        getReadingLabel: reading => reading.type,
        getReadingPreview: reading => reading?.data?.question || '',
        loadPlanManifest: async () => {}, normalizePlanType: value => value,
        formatPlanLabel: value => value, profileIconMarkup: noop, renderProfileAvatar: noop,
        loadReadings: readings.loadReadings, showMoreReadings: noop, handleFilterChange: noop,
        getReadingSummary: readings.getReadingSummary, initReadingFilters: noop, resetReadingsState: noop,
        loadProfileContext: (...args) => globalThis.__loadProfileContext(...args),
        PROFILE_CONTEXT_LIMIT: 100, readJournalDraft: () => '', writeJournalDraft: noop,
        loadFavorites: (...args) => globalThis.__loadFavorites(...args), resetFavoritesState: noop,
        toggleAvatarPicker: noop, selectAvatar: noop, loadSubscriptionStatus: noop,
        initSettingsForm: noop, initAvatarPicker: noop, saveSettings: noop, changePassword: noop,
        viewReading: (...args) => globalThis.__viewReading(...args), closeReadingModal: noop, toggleFavoriteModal: noop,
        toggleFavorite: noop, deleteReading: noop, verifyCheckoutResult: noop
    });

    vm.runInContext(`${dashboardSource}\n;globalThis.__profileTest = {
        refreshProfileData,
        renderProfileOverview,
        renderJournalEntries,
        renderDailyGuidance,
        handleDailyGuidanceClick,
        setState(value) { profileState = value; },
        getState() { return profileState; },
        setRenderers(renderers) {
            renderDailyGuidance = renderers.daily || (() => {});
            renderActivationChecklist = renderers.checklist || (() => {});
            updateStats = renderers.stats || (() => {});
            renderRitualMemory = renderers.memory || (() => {});
            renderJournalEntries = renderers.journals || (() => {});
        }
    };`, context);

    return { context, nodes, document, window };
}

let dashboard;
let journalRenders;
let favoriteLoads;

beforeEach(async () => {
    globalThis.fetch = jest.fn();
    globalThis.__viewReading = jest.fn();
    journalRenders = [];
    favoriteLoads = [];
    globalThis.__loadProfileContext = jest.fn(async () => ({ readings: [], journals: [] }));
    globalThis.__loadFavorites = jest.fn(async (...args) => favoriteLoads.push(args));
    dashboard = createDashboardHarness();
    globalThis.document = dashboard.document;
    globalThis.window = dashboard.window;
    readings.resetReadingsState();
    dashboard.context.__profileTest.setRenderers({ journals: entries => {
        journalRenders.push(entries);
        dashboard.context.__profileTest.renderJournalEntries(entries);
    } });
});

afterEach(() => {
    delete globalThis.__loadProfileContext;
    delete globalThis.__loadFavorites;
    delete globalThis.__viewReading;
    for (const [key, value] of Object.entries(originalGlobals)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
    }
});

test('favorite refresh supersedes an older in-flight history snapshot', async () => {
    const initial = { id: 'r1', type: 'tarot', is_favorite: false, created_at: '2026-10-16T10:00:00Z' };
    fetch.mockResolvedValueOnce(response(initial, 0));
    await readings.loadReadings();
    dashboard.context.__profileTest.setState({ user: null, subscription: null, context: { readings: [initial], journals: [] } });

    const stale = deferred();
    fetch.mockReturnValueOnce(stale.promise);
    const fullRefresh = dashboard.context.__profileTest.refreshProfileData();
    await Promise.resolve();

    // Model a successful favorite PATCH and its immediate local state update.
    readings.updateReading('r1', { is_favorite: true });
    readings.updateFavoriteSummary(false, true);
    fetch.mockResolvedValueOnce(response({ ...initial, is_favorite: true }, 1));
    await dashboard.context.__profileTest.refreshProfileData({ favoriteOnly: true });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(globalThis.__loadProfileContext).toHaveBeenCalledTimes(1);

    stale.resolve(response({ ...initial, is_favorite: false }, 0));
    await fullRefresh;

    expect(readings.getAllReadings().find(reading => reading.id === 'r1').is_favorite).toBe(true);
    expect(readings.getReadingSummary().favorites).toBe(1);
});

test('full delete refresh replaces journal context and refreshes active favorites through overlap', async () => {
    const oldJournal = { id: 'old-note', type: 'journal', data: 'Stará poznámka', created_at: '2026-10-15T10:00:00Z' };
    const freshJournal = { id: 'new-note', type: 'journal', data: 'Aktuální poznámka', created_at: '2026-10-16T10:00:00Z' };
    dashboard.context.__profileTest.setState({ user: null, subscription: null, context: { readings: [], journals: [oldJournal] } });
    dashboard.context.__profileTest.renderProfileOverview();
    expect(dashboard.nodes['journal-entries'].innerHTML).toContain('old-note');
    globalThis.__loadProfileContext
        .mockResolvedValueOnce({ readings: [], journals: [freshJournal] });
    fetch.mockResolvedValueOnce(response(null, 0));

    await dashboard.context.__profileTest.refreshProfileData();

    expect(journalRenders.at(-1)).toEqual([freshJournal]);
    expect(dashboard.nodes['journal-entries'].innerHTML).not.toContain('old-note');
    expect(dashboard.nodes['journal-entries'].innerHTML).toContain('new-note');
    expect(favoriteLoads).toHaveLength(1);

    const newerJournal = { id: 'newer-note', type: 'journal', data: 'Novější poznámka', created_at: '2026-10-17T10:00:00Z' };
    const contextRequest = deferred();
    globalThis.__loadProfileContext.mockReturnValueOnce(contextRequest.promise);
    fetch.mockResolvedValueOnce(response(null, 0));
    const fullRefresh = dashboard.context.__profileTest.refreshProfileData();
    await Promise.resolve();
    fetch.mockResolvedValueOnce(response(null, 0));
    await dashboard.context.__profileTest.refreshProfileData({ favoriteOnly: true });
    expect(globalThis.__loadProfileContext).toHaveBeenCalledTimes(2);
    contextRequest.resolve({ readings: [], journals: [newerJournal] });
    await fullRefresh;

    expect(journalRenders.at(-1)).toEqual([newerJournal]);
    expect(favoriteLoads).toHaveLength(3);
});

test('failed context refresh renders unavailable state instead of stale or empty notes', async () => {
    dashboard.context.__profileTest.setState({ user: null, subscription: null, context: null });

    dashboard.context.__profileTest.renderProfileOverview();

    expect(dashboard.nodes['journal-entries'].innerHTML).toContain('Poznámky se nepodařilo načíst');
    expect(dashboard.nodes['ritual-memory-strength'].textContent).toBe('Nedostupné podklady');
    expect(dashboard.nodes['ritual-memory-copy'].textContent).toContain('Obnovit přehled');
});

test('daily guidance links to the newest dated saved reading and opens that exact record', () => {
    const readingId = 'reading"><img src=x onerror=alert(1)>';
    const privateQuestion = 'Question <img src=x onerror=alert(1)>';
    const readings = [
        { id: 'older-reading', type: 'tarot', created_at: '2026-10-15T10:00:00Z', data: { question: 'Older private question' } },
        { id: readingId, type: 'natal', created_at: '2026-10-16T10:00:00Z', data: { question: privateQuestion } },
        { id: 'newer-journal', type: 'journal', created_at: '2026-10-17T10:00:00Z', data: 'Private journal text' },
        { id: 'invalid-date', type: 'tarot', created_at: 'not-a-date', data: {} },
        { type: 'tarot', created_at: '2026-10-18T10:00:00Z', data: { question: 'No ID' } }
    ];
    const hook = dashboard.context.__profileTest;

    hook.renderDailyGuidance(null, readings, null);

    const markup = dashboard.nodes['daily-guidance-actions'].innerHTML;
    expect(dashboard.nodes['daily-guidance-title'].textContent).toBe('Tvůj poslední výklad');
    expect(markup).toContain('data-daily-action="last_reading"');
    expect(markup).toContain('data-reading-id="reading&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"');
    expect(markup.match(/class="daily-guidance-action/g)).toHaveLength(3);
    expect(markup).not.toContain('newer-journal');
    expect(markup).not.toContain(privateQuestion);
    expect(markup).toContain('Question &lt;img src=x onerror=alert(1)&gt;');

    const link = {
        dataset: { dailyAction: 'last_reading', readingId },
        getAttribute: () => null
    };
    let prevented = false;
    hook.handleDailyGuidanceClick({
        target: { closest: selector => selector === '[data-daily-action]' ? link : null },
        preventDefault() { prevented = true; }
    });

    expect(prevented).toBe(true);
    expect(globalThis.__viewReading).toHaveBeenCalledWith(readingId);
    const analytics = dashboard.window.MH_ANALYTICS.trackCTA.mock.calls;
    expect(analytics).toHaveLength(1);
    expect(JSON.stringify(analytics)).not.toContain(readingId);
    expect(JSON.stringify(analytics)).not.toContain(privateQuestion);
    expect(fetch).not.toHaveBeenCalled();
});

test('journal-only daily guidance does not invent a last-reading link', () => {
    dashboard.context.__profileTest.renderDailyGuidance(null, [
        { id: 'only-journal', type: 'journal', created_at: '2026-10-17T10:00:00Z', data: 'Private note' }
    ], null);

    const markup = dashboard.nodes['daily-guidance-actions'].innerHTML;
    expect(markup).not.toContain('data-daily-action="last_reading"');
    expect(markup).toContain('Otevřít dnešní horoskop');
    expect(markup).toContain('Otevřít kartu dne');
});

test.each([
    ['active', 'premium_monthly', true],
    ['trialing', 'premium_monthly', true],
    ['cancel_pending', 'premium_monthly', true],
    ['paused', 'Přístup pozastavený', false],
    ['past_due', 'Čeká na platbu', false],
    ['canceled', 'free', false],
    ['cancelled', 'free', false],
    ['unexpected', 'Stav není ověřený', false],
    [null, 'Stav není ověřený', false]
])('verified %s status controls both access badges despite cached premium plan', (status, label, premium) => {
    const user = { id: 'synthetic-user', subscription_status: 'premium_monthly' };
    const subscription = status ? { planType: 'premium_monthly', status } : null;
    const hook = dashboard.context.__profileTest;
    hook.setState({ user, subscription, context: { readings: [], journals: [] } });
    hook.renderProfileOverview();
    hook.renderDailyGuidance(user, [], subscription);

    for (const id of ['user-plan', 'daily-guidance-plan']) {
        expect(dashboard.nodes[id].textContent).toBe(label);
        expect(dashboard.nodes[id].className.includes('badge--premium')).toBe(premium);
    }
});
