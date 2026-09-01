import request from 'supertest';
import app from '../index.js';
import { supabase } from '../db-supabase.js';
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '../config/legal.js';

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

function authIp(testName) {
    const suffix = [...testName].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 200;
    return `203.0.113.${suffix + 1}`;
}

describe('Auth edge cases', () => {
    test('registration accepts omitted birth date without downgrading to a validation error', async () => {
        const csrfToken = await getCsrfToken();
        const email = `no-birth-date-${Date.now()}@example.com`;

        const res = await request(app)
            .post('/api/auth/register')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', authIp('register-no-birth-date'))
            .send({
                email,
                password: 'TestPassword123!',
                confirm_password: 'TestPassword123!',
                first_name: 'Jana',
                gdpr_consent: true,
                terms_consent: true
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.requireEmailVerification).toBeUndefined();
        expect(res.body.emailVerificationSkipped).toBe(true);
        expect(res.body.user).toMatchObject({
            email,
            subscription_status: 'free',
            first_name: 'Jana'
        });
        expect(res.headers['set-cookie']?.join(';')).toContain('auth_token=');
        expect(res.body.error).toBeUndefined();

        const { data: authRecord, error: authError } = await supabase.auth.admin.getUserById(res.body.user.id);
        expect(authError).toBeNull();
        expect(authRecord.user.email_confirmed_at).toEqual(expect.any(String));
        expect(authRecord.user.user_metadata.legal_consent).toEqual(expect.objectContaining({
            gdpr: true,
            terms: true,
            privacy_version: CURRENT_PRIVACY_VERSION,
            terms_version: CURRENT_TERMS_VERSION,
            accepted_at: expect.any(String)
        }));
    });

    test('registration validates password_confirm from standalone auth form', async () => {
        const csrfToken = await getCsrfToken();

        const res = await request(app)
            .post('/api/auth/register')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', authIp('register-password-confirm-mismatch'))
            .send({
                email: `password-confirm-${Date.now()}@example.com`,
                password: 'TestPassword123!',
                password_confirm: 'DifferentPassword123!',
                first_name: 'Jana',
                gdpr_consent: true,
                terms_consent: true
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test('registration rejects missing legal consent with a stable code', async () => {
        const csrfToken = await getCsrfToken();
        const res = await request(app)
            .post('/api/auth/register')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', authIp('register-missing-consent'))
            .send({
                email: `missing-consent-${Date.now()}@example.com`,
                password: 'TestPassword123!'
            });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('LEGAL_CONSENT_REQUIRED');
    });

    test('registration rejects impossible birth time before creating an account', async () => {
        const csrfToken = await getCsrfToken();
        const res = await request(app)
            .post('/api/auth/register')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', authIp('register-invalid-birth-time'))
            .send({
                email: `invalid-time-${Date.now()}@example.com`,
                password: 'TestPassword123!',
                birth_time: '99:99',
                gdpr_consent: true,
                terms_consent: true
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/time/i);
    });

    test('registration safely repairs an Auth user left without an application profile', async () => {
        const email = `partial-register-${Date.now()}@example.com`;
        const password = 'TestPassword123!';
        const { data: partialAuth, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { first_name: 'Jana' }
        });
        expect(createError).toBeNull();

        const csrfToken = await getCsrfToken();
        const res = await request(app)
            .post('/api/auth/register')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', authIp('register-partial-recovery'))
            .send({
                email,
                password,
                gdpr_consent: true,
                terms_consent: true
            });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(expect.objectContaining({
            success: true,
            recoveredRegistration: true,
            user: expect.objectContaining({
                id: partialAuth.user.id,
                email,
                subscription_status: 'free'
            })
        }));
        expect(res.headers['set-cookie']?.join(';')).toContain('auth_token=');

        const { data: repairedUser } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', partialAuth.user.id)
            .single();
        expect(repairedUser).toMatchObject({ id: partialAuth.user.id, email });

        const { data: signupEvents } = await supabase
            .from('analytics_events')
            .select('id')
            .eq('user_id', partialAuth.user.id)
            .eq('event_type', 'signup_completed');
        expect(signupEvents).toHaveLength(1);
    });

    test('registration recovery never grants access with a different password', async () => {
        const email = `partial-register-wrong-password-${Date.now()}@example.com`;
        await supabase.auth.admin.createUser({
            email,
            password: 'OriginalPassword123!',
            email_confirm: true
        });

        const csrfToken = await getCsrfToken();
        const res = await request(app)
            .post('/api/auth/register')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', authIp('register-partial-wrong-password'))
            .send({
                email,
                password: 'DifferentPassword123!',
                gdpr_consent: true,
                terms_consent: true
            });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('REGISTRATION_RECOVERY_REQUIRED');
        expect(res.headers['set-cookie']).toBeUndefined();
    });

    test('forgot password keeps invalid emails non-enumerable', async () => {
        const csrfToken = await getCsrfToken();

        const res = await request(app)
            .post('/api/auth/forgot-password')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', authIp('forgot-invalid-email'))
            .send({ email: 'not-an-email' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBeDefined();
        expect(res.body.error).toBeUndefined();
    });

    test('failed login budget does not block a new registration from the same network', async () => {
        const csrfToken = await getCsrfToken();
        const forwardedIp = authIp('separate-login-and-register-limiters');

        for (let attempt = 0; attempt < 10; attempt += 1) {
            await request(app)
                .post('/api/auth/login')
                .set('x-csrf-token', csrfToken)
                .set('X-Forwarded-For', forwardedIp)
                .send({
                    email: `missing-login-${attempt}@example.com`,
                    password: 'x'
                });
        }

        const limitedLogin = await request(app)
            .post('/api/auth/login')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', forwardedIp)
            .send({
                email: 'missing-login-final@example.com',
                password: 'x'
            });
        expect(limitedLogin.status).toBe(429);
        expect(limitedLogin.body.code).toBe('LOGIN_RATE_LIMITED');

        const registration = await request(app)
            .post('/api/auth/register')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', forwardedIp)
            .send({
                email: `separate-limit-${Date.now()}@example.com`,
                password: 'TestPassword123!',
                gdpr_consent: true,
                terms_consent: true
            });

        expect(registration.status).toBe(200);
        expect(registration.body.success).toBe(true);
    });

    test('reset password with CSRF but without bearer token returns auth error', async () => {
        const csrfToken = await getCsrfToken();

        const res = await request(app)
            .post('/api/auth/reset-password')
            .set('x-csrf-token', csrfToken)
            .set('X-Forwarded-For', authIp('reset-missing-token'))
            .send({ password: 'NewPassword123!' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBeDefined();
    });
});
