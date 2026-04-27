import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { supabase } from '../db-supabase.js';

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

function createToken(payload = {}) {
    return jwt.sign({
        id: 'admin-angel-test',
        email: 'admin@example.com',
        role: 'admin',
        isPremium: true,
        subscription_status: 'vip_majestrat',
        ...payload
    }, process.env.JWT_SECRET);
}

async function seedAngelMessage(overrides = {}) {
    const id = overrides.id || Math.floor(100000 + Math.random() * 800000);
    const { data, error } = await supabase
        .from('angel_messages')
        .insert({
            id,
            nickname: 'Moderace',
            message: 'Testovací vzkaz čekající na schválení.',
            category: 'jine',
            likes: 0,
            approved: false,
            created_at: new Date().toISOString(),
            ...overrides
        })
        .select('id')
        .single();

    if (error) throw new Error(error.message);
    return data.id;
}

describe('Admin angel message moderation', () => {
    test('requires admin access', async () => {
        await request(app)
            .get('/api/admin/angel-messages')
            .expect(401);

        const userToken = createToken({ role: 'user', email: 'user@example.com' });
        await request(app)
            .get('/api/admin/angel-messages')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(403);
    });

    test('lists pending angel messages for admins', async () => {
        const messageId = await seedAngelMessage();
        const token = createToken();

        const res = await request(app)
            .get('/api/admin/angel-messages?status=pending')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.status).toBe('pending');
        expect(res.body.messages).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: messageId, approved: false })
        ]));
    });

    test('approves and deletes an angel message', async () => {
        const messageId = await seedAngelMessage();
        const token = createToken();
        const csrfToken = await getCsrfToken();

        const approveRes = await request(app)
            .patch(`/api/admin/angel-messages/${messageId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-csrf-token', csrfToken)
            .send({ approved: true })
            .expect(200);

        expect(approveRes.body.success).toBe(true);
        expect(approveRes.body.message).toEqual(expect.objectContaining({
            id: messageId,
            approved: true
        }));

        const publicRes = await request(app)
            .get('/api/angel-post')
            .expect(200);

        expect(publicRes.body).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: messageId })
        ]));

        const deleteToken = await getCsrfToken();
        await request(app)
            .delete(`/api/admin/angel-messages/${messageId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-csrf-token', deleteToken)
            .expect(200);

        const afterDelete = await request(app)
            .get('/api/admin/angel-messages?status=all')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(afterDelete.body.messages).not.toEqual(expect.arrayContaining([
            expect.objectContaining({ id: messageId })
        ]));
    });

    test('validates moderation payloads', async () => {
        const messageId = await seedAngelMessage();
        const token = createToken();
        const csrfToken = await getCsrfToken();

        await request(app)
            .patch(`/api/admin/angel-messages/${messageId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-csrf-token', csrfToken)
            .send({ approved: 'yes' })
            .expect(400);

        await request(app)
            .patch('/api/admin/angel-messages/not-a-number')
            .set('Authorization', `Bearer ${token}`)
            .set('x-csrf-token', csrfToken)
            .send({ approved: true })
            .expect(400);
    });
});
