import {
    buildWeeklyDigestContent,
    getIsoWeekKey,
    getLatestBlogPost,
    getWeeklyPremiumSpotlight,
    getWeeklyToolTip,
    run
} from '../jobs/weekly-newsletter.js';
import { EMAIL_TEMPLATES } from '../email-service.js';
import { supabase } from '../db-supabase.js';

describe('weekly newsletter digest', () => {
    test('computes ISO week keys on the Prague calendar', () => {
        expect(getIsoWeekKey(new Date('2026-07-06T07:00:00Z'))).toBe('2026-W28'); // Monday
        expect(getIsoWeekKey(new Date('2026-07-12T21:00:00Z'))).toBe('2026-W28'); // Sunday 23:00 Prague
        // 22:30 UTC Sunday = 00:30 Monday Prague -> next ISO week
        expect(getIsoWeekKey(new Date('2026-07-12T22:30:00Z'))).toBe('2026-W29');
        expect(getIsoWeekKey(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01');
    });

    test('tool tip rotates deterministically by week', () => {
        const tipA = getWeeklyToolTip(new Date('2026-07-06T07:00:00Z'));
        const tipSameWeek = getWeeklyToolTip(new Date('2026-07-10T07:00:00Z'));
        const tipNextWeek = getWeeklyToolTip(new Date('2026-07-13T07:00:00Z'));

        expect(tipA.title).toBe(tipSameWeek.title);
        expect(tipA.title).not.toBe(tipNextWeek.title);
        expect(tipA.url).toContain('source=newsletter_digest');
        expect(tipA.url).toContain('utm_campaign=weekly_digest');
    });

    test('picks the newest already-published blog post', () => {
        const posts = [
            { title: 'Old', slug: 'old', published_at: '2026-01-01' },
            { title: 'New', slug: 'new', published_at: '2026-06-30' },
            { title: 'Future', slug: 'future', published_at: '2099-01-01' }
        ];
        const post = getLatestBlogPost(new Date('2026-07-06T07:00:00Z'), posts);
        expect(post.slug).toBe('new');
    });

    test('digest content carries week key, moon phase and attribution links', () => {
        const content = buildWeeklyDigestContent(new Date('2026-07-06T07:00:00Z'));

        expect(content.week_key).toBe('2026-W28');
        expect(content.moon_phase.length).toBeGreaterThan(3);
        expect(content.tip_url).toContain('utm_campaign=weekly_digest');
        if (content.blog_url) {
            expect(content.blog_url).toContain('/blog/');
        }
    });

    test('premium spotlight alternates by week and carries attribution links', () => {
        const spotA = getWeeklyPremiumSpotlight(new Date('2026-07-06T07:00:00Z'));
        const spotSameWeek = getWeeklyPremiumSpotlight(new Date('2026-07-10T07:00:00Z'));
        const spotNextWeek = getWeeklyPremiumSpotlight(new Date('2026-07-13T07:00:00Z'));

        expect(spotA.title).toBe(spotSameWeek.title);
        expect(spotA.title).not.toBe(spotNextWeek.title);
        expect(spotA.url).toContain('source=newsletter_digest');
        expect(spotA.url).toContain('utm_campaign=weekly_digest');
        expect(spotA.price).toContain('Kč');

        const content = buildWeeklyDigestContent(new Date('2026-07-06T07:00:00Z'));
        expect(content.premium_title).toBe(spotA.title);
        expect(content.premium_url).toBe(spotA.url);
    });

    test('newsletter_weekly_digest template renders with unsubscribe link', () => {
        const template = EMAIL_TEMPLATES.newsletter_weekly_digest;
        expect(template).toBeDefined();

        const html = template.getHtml({
            date_label: '6. července',
            moon_phase: 'Úplněk (Vyvrcholení, odhalení pravdy)',
            blog_title: 'Testovací článek',
            blog_description: 'Popis.',
            blog_url: '/blog/test.html?utm_source=email&utm_campaign=weekly_digest',
            tip_title: 'Tarot ANO / NE',
            tip_text: 'Polož otázku.',
            tip_url: '/tarot-ano-ne.html?source=newsletter_digest',
            premium_title: 'Osobní mapa zbytku roku 2026',
            premium_text: '16 stran osobního výkladu.',
            premium_price: '299 Kč · jednorázově · PDF do e-mailu',
            premium_url: '/osobni-mapa.html?source=newsletter_digest',
            unsubscribe_url: '/api/newsletter/unsubscribe?email=a%40b.cz&token=abc'
        });

        expect(html).toContain('Hvězdný týden');
        expect(html).toContain('Úplněk');
        expect(html).toContain('Testovací článek');
        expect(html).toContain('Prémiový výklad');
        expect(html).toContain('Osobní mapa zbytku roku 2026');
        expect(html).toContain('/osobni-mapa.html?source=newsletter_digest');
        expect(html).toContain('/api/newsletter/unsubscribe?email=a%40b.cz');
        expect(typeof template.subject({ date_label: '6. července' })).toBe('string');
    });

    test('digest renders without premium block when spotlight data is absent (older queued emails)', () => {
        const html = EMAIL_TEMPLATES.newsletter_weekly_digest.getHtml({
            date_label: '6. července',
            tip_title: 'Tarot ANO / NE',
            tip_text: 'Polož otázku.',
            tip_url: '/tarot-ano-ne.html?source=newsletter_digest',
            unsubscribe_url: '/api/newsletter/unsubscribe?email=a%40b.cz&token=abc'
        });

        expect(html).not.toContain('Prémiový výklad');
        expect(html).toContain('Hvězdný týden');
    });

    test('run() enqueues once per subscriber per ISO week (dedupe on second run)', async () => {
        const email = `weekly-digest-${Date.now()}@example.com`;
        await supabase.from('newsletter_subscribers').insert({
            email,
            is_active: true,
            created_at: new Date().toISOString()
        });
        await supabase.from('newsletter_subscribers').insert({
            email: `inactive-${Date.now()}@example.com`,
            is_active: false,
            created_at: new Date().toISOString()
        });

        const now = new Date('2026-07-06T07:00:00Z');
        const first = await run({ now });
        expect(first.scheduled).toBeGreaterThanOrEqual(1);

        const second = await run({ now });
        expect(second.scheduled).toBe(0);
        expect(second.skipped).toBeGreaterThanOrEqual(1);

        const { data: queued } = await supabase
            .from('email_queue')
            .select('*')
            .eq('email_to', email);

        expect(queued).toHaveLength(1);
        expect(queued[0].template).toBe('newsletter_weekly_digest');
        expect(queued[0].data.dedupeKey).toBe(`newsletter_digest:${email}:2026-W28`);
        expect(queued[0].data.unsubscribe_url).toContain(encodeURIComponent(email));
    });
});
