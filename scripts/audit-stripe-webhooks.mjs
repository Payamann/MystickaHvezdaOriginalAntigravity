#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { evaluateStripeWebhookEndpoints } from '../server/config/stripe-webhooks.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(rootDir, 'server', '.env') });

function usage() {
    return [
        'Usage: node scripts/audit-stripe-webhooks.mjs [--json] [--allow-test] [--base-url https://www.mystickahvezda.cz]',
        '',
        'Read-only audit of Stripe webhook endpoint status and required event coverage.',
        'Live Stripe keys are required by default; --allow-test is only for local validation.',
    ].join('\n');
}

function parseArgs(argv) {
    const args = {
        json: false,
        allowTest: false,
        baseUrl: process.env.APP_URL || 'https://www.mystickahvezda.cz',
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--help' || arg === '-h') {
            console.log(usage());
            process.exit(0);
        } else if (arg === '--json') {
            args.json = true;
        } else if (arg === '--allow-test') {
            args.allowTest = true;
        } else if (arg === '--base-url') {
            args.baseUrl = argv[++index];
        } else if (arg.startsWith('--base-url=')) {
            args.baseUrl = arg.slice('--base-url='.length);
        } else {
            throw new Error(`Unknown argument: ${arg}\n${usage()}`);
        }
    }

    return args;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const stripeKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY.');
    const liveMode = stripeKey.startsWith('sk_live_');
    if (!liveMode && !args.allowTest) {
        throw new Error('Refusing to audit a non-live Stripe account. Pass --allow-test only for local validation.');
    }

    const stripe = new Stripe(stripeKey);
    const response = await stripe.webhookEndpoints.list({ limit: 100 });
    const audit = evaluateStripeWebhookEndpoints(response.data, { baseUrl: args.baseUrl });
    const result = {
        stripeMode: liveMode ? 'live' : 'test',
        baseUrl: args.baseUrl,
        ...audit,
    };

    if (args.json) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log(`Stripe webhook audit (${result.stripeMode})`);
        console.log(`Production webhook healthy: ${result.healthy ? 'yes' : 'NO'}`);
        console.log(`Matching endpoints: ${result.matching.length}`);
        for (const endpoint of result.matching) {
            console.log(`- ${endpoint.id || '(unknown)'} enabled=${endpoint.enabled ? 'yes' : 'no'} all_events=${endpoint.receivesAllEvents ? 'yes' : 'no'}`);
            if (endpoint.missingEvents.length > 0) {
                console.log(`  missing: ${endpoint.missingEvents.join(', ')}`);
            }
        }
        if (result.matching.length === 0) {
            console.log(`No enabled Stripe endpoint matches ${result.baseUrl}${result.expectedPath}.`);
        }
    }

    if (!result.healthy) process.exitCode = 2;
}

main().catch((error) => {
    console.error(`audit-stripe-webhooks failed: ${error?.message || error}`);
    process.exitCode = 1;
});
