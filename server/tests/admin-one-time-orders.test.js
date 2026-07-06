import { randomUUID } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { supabase } from '../db-supabase.js';

function adminToken() {
    return jwt.sign(
        { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function userToken() {
    return jwt.sign(
        { id: 'user-1', email: 'user@example.com', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

async function insertOrder(overrides = {}) {
    const id = randomUUID();
    const now = new Date().toISOString();
    await supabase.from('one_time_order_inputs').insert({
        id,
        product_type: 'personal_map',
        product_id: 'osobni_mapa_2026',
        customer_email: `test-${id}@example.com`,
        customer_name: 'Testovaci Osoba',
        payload: {},
        status: 'checkout_created',
        retry_count: 0,
        created_at: now,
        updated_at: now,
        ...overrides
    });
    return id;
}

describe('Admin one-time orders API', () => {
    test('requires authentication', async () => {
        const res = await request(app).get('/api/admin/one-time-orders');
        expect(res.status).toBe(401);
    });

    test('requires admin privileges', async () => {
        const res = await request(app)
            .get('/api/admin/one-time-orders')
            .set('Authorization', `Bearer ${userToken()}`);

        expect(res.status).toBe(403);
    });

    test('lists failed orders by default with retry/error detail', async () => {
        const failedId = await insertOrder({
            status: 'failed',
            retry_count: 3,
            last_error: 'Resend error: invalid_api_key (401)'
        });
        await insertOrder({ status: 'fulfilled' });

        const res = await request(app)
            .get('/api/admin/one-time-orders')
            .set('Authorization', `Bearer ${adminToken()}`)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.status).toBe('failed');

        const returnedIds = res.body.orders.map((order) => order.id);
        expect(returnedIds).toContain(failedId);

        const failedOrder = res.body.orders.find((order) => order.id === failedId);
        expect(failedOrder).toMatchObject({
            product_type: 'personal_map',
            status: 'failed',
            retry_count: 3,
            last_error: 'Resend error: invalid_api_key (401)'
        });
    });

    test('supports filtering by an explicit status', async () => {
        const fulfilledId = await insertOrder({ status: 'fulfilled', fulfilled_at: new Date().toISOString() });

        const res = await request(app)
            .get('/api/admin/one-time-orders?status=fulfilled')
            .set('Authorization', `Bearer ${adminToken()}`)
            .expect(200);

        expect(res.body.status).toBe('fulfilled');
        expect(res.body.orders.map((order) => order.id)).toContain(fulfilledId);
    });
});
