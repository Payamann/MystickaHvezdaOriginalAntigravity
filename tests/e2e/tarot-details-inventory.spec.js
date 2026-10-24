import { test, expect } from '@playwright/test';

test('všech 78 tarotových detailů má dvě cesty k přehledu a zachované navazující akce', async ({ page }) => {
    const hubResponse = await page.request.get('/tarot-vyznam-karet.html');
    expect(hubResponse.status()).toBe(200);
    const hubHtml = await hubResponse.text();
    const detailPaths = [...hubHtml.matchAll(/href="(tarot-vyznam\/[^"?#]+\.html)"/g)]
        .map(([, href]) => href);
    const uniquePaths = [...new Set(detailPaths)];
    expect(uniquePaths).toHaveLength(78);

    const failures = [];
    const batchSize = 8;
    for (let offset = 0; offset < uniquePaths.length; offset += batchSize) {
        const batch = await Promise.all(uniquePaths.slice(offset, offset + batchSize).map(async path => {
            const response = await page.request.get(`/${path}`);
            const html = await response.text();
            const hubLinks = html.match(/href="\/tarot-vyznam-karet\.html(?:\?[^\"]*)?"/g) || [];
            const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
            const expectedCanonical = `https://www.mystickahvezda.cz/${path}`;
            const checks = {
                status: response.status() === 200,
                canonical: canonical?.[1] === expectedCanonical,
                hubLinks: hubLinks.length === 2,
                readingCtas: (html.match(/href="\/tarot\.html\?source=tarot_card_detail&amp;/g) || []).length === 1,
                repeatedReadingCta: (html.match(/href="\/tarot\.html\?source=tarot_card_detail_bottom&amp;/g) || []).length === 1,
                dailyCard: (html.match(/data-analytics-cta="tarot_card_detail_next_daily"/g) || []).length === 1,
                profileSave: (html.match(/data-analytics-cta="tarot_card_detail_next_profile"/g) || []).length === 1,
                relatedCards: (html.match(/class="tarot-related-card"/g) || []).length === 3
            };
            return { path, failedChecks: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name) };
        }));
        failures.push(...batch.filter(result => result.failedChecks.length > 0));
    }

    expect(failures).toEqual([]);
});
