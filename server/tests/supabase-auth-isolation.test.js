import { jest } from '@jest/globals';

test('password sign-ins cannot replace the service authorization used by Stripe webhooks', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousMock = process.env.MOCK_SUPABASE;
    process.env.NODE_ENV = 'development';
    process.env.MOCK_SUPABASE = 'false';

    const serviceAuthorization = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    const databaseAuthorizations = [];
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = new URL(input);
        if (url.pathname === '/auth/v1/token') {
            const { email } = JSON.parse(init.body);
            return Response.json({
                access_token: `user-token-for-${email}`,
                refresh_token: 'test-refresh-token',
                expires_in: 3600,
                token_type: 'bearer',
                user: { id: email }
            });
        }
        if (url.pathname === '/rest/v1/payment_events') {
            const authorization = new Headers(init.headers).get('authorization');
            databaseAuthorizations.push(authorization);
            return authorization === serviceAuthorization
                ? new Response(null, { status: 201 })
                : Response.json({ code: '42501', message: 'Row-level security denied insert' }, { status: 403 });
        }
        throw new Error(`Unexpected request: ${url.pathname}`);
    });

    try {
        const { signInWithPassword, supabase } = await import('../db-supabase.js');
        const [first, second] = await Promise.all([
            signInWithPassword({ email: 'first@example.test', password: 'test-password' }),
            signInWithPassword({ email: 'second@example.test', password: 'test-password' })
        ]);
        expect(first.data.session.access_token).toBe('user-token-for-first@example.test');
        expect(second.data.session.access_token).toBe('user-token-for-second@example.test');

        const { error } = await supabase.from('payment_events').insert({ event_id: 'evt_test' });
        expect(error).toBeNull();
        expect(databaseAuthorizations).toEqual([serviceAuthorization]);
    } finally {
        fetchMock.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
        process.env.MOCK_SUPABASE = previousMock;
    }
});
