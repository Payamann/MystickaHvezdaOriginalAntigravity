/**
 * One-click unsubscribe (RFC 8058). Gmail/Apple Mail POSTují na List-Unsubscribe URL
 * bez cookies i CSRF tokenu. Regrese: POST /api/subscribe/horoscope/unsubscribe musí
 * existovat a být vyňatý z CSRF (dřív vracel 403 → tlačítko "Odhlásit odběr" nefungovalo
 * a uživatelé museli psát ručně).
 */
import request from 'supertest';
import app from '../index.js';

describe('Horoscope one-click unsubscribe (POST, CSRF-free)', () => {
    test('POST bez CSRF tokenu neni 403 (endpoint je vynaty z CSRF)', async () => {
        const res = await request(app)
            .post('/api/subscribe/horoscope/unsubscribe?token=any-token')
            .send({});
        expect(res.status).not.toBe(403);
        expect([200, 500]).toContain(res.status); // 200 zpracovano; 500 jen kdyby mock DB selhal
    });

    test('POST bez tokenu vraci 400', async () => {
        const res = await request(app)
            .post('/api/subscribe/horoscope/unsubscribe')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ success: false });
    });

    test('POST s tokenem vraci JSON success (idempotentni)', async () => {
        const res = await request(app)
            .post('/api/subscribe/horoscope/unsubscribe?token=some-token');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ success: true });
    });
});
