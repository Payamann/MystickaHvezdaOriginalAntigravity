import { jest } from '@jest/globals';
import { generateRelationshipReading, drawRelationshipCards } from '../services/relationship-tarot.js';

const paragraph = 'Vrať se ke konkrétní otázce, kterou popisuješ. Karta nabízí jiný úhel pohledu a jeden podnět k vlastnímu zamyšlení, nikoli důkaz o druhém člověku.';
const reading = { introduction: paragraph, cards: [paragraph, paragraph, paragraph], connection: paragraph, nextStep: paragraph, questions: ['Co chceš v rozhovoru pojmenovat?', 'Jakou změnu můžeš navrhnout?', 'Podle čeho poznáš posun?'] };
const providerReading = { introduction: paragraph, card1: paragraph, card2: paragraph, card3: paragraph, connection: paragraph, nextStep: paragraph, question1: reading.questions[0], question2: reading.questions[1], question3: reading.questions[2] };
const previous = { NODE_ENV: process.env.NODE_ENV, MOCK_AI: process.env.MOCK_AI, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY };
const originalFetch = global.fetch;
let upstream;

beforeAll(() => {
    process.env.NODE_ENV = 'development';
    process.env.MOCK_AI = 'false';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-placeholder';
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
    upstream.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(providerReading) }] }) });
    await expect(generateRelationshipReading({ question: 'Jak můžeme v klidu probrat rozdělení úkolů?', cards: drawRelationshipCards() })).resolves.toEqual(reading);
    const body = JSON.parse(upstream.mock.calls[0][1].body);
    expect(body.output_config.format.type).toBe('json_schema');
    expect(body.output_config.format.schema.required).toEqual(['introduction', 'card1', 'card2', 'card3', 'connection', 'nextStep', 'question1', 'question2', 'question3']);
    expect(body.output_config.format.schema.additionalProperties).toBe(false);
});

test('malformed upstream content never exposes private fragments through parsing errors', async () => {
    upstream.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'PRIVATE_CUSTOMER_QUESTION invalid JSON' }] }) });
    await expect(generateRelationshipReading({ question: 'PRIVATE_CUSTOMER_QUESTION', cards: drawRelationshipCards() })).rejects.toThrow('Invalid relationship reading JSON');
    expect(JSON.stringify(console.error.mock.calls)).not.toContain('PRIVATE_CUSTOMER_QUESTION');
});
