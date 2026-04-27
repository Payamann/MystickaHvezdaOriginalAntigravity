import request from 'supertest';
import app from '../index.js';
import {
    getPublicPlanManifest,
    getRequiredPlanForFeature,
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
            'pruvodce',
            'pruvodce-rocne',
            'osviceni',
            'osviceni-rocne',
            'vip-majestrat'
        ]);

        for (const plan of manifest.plans) {
            expect(plan.priceMinor).toBe(SUBSCRIPTION_PLANS[plan.id].price);
            expect(plan.planType).toBe(SUBSCRIPTION_PLANS[plan.id].type);
            expect(plan.checkoutEnabled).toBe(SUBSCRIPTION_PLANS[plan.id].price > 0);
        }

        expect(manifest.pricingPage.monthly.pruvodce).toBe('pruvodce');
        expect(manifest.pricingPage.yearly.pruvodce).toBe('pruvodce-rocne');
        expect(manifest.pricingPage.monthly.osviceni).toBe('osviceni');
        expect(manifest.pricingPage.yearly.osviceni).toBe('osviceni-rocne');
        expect(manifest.featurePlanMap.astrocartography).toBe('osviceni');
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
        expect(manifest.featurePlanMap.tarot_celtic_cross).toBe('vip-majestrat');
    });

    test('centralized feature gates compare plan hierarchy', () => {
        expect(getRequiredPlanForFeature('astrocartography')).toBe('osviceni');
        expect(planTypeMeetsRequirement('premium_monthly', 'pruvodce')).toBe(true);
        expect(planTypeMeetsRequirement('premium_monthly', 'osviceni')).toBe(false);
        expect(planTypeMeetsRequirement('exclusive_monthly', 'pruvodce')).toBe(true);
        expect(planTypeMeetsRequirement('vip_majestrat', 'osviceni')).toBe(true);

        expect(userHasFeatureAccess({
            isPremium: true,
            subscription_status: 'exclusive_monthly'
        }, 'astrocartography')).toBe(true);
        expect(userHasFeatureAccess({
            isPremium: true,
            subscription_status: 'premium_monthly'
        }, 'astrocartography')).toBe(false);
    });

    test('GET /api/plans exposes only public plan fields', async () => {
        const res = await request(app)
            .get('/api/plans')
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.currency).toBe('CZK');
        expect(res.body.featurePlanMap).toEqual(expect.objectContaining({
            astrocartography: 'osviceni',
            mentor: 'pruvodce'
        }));
        expect(res.body.plans).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: 'pruvodce',
                priceMinor: 19900,
                priceCzk: 199,
                priceLabel: '199 Kč',
                billingInterval: 'monthly',
                checkoutEnabled: true
            }),
            expect.objectContaining({
                id: 'pruvodce-rocne',
                priceMinor: 199000,
                priceCzk: 1990,
                priceLabel: '1 990 Kč',
                billingInterval: 'yearly',
                checkoutEnabled: true
            })
        ]));
        expect(JSON.stringify(res.body)).not.toMatch(/STRIPE|SECRET|SERVICE_ROLE/i);
    });
});
