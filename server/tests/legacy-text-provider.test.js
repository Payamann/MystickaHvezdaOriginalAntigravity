import { jest } from '@jest/globals';

const callAI = jest.fn();
jest.unstable_mockModule('../services/openai.js', () => ({ callAI }));
const { callGemini } = await import('../services/gemini.js');

test('legacy Gemini import delegates to the shared OpenAI budgeted transport', async () => {
    const context = { userContext: { zodiacSign: 'Beran' } };
    const history = [{ role: 'user', content: 'Otázka' }];
    callAI.mockResolvedValue('Výklad');
    await expect(callGemini('Instructions', history, context)).resolves.toBe('Výklad');
    expect(callAI).toHaveBeenCalledWith('Instructions', history, context, {
        feature: 'legacy_text', maxTokens: 2048
    });
});

test('legacy import propagates OpenAI failure without another provider', async () => {
    callAI.mockRejectedValue(new Error('OpenAI unavailable'));
    await expect(callGemini('Instructions', 'Otázka')).rejects.toThrow('OpenAI unavailable');
});
