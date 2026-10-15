import { jest } from '@jest/globals';

const originals = Object.fromEntries(['fetch', 'document', 'window', 'confirm', 'CustomEvent'].map(key => [key, globalThis[key]]));
const loadReadings = jest.fn(async () => []);
const updateFavoriteSummary = jest.fn();
jest.unstable_mockModule('../../js/profile/shared.js', () => ({
    escapeHtml: value => String(value ?? ''), apiUrl: () => '/api', authHeaders: () => ({}),
    authHeadersWithCsrf: async () => ({}), getReadingIcon: () => '', getReadingTitle: () => 'Poznámka'
}));
jest.unstable_mockModule('../../js/profile/readings.js', () => ({
    getAllReadings: () => [], updateReading: jest.fn(), renderReadings: jest.fn(),
    loadReadings, updateFavoriteSummary
}));
jest.unstable_mockModule('../../js/profile/favorites.js', () => ({ loadFavorites: jest.fn() }));
const { viewReading, closeReadingModal, toggleFavoriteModal, deleteReading } = await import('../../js/profile/modal.js');

let nodes;
let listeners;
let trigger;
function element() {
    const classes = new Set();
    return {
        hidden: false, disabled: false, innerHTML: '', textContent: '', attrs: {}, isConnected: true,
        offsetParent: {}, dataset: {},
        classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) },
        setAttribute(key, value) { this.attrs[key] = value; },
        focus() { document.activeElement = this; },
        closest: () => null, querySelector: () => null, querySelectorAll: () => []
    };
}
function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}
const detail = (id, favorite = false) => ({ ok: true, json: async () => ({
    reading: { id, is_favorite: favorite, type: 'journal', data: `Content ${id}`, created_at: '2026-10-15T09:00:00Z' }
}) });
const favoriteResponse = favorite => ({ ok: true, json: async () => ({ is_favorite: favorite }) });
function expectActionsDisabled(disabled) {
    expect(nodes['modal-favorite-btn'].disabled).toBe(disabled);
    expect(nodes['modal-delete-btn'].disabled).toBe(disabled);
}
beforeEach(() => {
    jest.clearAllMocks();
    nodes = Object.fromEntries(['reading-modal', 'reading-modal-content', 'modal-favorite-btn', 'modal-delete-btn', 'reading-modal-close'].map(id => [id, element()]));
    listeners = new Set();
    trigger = element();
    globalThis.document = {
        activeElement: trigger, getElementById: id => nodes[id] || null,
        querySelector: () => null, querySelectorAll: () => [], dispatchEvent: jest.fn(),
        addEventListener: (type, handler) => listeners.add(handler),
        removeEventListener: (type, handler) => listeners.delete(handler)
    };
    nodes['reading-modal'].querySelector = selector => selector === '.modal__close' ? nodes['reading-modal-close'] : null;
    nodes['reading-modal'].querySelectorAll = () => [nodes['reading-modal-close'], nodes['modal-favorite-btn'], nodes['modal-delete-btn']].filter(node => !node.disabled);
    globalThis.window = { Auth: { showToast: jest.fn() } };
    globalThis.confirm = jest.fn(() => true);
    globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
    globalThis.fetch = jest.fn();
});
afterEach(() => closeReadingModal());
afterAll(() => Object.entries(originals).forEach(([key, value]) => {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
}));

test('late A cannot overwrite B, even if the transport ignores abort', async () => {
    const a = deferred();
    fetch.mockReturnValueOnce(a.promise).mockResolvedValueOnce(detail('B'));
    const first = viewReading('A');
    const signal = fetch.mock.calls[0][1].signal;
    expectActionsDisabled(true);
    closeReadingModal();
    await viewReading('B');
    a.resolve(detail('A'));
    await first;
    expect(signal.aborted).toBe(true);
    expect(nodes['reading-modal-content'].innerHTML).toContain('Content B');
    expectActionsDisabled(false);
    fetch.mockResolvedValueOnce(favoriteResponse(true));
    await toggleFavoriteModal();
    expect(fetch.mock.calls.at(-1)[0]).toBe('/api/user/readings/B/favorite');
});

test('a late body or error cannot replace a new detail or its loading state', async () => {
    const body = deferred();
    const b = deferred();
    fetch.mockResolvedValueOnce({ ok: true, json: () => body.promise }).mockReturnValueOnce(b.promise);
    const first = viewReading('A');
    await Promise.resolve();
    const second = viewReading('B');
    body.reject(new Error('old response failed'));
    await first;
    expect(nodes['reading-modal-content'].attrs['aria-busy']).toBe('true');
    expect(nodes['reading-modal-content'].innerHTML).toContain('Načítání');
    expectActionsDisabled(true);
    b.resolve(detail('B'));
    await second;
});

test('closing invalidates late responses, disables actions, and restores focus', async () => {
    const request = deferred();
    fetch.mockReturnValueOnce(request.promise);
    const opening = viewReading('A');
    closeReadingModal();
    request.resolve(detail('A'));
    await opening;
    expect(nodes['reading-modal'].hidden).toBe(true);
    expect(nodes['reading-modal-content'].innerHTML).not.toContain('Content A');
    expectActionsDisabled(true);
    expect(document.activeElement).toBe(trigger);
    expect(listeners.size).toBe(0);
});

test.each(['loading', 'error', 'wrong-id'])('actions fail closed during %s', async state => {
    const request = deferred();
    fetch.mockReturnValueOnce(request.promise);
    const opening = viewReading('A');
    if (state === 'error') { request.reject(new Error('offline')); await opening; }
    if (state === 'wrong-id') { request.resolve(detail('B')); await opening; }
    expectActionsDisabled(true);
    await toggleFavoriteModal();
    await deleteReading();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
    if (state === 'loading') { request.resolve(detail('A')); await opening; }
    else expect(nodes['reading-modal-content'].attrs['aria-busy']).toBe('false');
});

test('switching details keeps exactly one focus trap and the original return target', async () => {
    fetch.mockResolvedValueOnce(detail('A')).mockResolvedValueOnce(detail('B'));
    await viewReading('A');
    await viewReading('B');
    expect(listeners.size).toBe(1);
    closeReadingModal();
    expect(listeners.size).toBe(0);
    expect(document.activeElement).toBe(trigger);
});

test('pending favorite blocks duplicate mutation and cannot change another detail', async () => {
    const mutation = deferred();
    fetch.mockResolvedValueOnce(detail('A')).mockReturnValueOnce(mutation.promise).mockResolvedValueOnce(detail('B'));
    await viewReading('A');
    const saving = toggleFavoriteModal();
    await Promise.resolve();
    expectActionsDisabled(true);
    await toggleFavoriteModal();
    await deleteReading();
    expect(confirm).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(2);
    await viewReading('B');
    mutation.resolve(favoriteResponse(true));
    await saving;
    expect(nodes['modal-favorite-btn'].textContent).toContain('Přidat');
    expectActionsDisabled(false);
    expect(updateFavoriteSummary).toHaveBeenCalledWith(false, true);
});

test('failed favorite reenables actions for the same loaded detail', async () => {
    fetch.mockResolvedValueOnce(detail('A')).mockRejectedValueOnce(new Error('offline'));
    await viewReading('A');
    await toggleFavoriteModal();
    expectActionsDisabled(false);
    expect(nodes['modal-favorite-btn'].textContent).toContain('Přidat');
});

test('delete captures A, blocks duplicates, and its completion cannot close B', async () => {
    const mutation = deferred();
    fetch.mockResolvedValueOnce(detail('A')).mockReturnValueOnce(mutation.promise).mockResolvedValueOnce(detail('B'));
    await viewReading('A');
    const deleting = deleteReading();
    await Promise.resolve();
    expectActionsDisabled(true);
    await deleteReading();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[1]).toEqual(['/api/user/readings/A', expect.objectContaining({ method: 'DELETE' })]);
    await viewReading('B');
    mutation.resolve({ ok: true });
    await deleting;
    expect(nodes['reading-modal'].hidden).toBe(false);
    expect(nodes['reading-modal-content'].innerHTML).toContain('Content B');
    expectActionsDisabled(false);
    expect(loadReadings).toHaveBeenCalledTimes(1);
});

test('failed delete keeps the loaded detail available for retry', async () => {
    fetch.mockResolvedValueOnce(detail('A')).mockResolvedValueOnce({ ok: false });
    await viewReading('A');
    await deleteReading();
    expect(nodes['reading-modal'].hidden).toBe(false);
    expectActionsDisabled(false);
    expect(loadReadings).not.toHaveBeenCalled();
});
