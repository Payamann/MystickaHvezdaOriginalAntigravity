import { jest } from '@jest/globals';
import { supabase } from '../db-supabase.js';
import { requireAdmin } from '../middleware.js';

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
}

describe('Admin authorization', () => {
    const adminId = 'admin-authorization-admin';
    const userId = 'admin-authorization-user';
    const adminEmail = 'configured-admin@example.com';
    const originalAdminEmails = process.env.ADMIN_EMAILS;

    beforeAll(async () => {
        process.env.ADMIN_EMAILS = adminEmail;
        await supabase.from('users').insert([
            { id: adminId, email: 'db-admin@example.com', role: 'admin' },
            { id: userId, email: adminEmail, role: 'user' },
        ]);
    });

    afterAll(async () => {
        await supabase.from('users').delete().in('id', [adminId, userId]);
        if (originalAdminEmails === undefined) {
            delete process.env.ADMIN_EMAILS;
        } else {
            process.env.ADMIN_EMAILS = originalAdminEmails;
        }
    });

    test('allows only the current database admin role', async () => {
        const req = { user: { id: adminId, email: 'db-admin@example.com' } };
        const res = createResponse();
        const next = jest.fn();

        await requireAdmin(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user.role).toBe('admin');
        expect(res.statusCode).toBe(200);
    });

    test('does not grant admin access to a normal account listed in ADMIN_EMAILS', async () => {
        const req = { user: { id: userId, email: adminEmail, role: 'user' } };
        const res = createResponse();
        const next = jest.fn();

        await requireAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/Přístup odepřen/);
    });

    test('rechecks and rejects a stale admin claim after the database role is removed', async () => {
        const req = { user: { id: userId, email: adminEmail, role: 'admin' } };
        const res = createResponse();
        const next = jest.fn();

        await requireAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
    });
});
