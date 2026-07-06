import { fulfillOneTimeOrder } from '../services/one-time-fulfillment.js';

describe('one-time fulfillment dispatch', () => {
    test('throws for an unrecognized product type instead of silently doing nothing', async () => {
        await expect(fulfillOneTimeOrder({
            productType: 'not_a_real_product_type',
            customerName: 'Test User',
            customerEmail: 'test@example.com',
            payload: {}
        })).rejects.toThrow('Unknown one-time product type: not_a_real_product_type');
    });
});
