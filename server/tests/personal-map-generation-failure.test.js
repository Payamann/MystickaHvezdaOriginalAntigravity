import { jest } from '@jest/globals';

const callClaude = jest.fn();
jest.unstable_mockModule('../services/claude.js', () => ({ callClaude }));
const { generatePersonalMapContent } = await import('../services/personal-map-pdf.js');

test('paid map generation failure never returns generic substitute content', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalMock = process.env.MOCK_AI;
    try {
        // Only this function is switched out of its fixture branch; the AI
        // dependency remains mocked and no provider request is possible.
        process.env.NODE_ENV = 'production';
        process.env.MOCK_AI = 'false';
        callClaude.mockRejectedValueOnce(new Error('provider unavailable'));
        await expect(generatePersonalMapContent({ name: 'Test', birthDate: '1990-01-01', sign: 'beran',
            focus: 'Jak najít prostor pro odpočinek?', periodStart: '2026-10-15', periodEnd: '2027-10-14' }))
            .rejects.toThrow('Personal map generation failed');
        expect(callClaude).toHaveBeenCalledTimes(1);
    } finally {
        if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
        if (originalMock === undefined) delete process.env.MOCK_AI; else process.env.MOCK_AI = originalMock;
    }
});
