import { jest } from '@jest/globals';
import { generateRelationshipReading, drawRelationshipCards } from '../services/relationship-tarot.js';

const paragraph = 'Vrať se ke konkrétní otázce, kterou popisuješ. Karta nabízí jiný úhel pohledu a jeden podnět k vlastnímu zamyšlení, nikoli důkaz o druhém člověku.';
const reading = { introduction: paragraph, cards: [paragraph, paragraph, paragraph], connection: paragraph, nextStep: paragraph, questions: ['Co chceš v rozhovoru pojmenovat?', 'Jakou změnu můžeš navrhnout?', 'Podle čeho poznáš posun?'] };
const providerReading = { introduction: paragraph, card1: paragraph, card2: paragraph, card3: paragraph, connection: paragraph, nextStep: paragraph, question1: reading.questions[0], question2: reading.questions[1], question3: reading.questions[2] };
const previous = { NODE_ENV: process.env.NODE_ENV, MOCK_AI: process.env.MOCK_AI, OPENAI_API_KEY: process.env.OPENAI_API_KEY };
const originalFetch = global.fetch;
let upstream;

beforeAll(() => {
    process.env.NODE_ENV = 'development';
    process.env.MOCK_AI = 'false';
    process.env.OPENAI_API_KEY = 'test-openai-placeholder';
    upstream = jest.fn();
    global.fetch = upstream;
});
afterAll(() => {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
});

test('real generator requests constrained JSON from the provider and validates its content', async () => {
    upstream.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ status: 'completed', output: [{ type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify(providerReading) }] }] }) });
    await expect(generateRelationshipReading({ question: 'Jak můžeme v klidu probrat rozdělení úkolů?', cards: drawRelationshipCards() })).resolves.toEqual(reading);
    const body = JSON.parse(upstream.mock.calls[0][1].body);
    expect(body.model).toBe('gpt-6-luna');
    expect(upstream.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');
    expect(body.text.format.type).toBe('json_schema');
    expect(body.text.format.schema.required).toEqual(['introduction', 'card1', 'card2', 'card3', 'connection', 'nextStep', 'question1', 'question2', 'question3']);
    expect(body.text.format.schema.additionalProperties).toBe(false);
    expect(body.instructions).toContain('DONA linku Bílého kruhu bezpečí 251 511 313');
    expect(body.instructions).toContain('Linku bezpečí 116 111 nikdy neoznačuj jako linku pro dospělé');
    expect(body.instructions).toContain('„jsi zahlcený“');
    expect(body.instructions).toContain('„ochotný nebo ochotná“');
    expect(body.instructions).toContain('„téma dosud neotevřel“');
    expect(body.instructions).toContain('„co bys chtělo“');
    expect(body.instructions).toContain('„pokud se cítíš připraveno“');
    expect(body.instructions).toContain('Neutrální oslovení vytvoř přestavbou věty');
});

const providerResponse = value => ({ ok: true, status: 200, json: async () => ({ status: 'completed', output: [{ type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] }) });
const neuterProviderReading = { ...providerReading, nextStep: `${paragraph} Co bys chtělo v rozhovoru otevřít?` };

test('second-person neuter gets one corrective generation with the same input', async () => {
    upstream.mockResolvedValueOnce(providerResponse(neuterProviderReading)).mockResolvedValueOnce(providerResponse(providerReading));
    const before = upstream.mock.calls.length;
    await expect(generateRelationshipReading({ question: 'Co se dá otevřít v rozhovoru?', cards: drawRelationshipCards() })).resolves.toEqual(reading);
    const [first, second] = upstream.mock.calls.slice(before).map(([, options]) => JSON.parse(options.body));
    expect(upstream.mock.calls.length - before).toBe(2);
    expect(second.input).toEqual(first.input);
    expect(second.instructions).toContain('Oprav jazyk přímého oslovení');
});

test('second neuter output fails after one correction', async () => {
    upstream.mockResolvedValueOnce(providerResponse(neuterProviderReading)).mockResolvedValueOnce(providerResponse(neuterProviderReading));
    const before = upstream.mock.calls.length;
    await expect(generateRelationshipReading({ question: 'Co se dá otevřít v rozhovoru?', cards: drawRelationshipCards() })).rejects.toMatchObject({ code: 'RELATIONSHIP_READING_NEUTER_ADDRESS' });
    expect(upstream.mock.calls.length - before).toBe(2);
});

test('structural validation errors do not trigger corrective generation', async () => {
    upstream.mockResolvedValueOnce(providerResponse({ ...providerReading, card1: 'short' }));
    const before = upstream.mock.calls.length;
    await expect(generateRelationshipReading({ question: 'Co se dá otevřít v rozhovoru?', cards: drawRelationshipCards() })).rejects.toThrow('Invalid relationship reading structure');
    expect(upstream.mock.calls.length - before).toBe(1);
});

test('malformed upstream content never exposes private fragments through parsing errors', async () => {
    upstream.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ status: 'completed', output: [{ type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: 'PRIVATE_CUSTOMER_QUESTION invalid JSON' }] }] }) });
    await expect(generateRelationshipReading({ question: 'PRIVATE_CUSTOMER_QUESTION', cards: drawRelationshipCards() })).rejects.toThrow('Invalid relationship reading JSON');
    expect(JSON.stringify(console.error.mock.calls)).not.toContain('PRIVATE_CUSTOMER_QUESTION');
});
