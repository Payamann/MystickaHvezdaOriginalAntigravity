import { setHtmlFileContentSecurityPolicy } from '../utils/csp.js';

function makeResStub() {
    const headers = {};
    return {
        headers,
        setHeader(name, value) { headers[name] = value; }
    };
}

describe('CSP header resilience (5xx prevention)', () => {
    test('missing/unreadable HTML file does not throw and still sets a policy', () => {
        const res = makeResStub();
        // Simulates a transient FS error (file swapped mid-deploy).
        expect(() => setHtmlFileContentSecurityPolicy(res, '/nonexistent/tarot-karta-dne.html'))
            .not.toThrow();
        expect(res.headers['Content-Security-Policy']).toEqual(expect.stringContaining('default-src'));
    });

    test('an existing HTML file gets a hashed policy', () => {
        const res = makeResStub();
        setHtmlFileContentSecurityPolicy(res, new URL('../../tarot-karta-dne.html', import.meta.url).pathname);
        expect(res.headers['Content-Security-Policy']).toEqual(expect.stringContaining('script-src'));
    });
});
