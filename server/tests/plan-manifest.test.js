import request from 'supertest';
import app from '../index.js';
import {
    getPublicPlanManifest,
    getRequiredPlanForFeature,
    getPlanById,
    LIVE_STRIPE_PRICE_IDS,
    planTypeMeetsRequirement,
    SUBSCRIPTION_PLANS,
    userHasFeatureAccess
} from '../config/constants.js';

describe('Public plan manifest', () => {
    test('is derived from server subscription plans', () => {
        const manifest = getPublicPlanManifest();
        const manifestIds = manifest.plans.map(plan => plan.id);

        expect(manifestIds).toEqual([
            'poutnik',
            'pruvodce'
        ]);

        for (const plan of manifest.plans) {
            expect(plan.priceMinor).toBe(SUBSCRIPTION_PLANS[plan.id].price);
            expect(plan.planType).toBe(SUBSCRIPTION_PLANS[plan.id].type);
            expect(plan.checkoutEnabled).toBe(SUBSCRIPTION_PLANS[plan.id].price > 0);
        }

        expect(manifest.pricingPage).toEqual({
            monthly: { pruvodce: 'pruvodce' }
        });
        expect(new Set(Object.values(manifest.featurePlanMap))).toEqual(new Set(['pruvodce']));
        expect(manifest.featurePlanMap.astrocartography).toBe('pruvodce');
        expect(manifest.featurePlanMap.angel_card_deep).toBe('pruvodce');
        expect(manifest.featurePlanMap.andelske_karty_hluboky_vhled).toBe('pruvodce');
        expect(manifest.featurePlanMap.daily_guidance).toBe('pruvodce');
        expect(manifest.featurePlanMap.runes_deep_reading).toBe('pruvodce');
        expect(manifest.featurePlanMap.runy_hluboky_vyklad).toBe('pruvodce');
        expect(manifest.featurePlanMap.past_life).toBe('pruvodce');
        expect(manifest.featurePlanMap.minuly_zivot).toBe('pruvodce');
        expect(manifest.featurePlanMap.medicine_wheel).toBe('pruvodce');
        expect(manifest.featurePlanMap.shamanske_kolo_plne_cteni).toBe('pruvodce');
        expect(manifest.featurePlanMap.mentor).toBe('pruvodce');
        expect(manifest.featurePlanMap.hvezdny_mentor).toBe('pruvodce');
        expect(manifest.featurePlanMap.kristalova_koule).toBe('pruvodce');
        expect(manifest.featurePlanMap.tarot).toBe('pruvodce');
        expect(manifest.featurePlanMap.tarot_celtic_cross).toBe('pruvodce');
        expect(manifest.plans.find(plan => plan.id === 'pruvodce').description).not.toMatch(/neomezen/i);
    });

    test('keeps historical plans available to checkout and webhook lookups', () => {
        expect(Object.keys(SUBSCRIPTION_PLANS)).toEqual([
            'poutnik',
            'pruvodce',
            'pruvodce-rocne',
            'osviceni',
            'osviceni-rocne',
            'vip-majestrat'
        ]);
        expect(LIVE_STRIPE_PRICE_IDS).toEqual({
            pruvodce: 'price_1TRBKpAo8bdbnsKapn6BM0Wj',
            'pruvodce-rocne': 'price_1TRBKqAo8bdbnsKacSK9KoSa',
            osviceni: 'price_1TCjhkAo8bdbnsKaBes5yjmW',
            'osviceni-rocne': 'price_1TRBKrAo8bdbnsKaja6EEMKa',
            'vip-majestrat': 'price_1TCjijAo8bdbnsKaAk3Km66K'
        });
        expect(Object.fromEntries(Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => [id, {
            price: plan.price,
            interval: plan.interval,
            trialDays: plan.trialDays,
            type: plan.type
        }]))).toEqual({
            poutnik: { price: 0, interval: null, trialDays: 0, type: 'free' },
            pruvodce: { price: 19900, interval: 'month', trialDays: 7, type: 'premium_monthly' },
            'pruvodce-rocne': { price: 199000, interval: 'year', trialDays: 7, type: 'premium_monthly' },
            osviceni: { price: 49900, interval: 'month', trialDays: 7, type: 'exclusive_monthly' },
            'osviceni-rocne': { price: 499000, interval: 'year', trialDays: 7, type: 'exclusive_monthly' },
            'vip-majestrat': { price: 99900, interval: 'month', trialDays: 0, type: 'vip_majestrat' }
        });
        for (const planId of Object.keys(SUBSCRIPTION_PLANS)) {
            expect(getPlanById(planId)).toBe(SUBSCRIPTION_PLANS[planId]);
        }
    });

    test('all paid historical plan types satisfy the single paid requirement', () => {
        expect(getRequiredPlanForFeature('astrocartography')).toBe('pruvodce');
        expect(getRequiredPlanForFeature('tarot_celtic_cross')).toBe('pruvodce');
        for (const planType of ['premium_monthly', 'exclusive_monthly', 'vip_majestrat']) {
            expect(planTypeMeetsRequirement(planType, 'pruvodce')).toBe(true);
            expect(planTypeMeetsRequirement(planType, 'osviceni')).toBe(true);
            expect(planTypeMeetsRequirement(planType, 'vip-majestrat')).toBe(true);
        }
        expect(planTypeMeetsRequirement('free', 'pruvodce')).toBe(false);
        expect(planTypeMeetsRequirement('unknown_plan', 'pruvodce')).toBe(false);
        expect(planTypeMeetsRequirement('premium_monthly', 'unknown-plan')).toBe(false);

        for (const planType of ['premium_monthly', 'exclusive_monthly', 'vip_majestrat']) {
            expect(userHasFeatureAccess({
                isPremium: true,
                subscription_status: planType
            }, 'astrocartography')).toBe(true);
        }
        expect(userHasFeatureAccess({
            isPremium: false,
            subscription_status: 'free'
        }, 'astrocartography')).toBe(false);
        expect(userHasFeatureAccess({
            isPremium: true,
            subscription_status: 'unknown_plan'
        }, 'astrocartography')).toBe(false);
    });

    test('GET /api/plans exposes only public plan fields', async () => {
        const res = await request(app)
            .get('/api/plans')
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.currency).toBe('CZK');
        expect(res.body.featurePlanMap).toEqual(expect.objectContaining({
            astrocartography: 'pruvodce',
            mentor: 'pruvodce'
        }));
        expect(res.body.plans).toEqual([
            expect.objectContaining({
                id: 'poutnik',
                priceMinor: 0,
                checkoutEnabled: false
            }),
            expect.objectContaining({
                id: 'pruvodce',
                priceMinor: 19900,
                priceCzk: 199,
                priceLabel: '199 Kč',
                billingInterval: 'monthly',
                checkoutEnabled: true
            })
        ]);
        expect(JSON.stringify(res.body)).not.toMatch(/STRIPE|SECRET|SERVICE_ROLE/i);
    });
});
