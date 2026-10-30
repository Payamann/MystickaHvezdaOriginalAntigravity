import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import app from '../index.js';
import { supabase } from '../db-supabase.js';

describe('Oracle AI fallbacks', () => {
    const originalForceError = process.env.MOCK_AI_FORCE_ERROR;
    const originalForceFormalCzech = process.env.MOCK_AI_FORCE_FORMAL_CZECH;

    async function getCsrfToken() {
        const res = await request(app).get('/api/csrf-token').expect(200);
        return res.body.csrfToken;
    }

    function createPremiumToken(overrides = {}) {
        const isPremium = overrides.isPremium !== false;
        return jwt.sign({
            id: isPremium ? 'oracle-fallback-user' : 'oracle-fallback-free-user',
            email: 'oracle-fallback@example.com',
            role: 'user',
            isPremium: true,
            subscription_status: 'premium_monthly',
            ...overrides
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }

    beforeEach(() => {
        process.env.MOCK_AI_FORCE_ERROR = 'true';
    });

    beforeAll(async () => {
        await supabase.from('subscriptions').insert({
            user_id: 'oracle-fallback-user',
            plan_type: 'premium_monthly',
            status: 'active',
            current_period_end: '2099-12-31T23:59:59.000Z'
        });
        await supabase.from('subscriptions').insert({
            user_id: 'oracle-fallback-free-user',
            plan_type: 'free',
            status: 'active',
            current_period_end: null
        });
    });

    afterEach(() => {
        if (originalForceError === undefined) {
            delete process.env.MOCK_AI_FORCE_ERROR;
        } else {
            process.env.MOCK_AI_FORCE_ERROR = originalForceError;
        }

        if (originalForceFormalCzech === undefined) {
            delete process.env.MOCK_AI_FORCE_FORMAL_CZECH;
        } else {
            process.env.MOCK_AI_FORCE_FORMAL_CZECH = originalForceFormalCzech;
        }
    });

    test('POST /api/crystal-ball rejects formal Czech AI output and uses the safe fallback', async () => {
        delete process.env.MOCK_AI_FORCE_ERROR;
        process.env.MOCK_AI_FORCE_FORMAL_CZECH = 'true';
        const csrfToken = await getCsrfToken();
        const res = await request(app)
            .post('/api/crystal-ball')
            .set('x-csrf-token', csrfToken)
            .send({ question: 'Kam teď zaměřit energii?', lang: 'cs' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fallback).toBe(true);
        expect(res.body.response).not.toMatch(/vaše|udělejte/iu);
        expect(res.body.response).toMatch(/hledej|ti|udělej/iu);
    });

    test('POST /api/angel-card returns fallback when AI fails', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken();
        const res = await request(app)
            .post('/api/angel-card')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                card: { name: 'Hope', theme: 'Calm guidance' },
                intention: 'clarity'
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fallback).toBe(true);
        expect(res.body.isTeaser).toBe(false);
        expect(res.body.response).toEqual(expect.stringContaining('Hope'));
    });

    test('POST /api/crystal-ball returns fallback when AI fails', async () => {
        const csrfToken = await getCsrfToken();
        const res = await request(app)
            .post('/api/crystal-ball')
            .set('x-csrf-token', csrfToken)
            .send({
                question: 'Should I change direction?'
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fallback).toBe(true);
        expect(res.body.response).toEqual(expect.stringContaining('Should I change direction?'));
    });

    test('crystal fallback does not consume the anonymous personal-answer allowance', async () => {
        const agent = request.agent(app);
        const csrfToken = (await agent.get('/api/csrf-token').expect(200)).body.csrfToken;
        const failed = await agent.post('/api/crystal-ball').set('x-csrf-token', csrfToken)
            .send({ question: 'Fallback allowance anonymous?', lang: 'en' }).expect(200);
        expect(failed.body.fallback).toBe(true);
        expect((failed.headers['set-cookie'] || []).join(';')).not.toContain('mh_cb_free_uses=');
        delete process.env.MOCK_AI_FORCE_ERROR;
        const success = await agent.post('/api/crystal-ball').set('x-csrf-token', csrfToken)
            .send({ question: 'Personal allowance after fallback?', lang: 'en' }).expect(200);
        expect(success.body.fallback).toBe(false);
        expect((success.headers['set-cookie'] || []).join(';')).toContain('mh_cb_free_uses=');
        await agent.post('/api/crystal-ball').set('x-csrf-token', csrfToken)
            .send({ question: 'Used personal allowance?', lang: 'en' }).expect(402);
    });

    test('crystal fallback releases the free-account reservation while personal answers still use the limit', async () => {
        const token = createPremiumToken({ isPremium: false, subscription_status: 'free' });
        const csrfToken = await getCsrfToken();
        const ask = question => request(app).post('/api/crystal-ball')
            .set('x-csrf-token', csrfToken).set('Cookie', `auth_token=${token}`)
            .send({ question, lang: 'en' });
        for (let i = 0; i < 4; i++) {
            expect((await ask(`Fallback allowance account ${i}?`).expect(200)).body.fallback).toBe(true);
        }
        delete process.env.MOCK_AI_FORCE_ERROR;
        for (let i = 0; i < 3; i++) {
            expect((await ask(`Personal allowance account ${i}?`).expect(200)).body.fallback).toBe(false);
        }
        expect((await ask('Used account allowance?').expect(402)).body.code).toBe('LIMIT_REACHED');
    });

    test('unconfirmed fallback release retries once and keeps the allowance fail-closed', async () => {
        const userId = 'oracle-fallback-release-failure';
        await supabase.from('subscriptions').insert({ user_id: userId, plan_type: 'free', status: 'active', current_period_end: null });
        const token = createPremiumToken({ id: userId, isPremium: false, subscription_status: 'free' });
        const csrfToken = await getCsrfToken();
        const originalRpc = supabase.rpc.bind(supabase);
        const rpc = jest.spyOn(supabase, 'rpc').mockImplementation((name, args) => name === 'release_user_daily_quota'
            ? Promise.resolve({ data: null, error: { message: 'temporary release outage' } }) : originalRpc(name, args));
        const ask = question => request(app).post('/api/crystal-ball')
            .set('x-csrf-token', csrfToken).set('Cookie', `auth_token=${token}`).send({ question, lang: 'en' });
        try {
            expect((await ask('Fallback during release outage?').expect(200)).body.fallback).toBe(true);
            expect(rpc.mock.calls.filter(([name]) => name === 'release_user_daily_quota')).toHaveLength(2);
            delete process.env.MOCK_AI_FORCE_ERROR;
            for (let i = 0; i < 2; i++) {
                expect((await ask(`Remaining allowance ${i}?`).expect(200)).body.fallback).toBe(false);
            }
            expect((await ask('Fail-closed remaining limit?').expect(402)).body.code).toBe('LIMIT_REACHED');
        } finally { rpc.mockRestore(); }
    });

    test('POST /api/dream returns fallback when AI fails', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken();
        const res = await request(app)
            .post('/api/dream')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                dream: 'I was walking through a quiet city of mirrors.'
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fallback).toBe(true);
        expect(res.body.response).toEqual(expect.stringContaining('quiet city of mirrors'));
    });

    test('POST /api/tarot returns fallback when AI fails', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken();
        const res = await request(app)
            .post('/api/tarot')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                question: 'What needs attention?',
                spreadType: 'three-card',
                cards: ['The Sun', 'The Moon', 'The Star']
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fallback).toBe(true);
        expect(res.body.response).toEqual(expect.stringContaining('The Sun'));
    });

    test('POST /api/tarot soft upsell uses current pricing and pricing URL context', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken({ isPremium: false, subscription_status: 'free' });
        const res = await request(app)
            .post('/api/tarot')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                question: 'What should I understand?',
                spreadType: 'three-card',
                cards: ['The Sun', 'The Moon', 'The Star']
            })
            .expect(402);

        expect(res.body).toMatchObject({
            success: false,
            code: 'PREMIUM_REQUIRED',
            upsell: {
                feature: 'tarot_multi_card',
                plan: 'pruvodce',
                price: 199,
                priceLabel: 'Kč/měsíc',
                upgradeUrl: '/cenik.html?plan=pruvodce&source=tarot_upsell&feature=tarot_multi_card'
            }
        });
    });

    test('POST /api/tarot-summary returns fallback when AI fails', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken();
        const res = await request(app)
            .post('/api/tarot-summary')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                spreadType: 'three-card',
                question: 'Mám se dnes ozvat?',
                previousAnswer: 'ANO',
                cards: [
                    { position: 'past', name: 'The Sun', meaning: 'clarity' },
                    { position: 'present', name: 'The Moon', meaning: 'uncertainty' },
                    { position: 'future', name: 'The Star', meaning: 'hope' }
                ]
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fallback).toBe(true);
        expect(res.body.response).toEqual(expect.stringContaining('The Moon'));
        expect(res.body.response).toEqual(expect.stringContaining('Mám se dnes ozvat?'));
        expect(res.body.response).toEqual(expect.stringContaining('ANO'));
        expect(res.body.response).toEqual(expect.stringContaining('Teď to pro tebe znamená'));
        expect(res.body.response).toEqual(expect.stringContaining('Praktický krok na příštích 24 hodin'));
    });

    test('POST /api/tarot-summary requires Premium for multi-card summaries', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken({ isPremium: false, subscription_status: 'free' });
        const res = await request(app)
            .post('/api/tarot-summary')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                spreadType: 'three-card',
                cards: [
                    { position: 'past', name: 'The Sun', meaning: 'clarity' },
                    { position: 'present', name: 'The Moon', meaning: 'uncertainty' },
                    { position: 'future', name: 'The Star', meaning: 'hope' }
                ]
            })
            .expect(402);

        expect(res.body).toMatchObject({
            success: false,
            code: 'PREMIUM_REQUIRED',
            feature: 'tarot_multi_card'
        });
    });

    test('POST /api/tarot-summary maps Celtic Cross to the exclusive feature gate', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken({ isPremium: false, subscription_status: 'free' });
        const res = await request(app)
            .post('/api/tarot-summary')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                spreadType: 'Celtic Cross',
                cards: Array.from({ length: 10 }, (_, index) => ({
                    position: `position-${index + 1}`,
                    name: `Card ${index + 1}`,
                    meaning: 'symbolic meaning'
                }))
            })
            .expect(402);

        expect(res.body).toMatchObject({
            success: false,
            code: 'PREMIUM_REQUIRED',
            feature: 'tarot_celtic_cross',
            requiredPlan: 'pruvodce'
        });
    });

    test('POST /api/runes returns fallback when AI fails', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken();
        const res = await request(app)
            .post('/api/runes')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                rune: { name: 'Fehu', meaning: 'wealth and energy' },
                intention: 'work',
                history: ['career']
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fallback).toBe(true);
        expect(res.body.isTeaser).toBe(false);
        expect(res.body.response).toEqual(expect.stringContaining('Fehu'));
    });

    test('POST /api/daily-wisdom returns fallback when AI fails', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken();
        const res = await request(app)
            .post('/api/daily-wisdom')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                sign: 'Beran',
                moonPhase: 'dorustajici'
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fallback).toBe(true);
        expect(res.body.response).toEqual(expect.stringContaining('Beran'));
    });

    test('POST /api/daily-wisdom requires Premium for authenticated free users', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken({ isPremium: false, subscription_status: 'free' });
        const res = await request(app)
            .post('/api/daily-wisdom')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                sign: 'Beran',
                moonPhase: 'dorustajici'
            })
            .expect(402);

        expect(res.body).toMatchObject({
            success: false,
            code: 'PREMIUM_REQUIRED',
            feature: 'daily_guidance'
        });
    });
});
