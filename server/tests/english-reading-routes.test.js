import { jest } from '@jest/globals';
import request from 'supertest';

const callClaude = jest.fn();
jest.unstable_mockModule('../services/claude.js', () => ({ callClaude }));
const { default: app } = await import('../index.js');
const { buildOracleSystemPrompt } = await import('../routes/oracle.js');
const { SYSTEM_PROMPTS } = await import('../config/prompts.js');

async function post(path, body, cookie) {
    const csrf = await request(app).get('/api/csrf-token');
    const req = request(app).post(path).set('x-csrf-token', csrf.body.csrfToken);
    if (cookie) req.set('Cookie', cookie);
    return req.send(body);
}

beforeEach(() => callClaude.mockReset());

test('English oracle prompt keeps safe symbolic boundaries and explicitly requests English', () => {
    const { lang, systemPrompt } = buildOracleSystemPrompt(SYSTEM_PROMPTS.crystalBall, 'en');
    expect(lang).toBe('en');
    expect(systemPrompt).toContain('Respond in English (EN)');
    expect(systemPrompt).toContain('never a certain prediction');
    expect(systemPrompt).toContain('untrusted data');
    expect(buildOracleSystemPrompt('', 'invalid').lang).toBe('cs');
});

test('English generation normalizes the sign, uses an English contract and keeps separate cached language results', async () => {
    callClaude.mockResolvedValue(JSON.stringify({ prediction: 'Notice your priorities. Take a quiet pause. Choose one small step.', affirmation: 'I choose a thoughtful step today.', luckyNumbers: [1, 2, 3, 4] }));
    const first = await post('/api/horoscope', { sign: 'Aquarius', lang: 'en' });
    expect(first.status).toBe(200);
    expect(first.body.period).toBe('Daily inspiration');
    expect(first.body.fallback).not.toBe(true);
    expect(callClaude).toHaveBeenCalledTimes(1);
    const prompt = callClaude.mock.calls[0][0];
    expect(prompt).toContain('for Aquarius');
    expect(prompt).toContain('exactly 3 sentences');
    expect(prompt).toContain(new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/Prague' }));
    const cached = await post('/api/horoscope', { sign: 'Vodnář', lang: 'en' });
    expect(cached.body.cached).toBe(true);
    expect(callClaude).toHaveBeenCalledTimes(1);
    await post('/api/horoscope', { sign: 'Vodnář', lang: 'sk' });
    expect(callClaude).toHaveBeenCalledTimes(2);
});

test('English horoscope AI failure has an English fallback matching the requested sign', async () => {
    callClaude.mockRejectedValue(new Error('synthetic failure'));
    const res = await post('/api/horoscope', { sign: 'Pisces', lang: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.fallback).toBe(true);
    const reading = JSON.parse(res.body.response);
    expect(reading.prediction).toContain('Pisces');
    expect(reading.affirmation).toMatch(/^I /);
});

test('English horoscope validates input and preserves Premium access gates', async () => {
    expect((await post('/api/horoscope', { sign: 'Invalid', lang: 'en' })).body.error).toBe('Invalid zodiac sign.');
    const res = await post('/api/horoscope', { sign: 'Aries', period: 'weekly', lang: 'en' });
    expect(res.status).toBe(402);
    expect(res.body.code).toBe('PREMIUM_REQUIRED');
    expect(res.body.error).toContain('Premium');
    expect(callClaude).not.toHaveBeenCalled();
});

test('English crystal-ball fallback remains reflective and anonymous registration gate remains enforced', async () => {
    callClaude.mockRejectedValue(new Error('synthetic failure'));
    const res = await post('/api/crystal-ball', { question: 'How can I approach this choice?', lang: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.fallback).toBe(true);
    expect(res.body.response).toContain('This is a basic prompt for reflection');
    expect(res.body.response).toContain('How can I approach this choice?');
    const gated = await post('/api/crystal-ball', { question: 'One more?', lang: 'en' }, 'mh_cb_free_uses=1');
    expect(gated.status).toBe(402);
    expect(gated.body.code).toBe('REGISTRATION_REQUIRED');
    expect(gated.body.error).toContain('Create a free account');
    expect(callClaude).toHaveBeenCalledTimes(1);
});

test('English crystal-ball missing question reports its validation error in English', async () => {
    const res = await post('/api/crystal-ball', { lang: 'en' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('A question is required');
});
