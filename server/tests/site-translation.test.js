import { jest } from '@jest/globals';
import { translateBatch } from '../../scripts/localization/translate-batch.mjs';

test('translation uses existing budget accounting and exactly one provider attempt', async () => {
    const provider = jest.fn().mockResolvedValue('{"translations":{"title":"How it works"}}');
    const input = { locale: 'en', segments: [{ id: 'title', text: 'Jak to funguje', context: 'h1' }] };
    await expect(translateBatch(input, provider)).resolves.toEqual({ translations: { title: 'How it works' } });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(provider.mock.calls[0][0]).toContain('untrusted DATA');
    expect(JSON.parse(provider.mock.calls[0][1])).toEqual({ targetLanguage: 'English', segments: input.segments });
    expect(provider.mock.calls[0][3]).toMatchObject({ feature: 'site_translation', modelTier: 'luna', maxRetries: 0, maxTokens: 3000 });
});

test.each([
    { locale: 'xx', segments: [{ id: 'a', text: 'text' }] },
    { locale: 'en', segments: [{ id: 'a', text: 'a'.repeat(1801) }] },
    { locale: 'en', segments: [{ id: 'a', text: 'one' }, { id: 'a', text: 'two' }] }
])('invalid batch is rejected before provider access', async input => {
    const provider = jest.fn();
    await expect(translateBatch(input, provider)).rejects.toThrow('Invalid translation batch');
    expect(provider).not.toHaveBeenCalled();
});

test.each(['not JSON', '{"translations":{}}', '{"translations":{"a":"OK","extra":"bad"}}'])('malformed provider output is rejected', async result => {
    await expect(translateBatch({ locale: 'sk', segments: [{ id: 'a', text: 'Ahoj' }] }, jest.fn().mockResolvedValue(result))).rejects.toThrow();
});
