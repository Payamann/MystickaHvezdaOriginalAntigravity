import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const source = fs.readFileSync(new URL('../../js/horoscope-share.js', import.meta.url), 'utf8');

// Exercise the real observer/render lifecycle without requesting an AI reading.
function fixture(loaded) {
    let observer;
    let artwork;
    let panel;
    const appended = [];
    const metaWrites = [];
    const elements = new Map([
        ['detail-name', { innerText: 'Beran' }],
        ['detail-symbol', { innerText: '♈' }],
        ['detail-date', { innerText: 'Dnes — 11. října 2026' }],
        ['detail-text', { innerText: 'Dnešek může otevřít otázku, kde má smysl začít jedním konkrétním krokem.' }],
        ['detail-work', { innerText: '' }]
    ]);
    const content = { appendChild: node => { panel = node; appended.push(node); }, querySelector: () => panel };
    const section = { dataset: { loaded }, isConnected: true, querySelector: () => content };
    const node = () => ({
        appendChild() {}, addEventListener() {}, setAttribute() {},
        classList: { toggle: () => false },
        remove() { if (panel === this) panel = null; }
    });
    const ctx = new Proxy({
        createLinearGradient: () => ({ addColorStop() {} }),
        createRadialGradient: () => ({ addColorStop() {} }),
        measureText: text => ({ width: text.length * 15 })
    }, { get: (target, key) => target[key] ?? (() => {}) });
    const document = {
        readyState: 'complete', fonts: { ready: Promise.resolve() },
        head: { appendChild() {} },
        getElementById: id => id === 'horoscope-detail-section' ? section
            : id === 'horoscope-share-panel' ? panel : elements.get(id),
        querySelector: selector => selector === '[data-tab].active'
            ? { dataset: { tab: 'daily' } }
            : { setAttribute: (key, value) => metaWrites.push([key, value]) },
        createElement: tag => {
            if (tag === 'canvas') return { getContext: () => ctx, toDataURL: () => 'data:image/jpeg;base64,test', setAttribute() {} };
            const el = node();
            const controls = new Map();
            el.querySelector = selector => {
                if (!controls.has(selector)) controls.set(selector, node());
                return controls.get(selector);
            };
            return el;
        }
    };
    const imageConstructor = jest.fn(function () {
        artwork = this;
        this.width = 1200;
        this.height = 800;
    });
    vm.runInNewContext(source, {
        document, Image: imageConstructor, navigator: {}, console,
        MutationObserver: class { constructor(callback) { observer = callback; } observe() {} },
        setTimeout, File: class {}
    });
    return {
        section, appended, metaWrites, imageConstructor,
        get panel() { return panel; },
        notify: () => observer(),
        finishArtwork: () => artwork.onload()
    };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test.each([undefined, 'false'])('does not share placeholder/error text before a successful result (%s)', loaded => {
    const app = fixture(loaded);
    expect(app.imageConstructor).not.toHaveBeenCalled();
    expect(app.metaWrites).toHaveLength(0);
    expect(app.appended).toHaveLength(0);
});

test('renders one share panel for a successful reading and removes it when a new selection starts', async () => {
    const app = fixture('true');
    app.finishArtwork();
    await flush();
    expect(app.appended).toHaveLength(1);
    await app.notify();
    expect(app.appended).toHaveLength(1);
    app.section.dataset.loaded = 'false';
    await app.notify();
    expect(app.panel).toBeNull();
});

test('an image finishing after invalidation cannot restore an obsolete reading, and retry can render', async () => {
    const app = fixture('true');
    app.section.dataset.loaded = 'false';
    await app.notify();
    app.finishArtwork();
    await flush();
    expect(app.appended).toHaveLength(0);
    app.section.dataset.loaded = 'true';
    await app.notify();
    expect(app.appended).toHaveLength(1);
});
