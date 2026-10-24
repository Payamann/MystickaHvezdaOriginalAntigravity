import { jest } from '@jest/globals';

jest.unstable_mockModule('../../js/profile/shared.js', () => ({
    apiUrl: () => '/api',
    authHeaders: jest.fn(() => ({ Authorization: 'Bearer synthetic-test-token' })),
    loadPlanManifest: jest.fn(async () => null),
    normalizePlanType: value => value || 'free',
    formatPlanLabel: (value, options = {}) => value === 'free' && options.freeSuffix ? 'Poutník (zdarma)' : value === 'free' ? 'Poutník' : 'Průvodce',
    PROFILE_AVATARS: [],
    profileIconMarkup: () => '',
    renderProfileAvatar: () => {}
}));

const { loadSubscriptionStatus } = await import('../../js/profile/settings.js');
const originalGlobals = Object.fromEntries(['document', 'window', 'fetch', 'CustomEvent', 'confirm'].map(key => [key, globalThis[key]]));

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

function jsonResponse(body, ok = true) {
    return { ok, json: async () => body };
}

function createButton(id, attributes, markup) {
    const listeners = new Map();
    const dataset = {};
    for (const [, name, value] of attributes.matchAll(/\b(data-[\w-]+)="([^"]*)"/g)) {
        dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    }
    return {
        id,
        dataset,
        disabled: false,
        textContent: markup.replace(/<[^>]*>/g, '').trim(),
        addEventListener(type, callback) { listeners.set(type, callback); },
        async click() {
            const result = listeners.get('click')?.({ target: this });
            await result;
            await new Promise(resolve => setImmediate(resolve));
        }
    };
}

function createSession() {
    const nodes = new Map();
    const container = {
        attrs: {}, setAttribute(name, value) { this.attrs[name] = value; }, removeAttribute(name) { delete this.attrs[name]; },
        _innerHTML: 'Loading subscription…',
        get innerHTML() { return this._innerHTML; },
        set innerHTML(markup) {
            for (const id of [...nodes.keys()]) if (id !== 'subscription-details') nodes.delete(id);
            this._innerHTML = String(markup);
            for (const [, attributes, contents] of this._innerHTML.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
                const id = attributes.match(/\bid="([^"]+)"/)?.[1];
                if (id) nodes.set(id, createButton(id, attributes, contents));
            }
        }
    };
    nodes.set('subscription-details', container);
    const document = {
        getElementById: id => nodes.get(id) || null,
        dispatchEvent: jest.fn(),
        addEventListener() {}
    };
    const window = {
        Auth: { user: { id: 'user-a' }, showToast: jest.fn() },
        MH_ANALYTICS: { trackBillingPortalOpened: jest.fn() },
        location: { origin: 'https://local.invalid', href: 'https://local.invalid/profil.html' },
        getCSRFToken: jest.fn(async () => 'synthetic-csrf')
    };
    return { document, window, nodes, container };
}

let session;
beforeEach(() => {
    session = createSession();
    globalThis.document = session.document;
    globalThis.window = session.window;
    globalThis.fetch = jest.fn();
    globalThis.CustomEvent = class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } };
    globalThis.confirm = jest.fn(() => true);
});

afterEach(() => {
    for (const [key, value] of Object.entries(originalGlobals)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
    }
});

async function renderStatus(status) {
    fetch.mockResolvedValueOnce(jsonResponse(status));
    return loadSubscriptionStatus();
}

const premium = {
    planType: 'premium_monthly', canManagePayments: true, hasBillingSubscription: true,
    canCancel: true, canResume: false, needsPaymentUpdate: false
};

test('free canceled account with a retained Stripe customer can open billing portal', async () => {
    await renderStatus({
        planType: 'free', status: 'cancelled', currentPeriodEnd: null,
        canCancel: false, canResume: false, needsPaymentUpdate: false,
        canManagePayments: true, hasBillingSubscription: false
    });

    expect(session.container.innerHTML).toContain('Zrušeno');
    expect(session.nodes.get('sub-portal-btn')).toBeDefined();
    expect(session.container.innerHTML).toContain('Platební údaje a faktury');
});

test('current billing manifest aliases keep portal and reactivation controls available', async () => {
    await renderStatus({
        planType: 'premium_monthly', status: 'cancel_pending', currentPeriodEnd: '2026-12-01T00:00:00.000Z',
        canCancel: false, canResume: false, canReactivate: true, needsPaymentUpdate: false,
        canManageBilling: true, hasStripeSubscription: true
    });

    expect(session.nodes.has('sub-reactivate-btn')).toBe(true);
    expect(session.nodes.has('sub-portal-btn')).toBe(true);
    expect(session.container.innerHTML).toContain('Správa plateb');
});

test.each([
    ['trialing', { ...premium, status: 'trialing', currentPeriodEnd: new Date(Date.now() + 5 * 86400000).toISOString() }, ['Zkušební období', '<strong>5</strong> dnů', 'sub-cancel-btn', 'sub-portal-btn']],
    ['active', { ...premium, status: 'active', currentPeriodEnd: '2026-12-01T00:00:00.000Z' }, ['Aktivní', 'sub-cancel-btn', 'sub-portal-btn']],
    ['cancel_pending', { ...premium, status: 'cancel_pending', canCancel: false, currentPeriodEnd: '2026-12-01T00:00:00.000Z' }, ['Končí na konci období', 'Přístup končí', 'sub-reactivate-btn', 'sub-portal-btn']],
    ['paused', { ...premium, status: 'paused', canCancel: false, canResume: true, pauseUntil: '2026-11-01T00:00:00.000Z' }, ['Pozastaveno', 'sub-resume-btn', 'sub-portal-btn']],
    ['past_due', { ...premium, status: 'past_due', canCancel: true, needsPaymentUpdate: true }, ['Platba selhala', 'Aktualizovat kartu', 'sub-payment-update-btn', 'sub-cancel-btn', 'sub-portal-btn']],
    ['cancelled', { planType: 'free', status: 'cancelled', canManagePayments: false, hasBillingSubscription: false }, ['Zrušeno', 'sub-upgrade-btn']],
    ['canceled alias', { ...premium, planType: 'free', status: 'canceled', canManagePayments: false, hasBillingSubscription: false }, ['Zrušeno', 'sub-upgrade-btn']]
])('%s shows status and only its applicable controls', async (_name, status, expected) => {
    await renderStatus(status);
    const markup = session.container.innerHTML;
    for (const fragment of expected) {
        if (fragment.startsWith('sub-')) expect(session.nodes.has(fragment)).toBe(true);
        else expect(markup).toContain(fragment);
    }
    expect([...session.nodes.keys()].filter(id => id.startsWith('sub-')).sort())
        .toEqual(expected.filter(fragment => fragment.startsWith('sub-')).sort());
    if (status.status === 'trialing') expect(markup).not.toContain('class="subscription-period"');
});

test('expired trial count uses the correct Czech zero-day form', async () => {
    await renderStatus({
        ...premium, status: 'trialing',
        currentPeriodEnd: new Date(Date.now() - 86400000).toISOString()
    });

    expect(session.container.innerHTML).toContain('<strong>0</strong> dnů');
});

test('manual premium grant explains access without showing a Stripe billing button', async () => {
    await renderStatus({
        planType: 'premium_monthly', status: 'active', currentPeriodEnd: '2026-12-01T00:00:00.000Z',
        canCancel: false, canResume: false, needsPaymentUpdate: false,
        canManagePayments: false, hasBillingSubscription: false
    });

    expect(session.container.innerHTML).toContain('Přístup je přidělený samostatně');
    expect(session.nodes.has('sub-portal-btn')).toBe(false);
});

test('invalid dates and unknown status are rendered as safe explanatory text', async () => {
    const hostileStatus = '<img src=x onerror=alert(1)>';
    await renderStatus({
        planType: 'premium_monthly', status: hostileStatus, currentPeriodEnd: 'not-a-date',
        canCancel: false, canResume: false, needsPaymentUpdate: false,
        canManagePayments: true, hasBillingSubscription: true
    });

    expect(session.container.innerHTML).not.toContain('Invalid Date');
    expect(session.container.innerHTML).not.toContain(hostileStatus);
    expect(session.container.innerHTML).toContain('Neznámý stav');
});

test('status load failure exposes a retry that can load the next response', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}, false));
    await loadSubscriptionStatus();
    expect(session.nodes.has('sub-retry-btn')).toBe(true);

    fetch.mockResolvedValueOnce(jsonResponse({ ...premium, status: 'active' }));
    await session.nodes.get('sub-retry-btn').click();
    expect(session.container.innerHTML).toContain('Aktivní');
    expect(session.nodes.has('sub-retry-btn')).toBe(false);
});

test('late status response from a previous account is ignored', async () => {
    const oldResponse = deferred();
    fetch.mockReturnValueOnce(oldResponse.promise);
    const pending = loadSubscriptionStatus();
    await Promise.resolve();
    session.window.Auth.user.id = 'user-b';
    oldResponse.resolve(jsonResponse({ ...premium, status: 'active' }));
    await pending;

    expect(session.container.innerHTML).toContain('Načítám stav členství…');
    expect(session.document.dispatchEvent).not.toHaveBeenCalled();
});

test('billing portal sends its default flow and payment-method flow, restoring the button on failure', async () => {
    await renderStatus({ ...premium, status: 'active' });
    fetch.mockResolvedValueOnce(jsonResponse({ url: 'https://billing.example/session' }));
    await session.nodes.get('sub-portal-btn').click();
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ expectedUserId: 'user-a' });
    expect(fetch.mock.calls[1][0]).toBe('/api/payment/portal');
    expect(fetch.mock.calls[1][1]).toMatchObject({
        method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': 'synthetic-csrf' }
    });
    expect(session.window.location.href).toBe('https://billing.example/session');

    session.window.location.href = 'https://local.invalid/profil.html';
    await renderStatus({ ...premium, status: 'past_due', needsPaymentUpdate: true });
    fetch.mockResolvedValueOnce(jsonResponse({ error: 'Portal is unavailable' }, false));
    const updateButton = session.nodes.get('sub-payment-update-btn');
    await updateButton.click();
    expect(JSON.parse(fetch.mock.calls.at(-1)[1].body)).toEqual({
        flow: 'payment_method_update',
        expectedUserId: 'user-a'
    });
    expect(updateButton.disabled).toBe(false);
    expect(updateButton.textContent).toBe('Aktualizovat kartu');
    expect(session.window.Auth.showToast).toHaveBeenCalledWith('Chyba', 'Portal is unavailable', 'error');
});

test('failed immediate cancellation restores its original action label', async () => {
    await renderStatus({ ...premium, status: 'past_due', canCancel: true, needsPaymentUpdate: true });
    const cancelButton = session.nodes.get('sub-cancel-btn');
    expect(cancelButton.dataset.cancelImmediate).toBe('true');
    fetch.mockResolvedValueOnce(jsonResponse({ error: 'Cancellation is unavailable' }, false));

    await cancelButton.click();

    expect(cancelButton.disabled).toBe(false);
    expect(cancelButton.textContent).toBe('Zrušit a zastavit další pokusy');
});
