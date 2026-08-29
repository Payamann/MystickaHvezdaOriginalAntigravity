import fs from 'node:fs';
import path from 'node:path';
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '../config/legal.js';

const ROOT_DIR = path.resolve(process.cwd());

function read(file) {
    return fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
}

function getDocumentVersion(html) {
    return html.match(/<meta\s+name="document-version"\s+content="([^"]+)"/i)?.[1] || null;
}

describe('Registration legal contract', () => {
    test('client payload versions match the documents presented to the user', () => {
        const privacyVersion = getDocumentVersion(read('soukromi.html'));
        const termsVersion = getDocumentVersion(read('podminky.html'));
        const serverAuth = read('server/auth.js');

        expect(privacyVersion).toBeTruthy();
        expect(termsVersion).toBeTruthy();
        expect(privacyVersion).toBe(CURRENT_PRIVACY_VERSION);
        expect(termsVersion).toBe(CURRENT_TERMS_VERSION);
        expect(serverAuth).toContain('CURRENT_TERMS_VERSION');
        expect(serverAuth).toContain('CURRENT_PRIVACY_VERSION');
        expect(serverAuth).toContain("from('user_consents')");
    });

    test('registration links directly to the current privacy policy', () => {
        const authHtml = read('prihlaseni.html');

        expect(authHtml).toContain('href="soukromi.html"');
        expect(authHtml).not.toContain('href="ochrana-soukromi.html"');
    });
});
