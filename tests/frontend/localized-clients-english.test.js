import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const readSource = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('crystal ball exposes English interaction, limit, error, and Czech payment notice copy', () => {
    const document = { addEventListener: jest.fn() };
    const window = { location: { pathname: '/crystal-ball.html' } };
    const context = vm.createContext({ document, window, console });
    vm.runInContext(readSource('../../js/crystal-ball.js'), context);
    const copy = vm.runInContext('CRYSTAL_UI_COPY.en', context);

    expect(copy.ask).toBe('Ask the crystal ball');
    expect(copy.disconnected).toContain('connection was interrupted');
    expect(copy.anonymousLimit).toContain('currently in Czech');
    expect(copy.memberLimit).toContain('Czech koruna');
    expect(copy.cooldown(4)).toContain('(4s)');
});

test('birth chart renders English planet and sign names for an English page', async () => {
    const listeners = {};
    const makeElement = () => ({
        children: [],
        append(...items) { this.children.push(...items); },
        appendChild(item) { this.children.push(item); },
        replaceChildren(...items) { this.children = items; },
        addEventListener(name, callback) { listeners[name] = callback; },
        setAttribute() {},
        removeAttribute() {},
        reportValidity: () => true,
        textContent: '',
        className: ''
    });
    const elements = {
        'natal-form': makeElement(),
        'natal-result': makeElement(),
        'birth-date': { value: '1990-01-01' },
        'birth-time': { value: '12:00' },
        'birth-place': { value: 'London' },
        'calculate-natal': { textContent: 'Calculate', disabled: false }
    };
    const document = {
        readyState: 'loading',
        documentElement: { lang: 'en-GB' },
        addEventListener: (name, callback) => { if (name === 'DOMContentLoaded') callback(); },
        getElementById: (id) => elements[id] || null,
        createElement: makeElement
    };
    const chart = {
        planets: {
            sun: { sign: { id: 'aries' }, degreeText: '10°' },
            moon: { sign: { id: 'taurus' }, degreeText: '20°' },
            mercury: { sign: { id: 'gemini' }, degreeText: '3°' }
        },
        houses: { ascendant: { sign: { id: 'cancer' }, degreeText: '5°' } }
    };
    const context = vm.createContext({
        document,
        window: { API_CONFIG: { BASE_URL: '/api' } },
        URLSearchParams,
        fetch: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, chart }) })
    });
    vm.runInContext(readSource('../../js/localized-natal-chart.js'), context);
    await listeners.submit({ preventDefault() {} });

    const text = (node) => [node.textContent, ...(node.children || []).map(text)].join(' ');
    const rendered = text(elements['natal-result']);
    expect(rendered).toContain('Your birth chart');
    expect(rendered).toContain('Sun');
    expect(rendered).toContain('Aries');
    expect(rendered).toContain('Moon');
    expect(rendered).toContain('Taurus');
    expect(rendered).toContain('Ascendant');
    expect(rendered).toContain('Cancer');
    expect(rendered).toContain('Mercury');
    expect(rendered).toContain('Gemini');
    expect(rendered).toContain('symbolic map');
});
