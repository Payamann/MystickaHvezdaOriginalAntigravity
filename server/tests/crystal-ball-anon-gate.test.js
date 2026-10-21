/**
 * Anonymous crystal-ball allowance. Business rule: a visitor gets 1 free question
 * (CRYSTAL_BALL_ANON_FREE_LIMIT), then must register. Regression guard for the
 * exploratory-testing finding where the registration gate only applied to
 * logged-in users. The anonymous httpOnly cookie is a soft gate, not a hard quota:
 * visitors can clear it, so cost controls must be independent of this counter.
 */
import request from 'supertest';
import app from '../index.js';
import { parseAnonymousCrystalBallFreeLimit } from '../routes/oracle.js';

describe('Crystal ball anonymous free-limit configuration', () => {
    test.each([
        ['0', 0],
        ['2', 2],
        ['-1', 0],
        [undefined, 1],
        ['', 1],
        ['invalid', 1],
        ['9007199254740992', 1]
    ])('parses %s as %i', (rawValue, expected) => {
        expect(parseAnonymousCrystalBallFreeLimit(rawValue)).toBe(expected);
    });
});

describe('Crystal ball anonymous free-question gate', () => {
    async function getCsrf(agent) {
        const res = await agent.get('/api/csrf-token').expect(200);
        return res.body.csrfToken;
    }

    test('first question is free, the next one hits the registration gate', async () => {
        const agent = request.agent(app);
        const csrf = await getCsrf(agent);

        const first = await agent
            .post('/api/crystal-ball')
            .set('x-csrf-token', csrf)
            .send({ question: 'Mam dnes udelat prvni krok?' })
            .expect(200);
        expect(first.body.success).toBe(true);
        // The response must set the anonymous usage cookie.
        const setCookie = first.headers['set-cookie'] || [];
        expect(setCookie.join(';')).toContain('mh_cb_free_uses');

        const second = await agent
            .post('/api/crystal-ball')
            .set('x-csrf-token', csrf)
            .send({ question: 'A co ted?' })
            .expect(402);
        expect(second.body).toMatchObject({
            success: false,
            code: 'REGISTRATION_REQUIRED',
            feature: 'kristalova_koule'
        });
    });

    test('a fresh visitor without a usage cookie is not gated', async () => {
        const agent = request.agent(app);
        const csrf = await getCsrf(agent);
        const res = await agent
            .post('/api/crystal-ball')
            .set('x-csrf-token', csrf)
            .send({ question: 'Nova relace, nova otazka?' })
            .expect(200);
        expect(res.body.success).toBe(true);
    });

    test('the usage cookie is httpOnly (not editable from page JS)', async () => {
        const agent = request.agent(app);
        const csrf = await getCsrf(agent);
        const res = await agent
            .post('/api/crystal-ball')
            .set('x-csrf-token', csrf)
            .send({ question: 'Je cookie chranena?' })
            .expect(200);
        const usageCookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('mh_cb_free_uses='));
        expect(usageCookie).toBeDefined();
        expect(usageCookie.toLowerCase()).toContain('httponly');
    });
});
