import { resolveChromiumExecutablePath } from '../services/chromium-launch.js';

const neverWhich = () => null;
const neverExists = () => false;

describe('chromium executable resolution', () => {
    test('explicit PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH wins over everything', () => {
        const resolved = resolveChromiumExecutablePath({
            env: { PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/custom/chromium' },
            which: () => '/usr/bin/chromium',
            existsSync: () => true
        });
        expect(resolved).toBe('/custom/chromium');
    });

    test('falls back to a chromium binary found on PATH (nixpacks-provided)', () => {
        const resolved = resolveChromiumExecutablePath({
            env: {},
            which: (cmd) => (cmd === 'chromium' ? '/nix/store/abc-chromium/bin/chromium' : null),
            existsSync: neverExists
        });
        expect(resolved).toBe('/nix/store/abc-chromium/bin/chromium');
    });

    test('falls back to a known absolute path when nothing is on PATH', () => {
        const resolved = resolveChromiumExecutablePath({
            env: {},
            which: neverWhich,
            existsSync: (p) => p === '/usr/bin/chromium'
        });
        expect(resolved).toBe('/usr/bin/chromium');
    });

    test('returns null when no system chromium exists, deferring to Playwright bundled', () => {
        const resolved = resolveChromiumExecutablePath({
            env: {},
            which: neverWhich,
            existsSync: neverExists
        });
        expect(resolved).toBeNull();
    });

    test('ignores a blank env override and continues resolving', () => {
        const resolved = resolveChromiumExecutablePath({
            env: { PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '   ' },
            which: (cmd) => (cmd === 'chromium-browser' ? '/usr/bin/chromium-browser' : null),
            existsSync: neverExists
        });
        expect(resolved).toBe('/usr/bin/chromium-browser');
    });
});
