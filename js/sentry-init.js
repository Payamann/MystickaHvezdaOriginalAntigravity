const SENTRY_WAIT_ATTEMPTS = 20;
const SENTRY_WAIT_INTERVAL_MS = 100;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForSentrySdk() {
    for (let attempt = 0; attempt < SENTRY_WAIT_ATTEMPTS; attempt += 1) {
        if (window.Sentry?.init) {
            return window.Sentry;
        }

        await wait(SENTRY_WAIT_INTERVAL_MS);
    }

    return null;
}

function getSentryEnvironment() {
    const hostname = window.location.hostname;

    if (hostname === 'www.mystickahvezda.cz' || hostname === 'mystickahvezda.cz') {
        return 'production';
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    }

    return 'preview';
}

async function initializeSentry() {
    if (typeof window.initConfig === 'function') {
        await window.initConfig();
    }

    const dsn = window.API_CONFIG?.SENTRY_DSN || window.SENTRY_DSN || null;
    if (!dsn) {
        return false;
    }

    const sentry = await waitForSentrySdk();
    if (!sentry) {
        return false;
    }

    sentry.init({
        dsn,
        environment: getSentryEnvironment(),
        tracesSampleRate: 0.1
    });

    return true;
}

window.sentryLoaded = initializeSentry().catch(error => {
    console.warn('Could not initialize Sentry:', error.message);
    return false;
});
