import { buildHtml, renderPdf } from '../services/horoscope-pdf.js';

const SAMPLE_SECTIONS = {
    osobnost: 'Text o osobnosti.',
    laska: 'Text o lásce.',
    kariera: 'Text o kariéře.',
    rust: 'Text o růstu.',
    mesice: 'Květen: klidné období.\nZáří: čas na rozhodnutí.',
    slovo: 'Závěrečné povzbuzení.'
};

describe('annual horoscope PDF service', () => {
    test('buildHtml escapes malicious name and AI section content', () => {
        const html = buildHtml({
            name: '<script>alert(1)</script>',
            signName: 'Beran',
            glyph: '♈',
            year: 2026,
            birthFormatted: '1. ledna 1990',
            sections: {
                ...SAMPLE_SECTIONS,
                osobnost: 'Text <img src=x onerror=alert(1)> se skrytým útokem.'
            }
        });

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).not.toContain('<img src=x onerror=alert(1)>');
    });

    test('renderPdf disables JavaScript in the render context and still returns a real PDF buffer', async () => {
        const pdf = await renderPdf({
            name: 'Test Uživatel',
            sign: 'beran',
            birthDate: '1990-01-01',
            sections: SAMPLE_SECTIONS
        });
        const buffer = Buffer.from(pdf);

        expect(buffer.subarray(0, 4).toString('utf8')).toBe('%PDF');
        expect(buffer.length).toBeGreaterThan(1000);
    }, 90000);
});
