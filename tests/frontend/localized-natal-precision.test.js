import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const source = fs.readFileSync(new URL('../../js/localized-natal-chart.js', import.meta.url), 'utf8');

async function calculate(lang, chart) {
    const node = () => ({
        children: [], textContent: '', value: '',
        append(...children) { this.children.push(...children); },
        appendChild(child) { this.children.push(child); },
        replaceChildren() { this.children = []; },
        setAttribute() {}, removeAttribute() {},
        addEventListener(event, handler) { this[event] = handler; },
        reportValidity: () => true,
    });
    const nodes = Object.fromEntries(['natal-form', 'natal-result', 'birth-date', 'birth-time', 'birth-place', 'calculate-natal'].map(id => [id, node()]));
    nodes['birth-date'].value = '1990-01-01';
    const document = { readyState: 'complete', documentElement: { lang }, getElementById: id => nodes[id], createElement: node };
    const fetch = jest.fn(async () => ({ ok: true, json: async () => ({ success: true, chart }) }));
    vm.runInNewContext(source, { document, window: {}, fetch, URLSearchParams });
    await nodes['natal-form'].submit({ preventDefault() {} });
    const text = element => [element.textContent, ...element.children.map(text)].join(' ');
    return text(nodes['natal-result']);
}

describe.each(['sk', 'pl', 'en'])('localized natal precision (%s)', lang => {
    test('recognized location/time shows its calculation basis and available ascendant', async () => {
        const text = await calculate(lang, {
            engine: { precision: 'birth_time_location_timezone' }, planets: {},
            houses: { available: true, ascendant: { sign: { id: 'aries' }, degreeText: '12°' } },
        });
        expect(text).toContain('12°');
        expect(text).toMatch(/časové pásmo|strefy czasowej|time zone/);
        expect(text).not.toContain('UTC');
    });

    test.each(['birth_time_utc', 'date_noon_utc', 'date_noon_location_timezone'])('degraded precision %s explains limitation and hides unavailable ascendant', async precision => {
        const text = await calculate(lang, {
            engine: { precision }, planets: {},
            houses: { available: false, ascendant: { sign: { id: 'aries' }, degreeText: '12°' } },
        });
        expect(text).not.toContain('12°');
        expect(text).toMatch(/nie sú dostupné|są niedostępne|are unavailable/);
        if (precision.endsWith('_utc')) expect(text).toContain('UTC');
    });
});
