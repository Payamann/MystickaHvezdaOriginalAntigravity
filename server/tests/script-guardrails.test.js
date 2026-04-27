import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(process.cwd());

function readScript(relativePath) {
    return fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');
}

describe('manual script guardrails', () => {
    test('newsletter script requires explicit send flag', () => {
        const source = readScript('server/scripts/send-newsletter.js');

        expect(source).toContain("process.argv.includes('--send')");
        expect(source).toContain('if (SHOULD_SEND)');
        expect(source).toContain('[DRY RUN]');
        expect(source).not.toMatch(/await\s+sendNewsletter\(\s*{/);
    });

    test('daily horoscope CLI send requires explicit send flag', () => {
        const source = readScript('server/scripts/send-daily-horoscope.js');

        expect(source).toContain("process.argv.includes('--send')");
        expect(source).toContain('[DRY RUN]');
        expect(source).toContain('export async function run()');
    });

    test('horoscope prefill requires explicit write flag', () => {
        const source = readScript('server/scripts/prefill-horoscopes.js');

        expect(source).toContain("args.includes('--write')");
        expect(source).toContain('if (!SHOULD_WRITE)');
        expect(source).toContain('[DRY RUN]');
    });
});
