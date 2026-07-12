/**
 * Guard: paid one-time PDF emails (Roční horoskop, Osobní mapa) must fail
 * loudly when Resend is not configured. A silent return would let the
 * fulfillment paths mark a paid order as delivered without sending anything;
 * fulfillment (server/services/one-time-fulfillment.js) is contractually
 * throw-based — callers record the failure and the reconciliation job retries.
 *
 * Separate test file on purpose: email-service keeps the Resend client in a
 * module-level singleton, so the "no API key" branch is only reachable with a
 * fresh module registry and the env var removed before first use.
 */
delete process.env.RESEND_API_KEY;

const { sendHoroscopePdf, sendPersonalMapPdf } = await import('../email-service.js');

describe('one-time PDF email guard without RESEND_API_KEY', () => {
    afterAll(() => {
        process.env.RESEND_API_KEY = 'test-resend-key';
    });

    test('sendHoroscopePdf throws instead of silently succeeding', async () => {
        await expect(sendHoroscopePdf({
            to: 'test@example.com',
            name: 'Test',
            sign: 'beran',
            pdfBuffer: Buffer.from('pdf')
        })).rejects.toThrow(/RESEND_API_KEY/);
    });

    test('sendPersonalMapPdf throws instead of silently succeeding', async () => {
        await expect(sendPersonalMapPdf({
            to: 'test@example.com',
            name: 'Test',
            sign: 'beran',
            pdfBuffer: Buffer.from('pdf')
        })).rejects.toThrow(/RESEND_API_KEY/);
    });
});
