import { jest } from '@jest/globals';

const callClaude = jest.fn();
jest.unstable_mockModule('../services/claude.js', () => ({ callClaude }));
const { generatePersonalMapContent, buildPersonalMapFallbackSections } = await import('../services/personal-map-pdf.js');

const input = { name: 'Test', birthDate: '1990-01-01', sign: 'beran',
    focus: 'Jak najít prostor pro odpočinek?', periodStart: '2026-10-15', periodEnd: '2027-10-14' };

async function withRealGeneration(run) {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalMock = process.env.MOCK_AI;
    try {
        process.env.NODE_ENV = 'production';
        process.env.MOCK_AI = 'false';
        callClaude.mockReset();
        await run();
    } finally {
        if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
        if (originalMock === undefined) delete process.env.MOCK_AI; else process.env.MOCK_AI = originalMock;
    }
}

test('paid map generation failure never returns generic substitute content', async () => {
    await withRealGeneration(async () => {
        // Only this function is switched out of its fixture branch; the AI
        // dependency remains mocked and no provider request is possible.
        callClaude.mockRejectedValueOnce(new Error('provider unavailable'));
        await expect(generatePersonalMapContent(input))
            .rejects.toThrow('Personal map generation failed');
        expect(callClaude).toHaveBeenCalledTimes(1);
    });
});

test('missing paid map chapter triggers one corrective generation before delivery', async () => {
    await withRealGeneration(async () => {
        const complete = buildPersonalMapFallbackSections(input);
        const incomplete = { ...complete, mainTheme: '' };
        callClaude.mockResolvedValueOnce(JSON.stringify(incomplete)).mockResolvedValueOnce(JSON.stringify(complete));
        await expect(generatePersonalMapContent(input)).resolves.toMatchObject({ mainTheme: complete.mainTheme });
        expect(callClaude).toHaveBeenCalledTimes(2);
        expect(callClaude.mock.calls[1][0]).toContain('Nevynechávej části');
    });
});

test('repeatedly incomplete paid map stays pending rather than sending a hollow PDF', async () => {
    await withRealGeneration(async () => {
        const incomplete = { ...buildPersonalMapFallbackSections(input), mainTheme: '' };
        callClaude.mockResolvedValue(JSON.stringify(incomplete));
        await expect(generatePersonalMapContent(input)).rejects.toThrow('Personal map generation failed');
        expect(callClaude).toHaveBeenCalledTimes(2);
    });
});
