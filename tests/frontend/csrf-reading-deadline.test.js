import { jest } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../js/api-config.js', import.meta.url), 'utf8');
const tokenResponse = token => ({ ok: true, json: async () => ({ csrfToken: token }) });

test('a reading stops waiting for the token and can retry independently of the shared request', async () => {
    jest.useFakeTimers();
    try {
        const never = new Promise(() => {});
        const tokens = jest.fn().mockReturnValueOnce(never)
            .mockResolvedValueOnce({ ok: true, json: () => never })
            .mockResolvedValueOnce(tokenResponse('new-reading-token'));
        const window = {};
        const fetch = (url, options) => url === '/api/csrf-token'
            ? tokens(options)
            : Promise.resolve({ ok: true, json: async () => ({}) });
        vm.runInNewContext(source, { window, fetch, AbortController, setTimeout, clearTimeout, console });

        void window.getCSRFToken();
        const pending = window.getCSRFToken({ bounded: true });
        await jest.advanceTimersByTimeAsync(20_000);
        expect(await pending).toBeNull();
        expect(tokens.mock.calls[1][0].signal.aborted).toBe(true);
        expect(await window.getCSRFToken({ bounded: true })).toBe('new-reading-token');
        expect(tokens).toHaveBeenCalledTimes(3);
    } finally {
        jest.useRealTimers();
    }
});
