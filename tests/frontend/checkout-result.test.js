import { jest } from '@jest/globals';
import { verifyCheckoutResult } from '../../js/profile/checkout-result.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const result = { status: 'paid', value: 149, currency: 'CZK', transaction_id: 'in_verified', product_id: 'pruvodce' };
test('uses only verified response values and a credentialed no-cache request', async () => {
    globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ success: true, result }) }));
    expect(await verifyCheckoutResult('cs_test_valid')).toEqual(result);
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'include', cache: 'no-store' });
});
test.each([null, '', 'not-a-session', 'cs_test_../other'])('rejects invalid session %s before requesting', async id => {
    globalThis.fetch = jest.fn(); expect(await verifyCheckoutResult(id)).toBeNull(); expect(fetch).not.toHaveBeenCalled();
});
test.each([{ value: 0 }, { value: -10 }, { transaction_id: null }, { currency: 'czk' }, { product_id: null }])('rejects invalid paid response %j', async patch => {
    globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ success: true, result: { ...result, ...patch } }) }));
    expect(await verifyCheckoutResult('cs_test_valid')).toBeNull();
});
test('network errors and hung requests fail closed', async () => {
    globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error('offline'));
    expect(await verifyCheckoutResult('cs_test_valid')).toBeNull();
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    expect(await verifyCheckoutResult('cs_test_valid', { timeoutMs: 10 })).toBeNull();
});
