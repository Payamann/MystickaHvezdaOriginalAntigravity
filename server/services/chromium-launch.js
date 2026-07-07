/**
 * Shared Chromium launch options for the two PDF renderers (personal-map,
 * horoscope). Production runs on Railway/nixpacks, where Playwright's own
 * bundled browser download is unreliable — the earlier failure was
 * "browserType.launch: Executable doesn't exist at /root/.cache/...".
 *
 * Instead of depending on that download, we launch a system Chromium provided
 * by the build image (nixpacks nixPkgs = [..., "chromium"]), which ships with
 * its own runtime libraries. Resolution order:
 *   1. PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH (explicit override, wins)
 *   2. a chromium/chrome binary found on PATH (the nixpacks-provided one)
 *   3. null → let Playwright use its bundled browser (dev machines / CI where
 *      `playwright install` has run)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const CANDIDATE_COMMANDS = ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome'];
const CANDIDATE_PATHS = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/run/current-system/sw/bin/chromium'
];

function whichSync(command) {
    try {
        // stderr ignored: a not-found lookup writes "which: no <cmd>" that we
        // handle via the empty/throw path, no need to surface it in logs.
        const resolved = execFileSync('which', [command], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        return resolved || null;
    } catch {
        return null;
    }
}

/**
 * @param {object} [deps] - injectable for tests
 * @param {NodeJS.ProcessEnv} [deps.env]
 * @param {(cmd: string) => string|null} [deps.which]
 * @param {(p: string) => boolean} [deps.existsSync]
 * @returns {string|null} absolute path to a chromium binary, or null to defer to Playwright
 */
export function resolveChromiumExecutablePath({ env = process.env, which = whichSync, existsSync = fs.existsSync } = {}) {
    const explicit = env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
    if (explicit) return explicit;

    for (const command of CANDIDATE_COMMANDS) {
        const found = which(command);
        if (found) return found;
    }

    for (const candidate of CANDIDATE_PATHS) {
        if (existsSync(candidate)) return candidate;
    }

    return null;
}

let cachedExecutablePath; // undefined = not yet resolved; string|null once resolved

export function getChromiumLaunchOptions() {
    if (cachedExecutablePath === undefined) {
        cachedExecutablePath = resolveChromiumExecutablePath();
    }
    return {
        args: ['--no-sandbox'],
        ...(cachedExecutablePath ? { executablePath: cachedExecutablePath } : {})
    };
}
