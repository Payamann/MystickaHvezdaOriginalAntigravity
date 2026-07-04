import {
    buildNewsletterUnsubscribePath,
    buildNewsletterUnsubscribeToken,
    verifyNewsletterUnsubscribeToken
} from '../newsletter.js';
import { EMAIL_TEMPLATES } from '../email-service.js';

describe('newsletter welcome email', () => {
    test('unsubscribe token is deterministic and email-normalized', () => {
        const token = buildNewsletterUnsubscribeToken('User@Example.com ');
        expect(token).toBe(buildNewsletterUnsubscribeToken('user@example.com'));
        expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    test('verification accepts matching token and rejects forgeries', () => {
        const token = buildNewsletterUnsubscribeToken('user@example.com');
        expect(verifyNewsletterUnsubscribeToken('user@example.com', token)).toBe(true);
        expect(verifyNewsletterUnsubscribeToken('other@example.com', token)).toBe(false);
        expect(verifyNewsletterUnsubscribeToken('user@example.com', 'x'.repeat(64))).toBe(false);
        expect(verifyNewsletterUnsubscribeToken('user@example.com', '')).toBe(false);
    });

    test('unsubscribe path carries the encoded email and token', () => {
        const path = buildNewsletterUnsubscribePath('User@Example.com');
        expect(path).toContain('/api/newsletter/unsubscribe?email=user%40example.com&token=');
        expect(path).toContain(buildNewsletterUnsubscribeToken('user@example.com'));
    });

    test('newsletter_welcome template renders with attribution and unsubscribe link', () => {
        const template = EMAIL_TEMPLATES.newsletter_welcome;
        expect(template).toBeDefined();

        const html = template.getHtml({ unsubscribe_url: '/api/newsletter/unsubscribe?email=a%40b.cz&token=abc' });
        expect(html).toContain('tarot-ano-ne.html');
        expect(html).toContain('source=newsletter_welcome');
        expect(html).toContain('utm_campaign=newsletter_welcome');
        expect(html).toContain('/api/newsletter/unsubscribe?email=a%40b.cz');
        expect(html).toContain('token=abc');
    });
});
