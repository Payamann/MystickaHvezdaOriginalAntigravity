import { jest } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../js/auth-client.js', import.meta.url), 'utf8');

function session() {
    const initial = { id: 'owner-a', birth_date: '1990-08-10', subscription_status: 'free' };
    const cache = new Map([['auth_user', JSON.stringify(initial)]]);
    const localStorage = { getItem: key => cache.get(key) ?? null, setItem: (key, value) => cache.set(key, value), removeItem: key => cache.delete(key) };
    const document = { cookie: 'logged_in=1', addEventListener: jest.fn(), dispatchEvent: jest.fn() };
    const window = { addEventListener: jest.fn(), location: { origin: 'https://local.invalid', pathname: '/profil.html' } };
    const context = { window, document, localStorage, console, URL, URLSearchParams, Event, setTimeout, clearTimeout, setInterval, fetch: jest.fn() };
    vm.runInNewContext(source, context);
    window.Auth.updateUI = jest.fn();
    return { auth: window.Auth, cache, context };
}

test('a pending refresh cannot overwrite a confirmed local profile save', async () => {
    const { auth, cache } = session();
    let resolve;
    auth.getProfile = jest.fn(() => new Promise(done => { resolve = done; }));
    const refreshing = auth.refreshSession();
    auth.user = { ...auth.user, birth_date: null };
    cache.set('auth_user', JSON.stringify(auth.user));
    resolve({ id: 'owner-a', birth_date: '1990-08-10', subscription_status: 'free' });
    await refreshing;
    expect(auth.user.birth_date).toBeNull();
    expect(JSON.parse(cache.get('auth_user')).birth_date).toBeNull();
    expect(auth.updateUI).not.toHaveBeenCalled();
});

test('a pending refresh cannot replace a newly active account', async () => {
    const { auth } = session();
    let resolve;
    auth.getProfile = jest.fn(() => new Promise(done => { resolve = done; }));
    const refreshing = auth.refreshSession();
    auth.user = { id: 'owner-b', subscription_status: 'free' };
    resolve({ id: 'owner-a', subscription_status: 'premium_monthly' });
    await refreshing;
    expect(auth.user.id).toBe('owner-b');
});

test('an unchanged account accepts the fresh server profile', async () => {
    const { auth, cache } = session();
    auth.getProfile = jest.fn(async () => ({ id: 'owner-a', subscription_status: 'premium_monthly' }));
    await auth.refreshSession();
    expect(auth.user.subscription_status).toBe('premium_monthly');
    expect(JSON.parse(cache.get('auth_user')).subscription_status).toBe('premium_monthly');
    expect(auth.updateUI).toHaveBeenCalledTimes(1);
});

test('a late unauthorized response for another account cannot clear the current session', async () => {
    const { auth, context } = session();
    let resolve;
    context.fetch.mockImplementation(() => new Promise(done => { resolve = done; }));
    auth.clearStaleSession = jest.fn();
    const profile = auth.getProfile();
    auth.user = { id: 'owner-b', subscription_status: 'free' };
    resolve({ status: 401 });
    await expect(profile).resolves.toBeNull();
    expect(auth.clearStaleSession).not.toHaveBeenCalled();
});

test('the recovery page owns its token without a competing login modal', () => {
    const { auth, context } = session();
    auth.isStandaloneAuthPage = jest.fn(() => true);
    context.window.location.search = '?reset=true';
    context.window.location.hash = '#access_token=synthetic-recovery&type=recovery';
    context.history = { replaceState: jest.fn() };
    context.setTimeout = jest.fn();
    auth.openModal = jest.fn();
    auth.handleRedirect();
    expect(context.window.location.hash).toContain('synthetic-recovery');
    expect(context.history.replaceState).not.toHaveBeenCalled();
    expect(context.setTimeout).not.toHaveBeenCalled();
    expect(auth.openModal).not.toHaveBeenCalled();
});


function readingSession() {
    const fixture = session();
    fixture.auth.trackEventSafely = jest.fn();
    fixture.context.window.dispatchEvent = jest.fn();
    fixture.context.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
    fixture.changeOwner = id => {
        fixture.auth.user = { id };
        for (const [event, callback] of fixture.context.document.addEventListener.mock.calls) {
            if (event === 'auth:changed') callback();
        }
    };
    return fixture;
}

test('saveReading sends the captured owner required by the readings endpoint', async () => {
    const { auth, context } = readingSession();
    context.fetch.mockResolvedValue({ ok: true, json: async () => ({ reading: { id: 'saved' } }) });
    await expect(auth.saveReading('numerology', { response: 'Private' })).resolves.toEqual({ id: 'saved' });
    expect(JSON.parse(context.fetch.mock.calls[0][1].body).expectedUserId).toBe('owner-a');
    expect(context.window.dispatchEvent).toHaveBeenCalledTimes(1);
});

test('saveReading rejects a supplied owner different from the active account', async () => {
    const { auth, context } = readingSession();
    await expect(auth.saveReading('numerology', {}, 'owner-b')).resolves.toBeNull();
    expect(context.fetch).not.toHaveBeenCalled();
});

test.each(['csrf', 'response', 'json'])('saveReading drops A → B → A completion during %s', async stage => {
    const { auth, context, changeOwner } = readingSession();
    let resolve;
    const pending = new Promise(done => { resolve = done; });
    const result = { reading: { id: 'private-old' } };
    context.window.getCSRFToken = () => stage === 'csrf' ? pending : Promise.resolve('token');
    context.fetch.mockImplementation(() => stage === 'response' ? pending : Promise.resolve({ ok: true, json: () => stage === 'json' ? pending : Promise.resolve(result) }));
    const saving = auth.saveReading('numerology', {}, 'owner-a');
    await new Promise(done => setImmediate(done));
    changeOwner('owner-b');
    changeOwner('owner-a');
    resolve(stage === 'csrf' ? 'token' : stage === 'response' ? { ok: true, json: async () => result } : result);
    await expect(saving).resolves.toBeNull();
    if (stage === 'csrf') expect(context.fetch).not.toHaveBeenCalled();
    expect(auth.trackEventSafely).not.toHaveBeenCalled();
    expect(context.window.dispatchEvent).not.toHaveBeenCalled();
});


test('profile cookie mismatch cannot expose another account profile', async () => {
    const { auth, context } = readingSession();
    context.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, user: { id: 'owner-b', birth_date: '1980-01-01' } }) });
    await expect(auth.getProfile()).resolves.toBeNull();
});

test('profile JSON completing after A → B → A is ignored', async () => {
    const { auth, context, changeOwner } = readingSession();
    let resolve;
    context.fetch.mockResolvedValue({ ok: true, json: () => new Promise(done => { resolve = done; }) });
    const profile = auth.getProfile();
    await new Promise(done => setImmediate(done));
    changeOwner('owner-b');
    changeOwner('owner-a');
    resolve({ success: true, user: { id: 'owner-a' } });
    await expect(profile).resolves.toBeNull();
});
