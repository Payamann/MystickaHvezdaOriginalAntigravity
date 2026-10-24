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
