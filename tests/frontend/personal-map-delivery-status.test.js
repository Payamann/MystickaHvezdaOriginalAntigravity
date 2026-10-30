import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

// Expose only the real return handler; avoid unrelated form/marketing startup.
const source = fs.readFileSync(new URL('../../js/osobni-mapa.js', import.meta.url), 'utf8')
    .replace("    if (document.readyState === 'loading')", "    window.verifyReturn = initStatusBanners;\n    if (document.readyState === 'loading')");
const paid = { status: 'paid', product_id: 'osobni_mapa_2026', transaction_id: 'pi_verified', value: 249, currency: 'CZK' };
function fixture() {
    const nodes = Object.fromEntries(['bannerVerification', 'bannerSuccess', 'order', 'pdf-verification-retry',
        'pdf-verification-message', 'pdf-delivery-message', 'pdf-delivery-retry'].map(id => {
        const classes = new Set();
        return [id, { textContent: '', hidden: false, disabled: false,
            classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
            setAttribute(name, value) { this[name] = value; }
        }];
    }));
    const document = { readyState: 'loading', getElementById: id => nodes[id], addEventListener() {} };
    const window = { location: { search: '?status=success&session_id=cs_test_return' },
        matchMedia: () => ({ matches: false }), scrollTo() {},
        MH_ANALYTICS: { trackPurchaseCompleted: jest.fn(), trackPaymentResult: jest.fn(), trackEvent: jest.fn() }
    };
    const fetch = jest.fn(async () => ({ ok: true, json: async () => ({ success: true, result: { ...paid, delivery_status: 'preparing' } }) }));
    vm.runInNewContext(source, { document, window, fetch, URLSearchParams, AbortController, setTimeout, clearTimeout, console });
    return { nodes, window, fetch, verify: () => window.verifyReturn(),
        respond: result => fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, result }) })
    };
}

test.each([
    ['preparing', 'připravuje'], ['fulfilled', 'e-mailové službě'], ['failed', 'nepodařilo'], ['unknown', 'nemůžeme ověřit'], [undefined, 'nemůžeme ověřit']
])('shows verified delivery %s without inferring inbox arrival', async (state, expectedText) => {
    const app = fixture(); app.respond({ ...paid, delivery_status: state }); await app.verify();
    expect(app.nodes['bannerSuccess'].classList.contains('visible')).toBe(true);
    expect(app.nodes['pdf-delivery-message'].textContent).toContain(expectedText);
    expect(app.window.MH_ANALYTICS.trackPurchaseCompleted).toHaveBeenCalledTimes(1);
    expect(app.nodes['pdf-delivery-retry'].disabled).toBe(false);
});

test('manual delivery refresh updates state without duplicating purchase events', async () => {
    const app = fixture(); await app.verify();
    app.respond({ ...paid, delivery_status: 'fulfilled' });
    await app.nodes['pdf-delivery-retry'].onclick();
    expect(app.nodes['pdf-delivery-message'].textContent).toContain('e-mailové službě');
    expect(app.window.MH_ANALYTICS.trackPurchaseCompleted).toHaveBeenCalledTimes(1);
    expect(app.window.MH_ANALYTICS.trackPaymentResult).toHaveBeenCalledTimes(1);
    expect(app.fetch).toHaveBeenCalledTimes(2);
    expect(app.fetch.mock.calls[1][1]).toMatchObject({ credentials: 'include', cache: 'no-store' });
});

test('unverified return is not a purchase, but can be retried', async () => {
    const app = fixture(); app.respond({ status: 'pending', delivery_status: 'fulfilled' });
    await app.verify();
    expect(app.nodes['bannerSuccess'].classList.contains('visible')).toBe(false);
    expect(app.window.MH_ANALYTICS.trackPurchaseCompleted).not.toHaveBeenCalled();
    expect(app.nodes['pdf-verification-retry'].hidden).toBe(false);
    app.respond({ ...paid, delivery_status: 'preparing' });
    await app.nodes['pdf-verification-retry'].onclick();
    expect(app.window.MH_ANALYTICS.trackPurchaseCompleted).toHaveBeenCalledTimes(1);
});

test('refresh failure retains confirmed payment while showing unknown delivery', async () => {
    const app = fixture(); await app.verify();
    app.fetch.mockRejectedValue(new Error('offline'));
    await app.nodes['pdf-delivery-retry'].onclick();
    expect(app.nodes['bannerSuccess'].classList.contains('visible')).toBe(true);
    expect(app.nodes['bannerVerification'].classList.contains('visible')).toBe(false);
    expect(app.nodes['pdf-delivery-message'].textContent).toContain('nemůžeme ověřit');
    expect(app.nodes['pdf-delivery-retry'].disabled).toBe(false);
    expect(app.window.MH_ANALYTICS.trackPurchaseCompleted).toHaveBeenCalledTimes(1);
});
