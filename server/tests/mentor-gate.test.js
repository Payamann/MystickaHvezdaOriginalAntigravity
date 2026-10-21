import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { supabase } from '../db-supabase.js';

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

function makeToken({ userId, email = `${userId}@example.com`, isPremium = false } = {}) {
    return jwt.sign(
        {
            id: userId,
            email,
            role: 'user',
            subscription_status: isPremium ? 'premium_monthly' : 'free',
            isPremium
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function todayAt(hour) {
    return `${new Date().toISOString().split('T')[0]}T${String(hour).padStart(2, '0')}:00:00.000Z`;
}

async function getMentorMessages(userId) {
    const { data } = await supabase
        .from('mentor_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    return data || [];
}

describe('Mentor free limit and premium gate behavior', () => {
    test('free user below the daily limit gets a response and sanitized message persistence', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `mentor-allowed-${Date.now()}`;
        const token = makeToken({ userId });

        await supabase.from('users').insert({
            id: userId,
            email: `${userId}@example.com`,
            first_name: 'Jana',
            birth_date: '1990-05-10'
        });
        await supabase.from('mentor_messages').insert([
            { user_id: userId, role: 'mentor', content: 'Predchozi odpoved', created_at: todayAt(7) },
            { user_id: userId, role: 'user', content: 'Prvni dnesni zprava', created_at: todayAt(8) },
            { user_id: userId, role: 'user', content: 'Druha dnesni zprava', created_at: todayAt(9) }
        ]);

        const res = await request(app)
            .post('/api/mentor/chat')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({ message: '<img src=x onerror=alert(1)> Prosim o radu dnes.' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.reply).toBe('Testovací výklad ti ukazuje aktuální téma. Vyber dnes jeden bezpečný konkrétní krok.');

        const messages = await getMentorMessages(userId);
        const userMessages = messages.filter(message => message.role === 'user');
        expect(userMessages).toHaveLength(3);
        const savedPrompt = userMessages.find(message => message.content.includes('Prosim o radu dnes.'));
        expect(savedPrompt).toBeDefined();
        expect(savedPrompt.content).not.toMatch(/[<>]/);
        expect(messages).toContainEqual(expect.objectContaining({
            role: 'mentor',
            content: 'Testovací výklad ti ukazuje aktuální téma. Vyber dnes jeden bezpečný konkrétní krok.'
        }));
    });

    test('free user at the daily limit records paywall hit and does not spend another message', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `mentor-blocked-${Date.now()}`;
        const token = makeToken({ userId });

        await supabase.from('mentor_messages').insert([
            { user_id: userId, role: 'user', content: 'Prvni zprava', created_at: todayAt(8) },
            { user_id: userId, role: 'user', content: 'Druha zprava', created_at: todayAt(9) },
            { user_id: userId, role: 'user', content: 'Treti zprava', created_at: todayAt(10) }
        ]);

        const res = await request(app)
            .post('/api/mentor/chat')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({ message: 'Muzu jeste jednu radu?' })
            .expect(402);

        expect(res.body).toMatchObject({
            code: 'PREMIUM_REQUIRED',
            feature: 'mentor_unlimited'
        });

        const messages = await getMentorMessages(userId);
        expect(messages.filter(message => message.role === 'user')).toHaveLength(3);

        const { data: hits } = await supabase
            .from('paywall_hits')
            .select('*')
            .eq('user_id', userId)
            .eq('tool_name', 'mentor_unlimited');

        expect(hits).toHaveLength(1);
    });

    test('concurrent free requests cannot exceed three daily mentor replies', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `mentor-concurrent-${Date.now()}`;
        const token = makeToken({ userId });

        const responses = await Promise.all(Array.from({ length: 4 }, (_, index) => request(app)
            .post('/api/mentor/chat')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({ message: `Souběžná otázka ${index + 1}` })));

        expect(responses.filter(response => response.status === 200)).toHaveLength(3);
        expect(responses.filter(response => response.status === 402)).toHaveLength(1);
        expect((await getMentorMessages(userId)).filter(message => message.role === 'user')).toHaveLength(3);
    });

    test('saved user and mentor turns remain ordered when their timestamps match', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `mentor-history-order-${Date.now()}`;
        const token = makeToken({ userId });

        await request(app)
            .post('/api/mentor/chat')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({ message: 'Zachovej pořadí i při stejném čase.' })
            .expect(200);

        const history = await request(app)
            .get('/api/mentor/history')
            .set('Cookie', `auth_token=${token}`)
            .expect(200);

        expect(history.body.history.map(message => message.role)).toEqual(['user', 'mentor']);
    });

    test('failed mentor generation releases the reserved free use', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `mentor-retry-${Date.now()}`;
        const token = makeToken({ userId });
        const previousForceError = process.env.MOCK_AI_FORCE_ERROR;

        process.env.MOCK_AI_FORCE_ERROR = 'true';
        try {
            await request(app)
                .post('/api/mentor/chat')
                .set('x-csrf-token', csrfToken)
                .set('Cookie', `auth_token=${token}`)
                .send({ message: 'První pokus se nepovede.' })
                .expect(500);
        } finally {
            if (previousForceError === undefined) delete process.env.MOCK_AI_FORCE_ERROR;
            else process.env.MOCK_AI_FORCE_ERROR = previousForceError;
        }

        const retry = await request(app)
            .post('/api/mentor/chat')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({ message: 'Zkusím to znovu.' });

        expect(retry.status).toBe(200);
    });

    test('premium user bypasses the free daily message limit', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `mentor-premium-${Date.now()}`;
        const token = makeToken({ userId, isPremium: true });

        await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_type: 'premium_monthly',
            status: 'active',
            current_period_end: '2099-12-31T23:59:59.000Z'
        });

        await supabase.from('mentor_messages').insert([
            { user_id: userId, role: 'user', content: 'Prvni zprava', created_at: todayAt(8) },
            { user_id: userId, role: 'user', content: 'Druha zprava', created_at: todayAt(9) },
            { user_id: userId, role: 'user', content: 'Treti zprava', created_at: todayAt(10) },
            { user_id: userId, role: 'user', content: 'Ctvrta zprava', created_at: todayAt(11) }
        ]);

        const res = await request(app)
            .post('/api/mentor/chat')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({ message: 'Pokracujeme v rozhovoru.' })
            .expect(200);

        expect(res.body.success).toBe(true);

        const messages = await getMentorMessages(userId);
        expect(messages.filter(message => message.role === 'user')).toHaveLength(5);
    });
});
