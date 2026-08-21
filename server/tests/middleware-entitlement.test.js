import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { supabase } from '../db-supabase.js';
import { authenticateToken, getAiRequestLimit, requirePremium } from '../middleware.js';

const FUTURE_PERIOD_END = '2099-12-31T23:59:59.000Z';

function createToken(userId, isPremium) {
    return jwt.sign({
        id: userId,
        email: `${userId}@example.com`,
        isPremium,
        subscription_status: isPremium ? 'premium_monthly' : 'free',
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function createApp() {
    const app = express();
    app.get('/premium', authenticateToken, requirePremium, (req, res) => {
        res.json({
            success: true,
            isPremium: req.user.isPremium,
            planType: req.user.subscription_status,
            billingStatus: req.user.billing_status,
        });
    });
    app.get('/premium-limit', authenticateToken, requirePremium, (req, res) => {
        res.json({ limit: getAiRequestLimit(req) });
    });
    return app;
}

describe('Current billing entitlement middleware', () => {
    test('revokes a stale premium JWT immediately after billing becomes past_due', async () => {
        const userId = `entitlement-revoke-${Date.now()}`;
        await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_type: 'premium_monthly',
            status: 'past_due',
            current_period_end: FUTURE_PERIOD_END,
        });

        const response = await request(createApp())
            .get('/premium')
            .set('Authorization', `Bearer ${createToken(userId, true)}`)
            .expect(403);

        expect(response.body.requireUpgrade).toBe(true);
    });

    test('restores access from DB without waiting for a stale free JWT to expire', async () => {
        const userId = `entitlement-recover-${Date.now()}`;
        await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_type: 'premium_monthly',
            status: 'active',
            current_period_end: FUTURE_PERIOD_END,
        });

        const response = await request(createApp())
            .get('/premium')
            .set('Authorization', `Bearer ${createToken(userId, false)}`)
            .expect(200);

        expect(response.body).toEqual({
            success: true,
            isPremium: true,
            planType: 'premium_monthly',
            billingStatus: 'active',
        });

        const limitResponse = await request(createApp())
            .get('/premium-limit')
            .set('Authorization', `Bearer ${createToken(userId, false)}`)
            .expect(200);

        expect(limitResponse.body).toEqual({ limit: 100 });
    });

    test('preserves an active non-Stripe VIP grant without a period end', async () => {
        const userId = `entitlement-vip-${Date.now()}`;
        await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_type: 'vip',
            status: 'active',
            current_period_end: null,
        });

        const response = await request(createApp())
            .get('/premium')
            .set('Authorization', `Bearer ${createToken(userId, false)}`)
            .expect(200);

        expect(response.body).toEqual(expect.objectContaining({
            success: true,
            isPremium: true,
            planType: 'vip_majestrat',
        }));
    });
});
