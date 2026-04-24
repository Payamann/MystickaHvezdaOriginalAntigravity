/**
 * Shared server-side constants
 * Single source of truth for plan types and other shared values
 */

// Validní prémiové plan typy — musí odpovídat PLANS objektu v payment.js
// a isPremium kontrole v js/premium-gates.js
// POZOR: premium_yearly, premium_pro, vip jsou odstraněny — v backendu neexistují
export const PREMIUM_PLAN_TYPES = [
    'premium_monthly',
    'exclusive_monthly',
    'vip_majestrat',
];
