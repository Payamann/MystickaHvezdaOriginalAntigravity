import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const skippedDirectories = new Set([
    '.git',
    '.agents',
    '.claude',
    '.claire',
    'artifacts',
    'components',
    'coverage',
    'docs',
    'node_modules',
    'playwright-report',
    'social-media-agent',
    'templates',
    'test-results',
    'tests',
    'tmp',
    'tmp_email_previews'
]);

function walkHtml(directory = projectRoot, output = []) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (!skippedDirectories.has(entry.name)) walkHtml(absolutePath, output);
            continue;
        }
        if (entry.isFile() && entry.name.endsWith('.html')) output.push(absolutePath);
    }
    return output;
}

function relative(file) {
    return path.relative(projectRoot, file).replaceAll(path.sep, '/');
}

function dispatchScriptEvent(script, type) {
    for (const listener of script.listeners.get(type) || []) listener();
}

describe('analytics loader coverage', () => {
    test('every canonical HTML uses direct analytics or the shared components/core loader', () => {
        const uncovered = [];

        for (const file of walkHtml()) {
            const html = fs.readFileSync(file, 'utf8');
            if (!/<link\b[^>]*\brel=["']canonical["'][^>]*>/i.test(html)) continue;

            const direct = /<script\b[^>]*\bsrc=["'][^"']*js\/(?:dist\/)?analytics\.js(?:\?[^"']*)?["']/i.test(html);
            const shared = /<script\b[^>]*\bsrc=["'][^"']*js\/(?:dist\/)?(?:components|core)\.js(?:\?[^"']*)?["']/i.test(html);
            if (!direct && !shared) uncovered.push(relative(file));
        }

        expect(uncovered).toEqual([]);
    });

    test('components/core injects consent mode, first-party analytics and then the consent UI', () => {
        const source = fs.readFileSync(path.join(projectRoot, 'js/components.js'), 'utf8');
        const appendedScripts = [];
        const componentTag = { getAttribute: () => '/js/dist/core.js' };
        const document = {
            querySelector: (selector) => {
                if (selector.includes('components.js') || selector.includes('core.js')) return componentTag;
                const sourceMatch = selector.match(/src\*=["']([^"']+)["']/);
                return sourceMatch
                    ? appendedScripts.find((script) => script.src.includes(sourceMatch[1])) || null
                    : null;
            },
            createElement: () => ({
                listeners: new Map(),
                addEventListener(type, listener) {
                    const current = this.listeners.get(type) || [];
                    current.push(listener);
                    this.listeners.set(type, current);
                }
            }),
            head: {
                appendChild: (script) => appendedScripts.push(script)
            },
            addEventListener: () => {}
        };
        const window = {};

        vm.runInNewContext(source, { window, document, console, Event });

        const analyticsInit = appendedScripts.find((script) => script.src === '/js/dist/analytics-init.js');
        expect(analyticsInit).toBeDefined();
        expect(appendedScripts.some((script) => script.src.includes('/analytics.js'))).toBe(false);

        dispatchScriptEvent(analyticsInit, 'load');

        const analyticsIndex = appendedScripts.findIndex((script) => script.src === '/js/dist/analytics.js?v=9');
        expect(analyticsIndex).toBeGreaterThan(-1);
        expect(appendedScripts.some((script) => script.src.includes('/cookie-handler.js'))).toBe(false);
        expect(appendedScripts[analyticsIndex].async).toBe(false);

        dispatchScriptEvent(appendedScripts[analyticsIndex], 'load');

        const cookieIndex = appendedScripts.findIndex((script) => script.src.includes('/cookie-handler.js'));
        expect(cookieIndex).toBeGreaterThan(analyticsIndex);
    });

    test('GA4 automatic page views are disabled in favor of the canonical page_view event', () => {
        const source = fs.readFileSync(path.join(projectRoot, 'js/analytics-init.js'), 'utf8');

        expect(source).toContain('send_page_view: false');
    });
});
