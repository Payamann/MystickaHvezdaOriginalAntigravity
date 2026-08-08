import {
    buildPersonalMapFallbackSections,
    buildPersonalMapGenerationPrompt,
    buildPersonalMapHtml,
    generatePersonalMapContent,
    renderPersonalMapPdf,
    samplePersonalMapData
} from '../services/personal-map-pdf.js';
import { buildPersonalMapPeriod } from '../services/personal-map-period.js';

function flattenSections(sections) {
    return JSON.stringify(sections);
}

function stripHtml(html) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ');
}

describe('personal map PDF service', () => {
    test('buildPersonalMapPeriod creates an exact rolling 12-month window with future key months', () => {
        const period = buildPersonalMapPeriod({
            periodStart: '2026-08-08',
            periodEnd: '2027-08-07'
        });

        expect(period).toMatchObject({
            start: '2026-08-08',
            end: '2027-08-07',
            months: 12,
            keyMonths: ['září 2026', 'listopad 2026', 'leden 2027', 'duben 2027', 'červenec 2027']
        });
        expect(period.label).toContain('8. srpna 2026');
        expect(period.label).toContain('7. srpna 2027');
    });

    test('late-year purchase crosses into the following year without truncating at 31 December', () => {
        const period = buildPersonalMapPeriod({
            now: new Date('2026-12-28T20:00:00Z')
        });

        expect(period).toMatchObject({
            start: '2026-12-28',
            end: '2027-12-27',
            months: 12,
            keyMonths: ['leden 2027', 'březen 2027', 'květen 2027', 'srpen 2027', 'listopad 2027']
        });
        expect(period.label).not.toContain('31. prosince 2026');
    });

    test('purchase date follows Europe/Prague around New Year and remains evergreen', () => {
        const period = buildPersonalMapPeriod({
            now: new Date('2026-12-31T23:30:00Z')
        });

        expect(period).toMatchObject({
            start: '2027-01-01',
            end: '2027-12-31',
            months: 12
        });
    });

    test('future-year and leap-day purchases still receive a complete rolling period', () => {
        const futurePeriod = buildPersonalMapPeriod({
            now: new Date('2028-10-31T12:00:00Z')
        });
        const leapPeriod = buildPersonalMapPeriod({ periodStart: '2028-02-29' });

        expect(futurePeriod).toMatchObject({
            start: '2028-10-31',
            end: '2029-10-30',
            months: 12
        });
        expect(leapPeriod).toMatchObject({
            start: '2028-02-29',
            end: '2029-02-28',
            months: 12
        });
    });

    test('buildPersonalMapGenerationPrompt creates a strict Czech JSON prompt', () => {
        const prompt = buildPersonalMapGenerationPrompt({
            name: 'Jana',
            birthDate: '1994-10-08',
            sign: 'vahy',
            focus: 'vztahy a práce',
            year: 2026,
            periodStart: '2026-08-08',
            periodEnd: '2027-08-07',
            focusArea: 'relationships'
        });

        expect(prompt.system).toContain('česká autorka');
        expect(prompt.user).toContain('Osobní mapa');
        expect(prompt.user).toContain('Jana');
        expect(prompt.user).toContain('Vrať pouze validní JSON bez markdownu');
        expect(prompt.user).toContain('"essence"');
        expect(prompt.user).toContain('"actionPlan"');
        expect(prompt.user).toContain('8. srpna 2026');
        expect(prompt.user).toContain('červenec 2027');
        expect(prompt.user).toContain('Vrať přesně 5 orientačních milníků');
        expect(prompt.user).toContain('Celý výklad platí pro celé období');
    });

    test('buildPersonalMapHtml renders premium PDF HTML and escapes user input', () => {
        const html = buildPersonalMapHtml({
            ...samplePersonalMapData,
            name: '<script>alert(1)</script>',
            focus: 'láska <img src=x onerror=alert(1)>'
        });

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('Osobní mapa');
        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).toContain('láska &lt;img src=x onerror=alert(1)&gt;');
        expect(html).toContain('8. srpna 2026 - 7. srpna 2027');
        expect(html).toContain('Milníky osobního roku');
        expect(html).toContain('mapa platí pro všech 12 navazujících měsíců');
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).not.toContain('<img src=x onerror=alert(1)>');
        expect(html).not.toContain('zbytku roku');
    });

    test('buildPersonalMapHtml renders exactly 20 pages with the new sections', () => {
        const html = buildPersonalMapHtml(samplePersonalMapData);
        const pageCount = (html.match(/class="mh-pdf-page /g) || []).length;
        expect(pageCount).toBe(20);
        // New value-adding sections must actually render, not just pad the count.
        expect(html).toContain('Co tě nese, i když je těžko');
        expect(html).toContain('Kratší věta, jasnější ne');
        expect(html).toContain('Kde ztrácíš sílu a co tě vrací');
        expect(html).toContain('Místo pro tvoje poznámky');
    });

    test('buildPersonalMapFallbackSections returns complete personalized fallback content', () => {
        const sections = buildPersonalMapFallbackSections({
            name: 'Pavel',
            sign: 'rak',
            focus: 'ověření doručení PDF',
            grammaticalGender: 'masculine',
            year: 2026
        });
        const text = flattenSections(sections);

        expect(sections.starSignature.text).toContain('Pavel');
        expect(sections.starSignature.text).toContain('2026');
        expect(sections.starSignature.text).toContain('ověření doručení PDF');
        expect(text).toContain('Rak');
        expect(text).not.toContain('Jana');
        expect(text).not.toContain('Váhy');
        expect(text).not.toMatch(/\b(vyrovnaná|laskavá|pravdivá|sama|zůstala)\b/i);
        expect(text).not.toMatch(/\b(AI|záložní|náhradní|selže)\b/i);
        expect(sections.essence).toHaveLength(4);
        expect(sections.months).toHaveLength(5);
        expect(sections.actionPlan).toHaveLength(5);
        expect(sections.journalPrompts).toHaveLength(6);
        expect(sections.closing).toContain('Pavel');
    });

    test('generatePersonalMapContent keeps mock/test content tied to requested identity', async () => {
        const previousMockAi = process.env.MOCK_AI;
        process.env.MOCK_AI = 'true';

        try {
            const sections = await generatePersonalMapContent({
                name: 'Pavel',
                sign: 'rak',
                focus: 'ověření doručení PDF',
                grammaticalGender: 'masculine',
                year: 2026
            });
            const text = flattenSections(sections);

            expect(text).toContain('Pavel');
            expect(text).toContain('Rak');
            expect(text).toContain('ověření doručení PDF');
            expect(text).not.toContain('Jana');
            expect(text).not.toContain('Jano');
            expect(text).not.toContain('Váhy');
            expect(text).not.toMatch(/\b(vyrovnaná|laskavá|pravdivá|sama|zůstala)\b/i);
        } finally {
            if (previousMockAi === undefined) {
                delete process.env.MOCK_AI;
            } else {
                process.env.MOCK_AI = previousMockAi;
            }
        }
    });

    test('buildPersonalMapHtml does not leak feminine template copy for masculine fallback content', () => {
        const sections = buildPersonalMapFallbackSections({
            name: 'Pavel',
            sign: 'rak',
            focus: 'ověření doručení PDF',
            grammaticalGender: 'masculine',
            year: 2026
        });
        const html = buildPersonalMapHtml({
            name: 'Pavel',
            sign: 'rak',
            birthDate: '1989-07-15',
            focus: 'ověření doručení PDF',
            year: 2026,
            productName: 'Osobní mapa',
            sections
        });
        const text = stripHtml(html);

        expect(text).toContain('Pavel');
        expect(text).toContain('Rak');
        expect(text).not.toContain('Jana');
        expect(text).not.toContain('Váhy');
        expect(text).not.toMatch(/\b(vyrovnaná|laskavá|pravdivá|sama|zůstala)\b/i);
    });

    test('renderPersonalMapPdf returns a real PDF buffer', async () => {
        const pdf = await renderPersonalMapPdf(samplePersonalMapData);
        const buffer = Buffer.from(pdf);

        expect(buffer.subarray(0, 4).toString('utf8')).toBe('%PDF');
        expect(buffer.length).toBeGreaterThan(50_000);
    }, 90000);
});
