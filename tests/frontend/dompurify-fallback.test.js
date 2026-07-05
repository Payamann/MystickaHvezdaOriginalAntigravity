import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(process.cwd());

function readSource(relativePath) {
    return fs.readFileSync(path.join(ROOT_DIR, ...relativePath.split('/')), 'utf8');
}

// If the DOMPurify CDN script fails to load (blocked, offline, outage), these
// call sites must never fall back to rendering raw, unsanitized AI-generated
// HTML. The fallback must strip all tags instead of passing the raw string
// straight to innerHTML.
describe('DOMPurify fallback safety', () => {
    test('js/horoscope.js strips tags when DOMPurify is unavailable', () => {
        const source = readSource('js/horoscope.js');
        expect(source).toContain("DOMPurify.sanitize(rawHtml) : rawHtml.replace(/<[^>]*>/g, '')");
    });

    test('js/mentor.js strips tags when DOMPurify is unavailable', () => {
        const source = readSource('js/mentor.js');
        expect(source).toContain("DOMPurify.sanitize(html) : html.replace(/<[^>]*>/g, '')");
    });

    test('js/tarot.js strips tags when DOMPurify is unavailable', () => {
        const source = readSource('js/tarot.js');
        expect(source).toContain("DOMPurify.sanitize(formattedText) : formattedText.replace(/<[^>]*>/g, '')");
    });

    test('js/natal-chart.js strips tags when DOMPurify is unavailable', () => {
        const source = readSource('js/natal-chart.js');
        expect(source).toContain("DOMPurify.sanitize(formattedContent) : formattedContent.replace(/<[^>]*>/g, '')");
        expect(source).toContain("DOMPurify.sanitize(cleaned) : cleaned.replace(/<[^>]*>/g, '')");
        expect(source).toContain("DOMPurify.sanitize(htmlContent) : htmlContent.replace(/<[^>]*>/g, '')");
    });
});
