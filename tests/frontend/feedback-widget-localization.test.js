import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const source = fs.readFileSync(new URL('../../js/feedback-widget.js', import.meta.url), 'utf8');

function createRuntime({ lang = 'cs', responseOk = true } = {}) {
    const status = { textContent: '' };
    const buttons = ['yes', 'no'].map((value) => ({
        disabled: false,
        dataset: { feedbackValue: value },
        closest: (selector) => selector === '[data-feedback-widget]' ? widget : null
    }));
    const widget = {
        dataset: {},
        querySelector: () => status,
        querySelectorAll: () => buttons
    };
    const fetch = jest.fn(async () => ({ ok: responseOk }));
    let clickHandler;
    const document = {
        documentElement: { lang },
        title: 'Test page',
        addEventListener: jest.fn((eventName, handler) => {
            if (eventName === 'click') clickHandler = handler;
        }),
        location: { pathname: `/${lang}/test.html` }
    };
    const window = {
        location: { pathname: `/${lang}/test.html` },
        getCSRFToken: jest.fn(async () => 'test-csrf-token')
    };
    const context = vm.createContext({ document, window, fetch, JSON, Error });
    vm.runInContext(source, context);

    return { context, fetch, status, buttons, widget, window, clickHandler: (button) => clickHandler({ target: button }) };
}

async function clickFeedback(harness, value) {
    const button = harness.buttons.find((candidate) => candidate.dataset.feedbackValue === value);
    harness.clickHandler({
        closest: (selector) => selector === '[data-feedback-value]' ? button : null
    });
    await new Promise((resolve) => setImmediate(resolve));
}

const localizedSuccessCopy = [
    ['cs', 'Díky, tohle nám pomáhá držet kvalitu.', 'Díky, podíváme se, kde stránka ztrácí jasnost.'],
    ['sk', 'Ďakujeme, pomáha nám to udržať kvalitu.', 'Ďakujeme, pozrieme sa, kde stránka stráca zrozumiteľnosť.'],
    ['pl', 'Dziękujemy, to pomaga nam dbać o jakość.', 'Dziękujemy, sprawdzimy, co na stronie jest niejasne.'],
    ['en', 'Thank you. Your feedback helps us maintain quality.', 'Thank you. We’ll look into what could be clearer on the page.']
];

test.each(localizedSuccessCopy)('shows localized success copy for %s for both feedback choices', async (lang, yesCopy, noCopy) => {
    for (const [value, expectedCopy] of [['yes', yesCopy], ['no', noCopy]]) {
        const harness = createRuntime({ lang });
        await clickFeedback(harness, value);

        expect(harness.status.textContent).toBe(expectedCopy);
        expect(harness.widget.dataset.feedbackSubmitted).toBe('true');
        expect(harness.buttons.every((button) => button.disabled)).toBe(true);
        expect(harness.fetch).toHaveBeenCalledWith('/api/analytics/event', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            headers: expect.objectContaining({ 'X-CSRF-Token': 'test-csrf-token' })
        }));
    }
});

test('shows localized failure copy and re-enables feedback buttons for retry', async () => {
    const harness = createRuntime({ lang: 'sk', responseOk: false });
    await clickFeedback(harness, 'yes');

    expect(harness.status.textContent).toBe('Spätnú väzbu sa nepodarilo uložiť.');
    expect(harness.widget.dataset.feedbackSubmitted).toBeUndefined();
    expect(harness.buttons.every((button) => !button.disabled)).toBe(true);
    expect(harness.fetch).toHaveBeenCalledTimes(1);
});
