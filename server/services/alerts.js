const REDACTED = '[redacted]';
const REDACTED_EMAIL = '[redacted-email]';
const REDACTED_ID = '[redacted-id]';
const REDACTED_TOKEN = '[redacted-token]';

const DEFAULT_DEDUPE_MS = 5 * 60 * 1000;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 5;
const DEFAULT_TIMEOUT_MS = 2500;
const DEFAULT_PREMIUM_5XX_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_PREMIUM_5XX_THRESHOLD = 3;
const MAX_METADATA_KEYS = 24;

const SENSITIVE_KEY_RE = /email|mail|password|heslo|token|secret|authorization|cookie|session|signature|customer|client_reference|payment_intent|user_id|userid|ip|(^|[_-])name($|[_-])|fullname|firstname|lastname|jmeno/i;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const SENSITIVE_QUERY_RE = /([?&][^=&#]*(?:email|mail|name|password|heslo|token|secret|authorization|cookie|session)[^=&#]*=)[^&#]*/gi;
const STRIPE_ID_RE = /\b(?:cs|cus|pi|sub|evt|ch|in|pm|seti)_(?:test|live)?[A-Za-z0-9_]*\b/g;
const LONG_TOKEN_RE = /\b[A-Za-z0-9_-]{32,}\b/g;
const PREMIUM_OPERATIONAL_PATH_RE = /^\/api\/(?:payment|numerology|past-life|medicine-wheel|mentor|rocni-horoskop|osobni-mapa)(?:\/|$)/;

function cleanString(value, maxLength = 240) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, maxLength);
}

function parsePositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sanitizeStringValue(key, value, maxLength = 1000) {
    const trimmed = cleanString(value, maxLength);
    if (trimmed === null) return null;
    if (SENSITIVE_KEY_RE.test(key)) return REDACTED;

    return trimmed
        .replace(SENSITIVE_QUERY_RE, `$1${REDACTED}`)
        .replace(EMAIL_RE, REDACTED_EMAIL)
        .replace(STRIPE_ID_RE, REDACTED_ID)
        .replace(LONG_TOKEN_RE, REDACTED_TOKEN)
        .slice(0, maxLength);
}

function sanitizeAlertValue(key, value, depth) {
    if (SENSITIVE_KEY_RE.test(key)) return REDACTED;

    if (typeof value === 'string') {
        return sanitizeStringValue(key, value);
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'boolean' || value === null) {
        return value;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Array.isArray(value)) {
        if (depth >= 2) return '[omitted]';
        return value.slice(0, 8).map((item) => sanitizeAlertValue(key, item, depth + 1));
    }

    if (value && typeof value === 'object') {
        if (depth >= 2) return '[omitted]';
        return sanitizeAlertMetadata(value, depth + 1);
    }

    return undefined;
}

export function sanitizeAlertMetadata(input, depth = 0) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

    const output = {};
    for (const [rawKey, rawValue] of Object.entries(input).slice(0, MAX_METADATA_KEYS)) {
        const key = cleanString(rawKey, 64);
        if (!key) continue;

        const value = sanitizeAlertValue(key, rawValue, depth);
        if (value !== undefined) output[key] = value;
    }

    return output;
}

function getWebhookUrl(env) {
    return cleanString(env.OPERATIONAL_ALERT_WEBHOOK_URL || env.ALERT_WEBHOOK_URL || '', 2048);
}

function getAlertConfig(env) {
    const webhookUrl = getWebhookUrl(env);
    const disabled = env.OPERATIONAL_ALERTS_DISABLED === 'true' ||
        env.ALERTS_DISABLED === 'true' ||
        (env.NODE_ENV === 'test' && env.OPERATIONAL_ALERTS_ENABLE_IN_TEST !== 'true');

    return {
        enabled: Boolean(webhookUrl) && !disabled,
        webhookUrl,
        bearerToken: cleanString(env.OPERATIONAL_ALERT_WEBHOOK_TOKEN || env.ALERT_WEBHOOK_TOKEN || '', 2048),
        environment: cleanString(env.RAILWAY_ENVIRONMENT_NAME || env.NODE_ENV || 'unknown', 80) || 'unknown',
        service: cleanString(env.OPERATIONAL_ALERT_SERVICE || 'mysticka-hvezda', 80) || 'mysticka-hvezda',
        dedupeMs: parsePositiveInt(env.OPERATIONAL_ALERT_DEDUPE_MS, DEFAULT_DEDUPE_MS),
        rateLimitWindowMs: parsePositiveInt(env.OPERATIONAL_ALERT_RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
        rateLimitMax: parsePositiveInt(env.OPERATIONAL_ALERT_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
        timeoutMs: parsePositiveInt(env.OPERATIONAL_ALERT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    };
}

function pruneMapByAge(map, now, maxAgeMs) {
    for (const [key, timestamp] of map.entries()) {
        if (now - timestamp > maxAgeMs) map.delete(key);
    }
}

function pruneTimestamps(timestamps, now, windowMs) {
    while (timestamps.length > 0 && now - timestamps[0] > windowMs) {
        timestamps.shift();
    }
}

function normalizeDedupePart(value) {
    if (value === null || value === undefined) return '';
    return sanitizeStringValue('', String(value), 160)
        ?.toLowerCase()
        .replace(/\s+/g, ' ')
        .trim() || '';
}

function buildDedupeKey(type, payload, metadata) {
    const explicit = cleanString(payload.dedupeKey, 300);
    if (explicit) return explicit;

    const parts = [
        type,
        metadata.stage,
        metadata.eventType,
        metadata.method,
        metadata.path,
        metadata.statusCode,
        metadata.source,
        metadata.feature,
        metadata.planId,
        metadata.planType,
        metadata.product_id,
        metadata.product_type,
    ].map(normalizeDedupePart).filter(Boolean);

    return parts.length > 0 ? parts.join(':') : type;
}

function buildAlertText(alert) {
    const summary = alert.summary ? ` - ${alert.summary}` : '';
    return `[${alert.severity}] ${alert.type} (${alert.environment})${summary}`;
}

async function postAlert({ config, fetchImpl, logger, alert }) {
    if (typeof fetchImpl !== 'function') {
        logger.warn?.('[ALERT] Fetch is unavailable; operational alert skipped.');
        return { sent: false, reason: 'fetch_unavailable' };
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller
        ? setTimeout(() => controller.abort(), config.timeoutMs)
        : null;

    const headers = {
        'content-type': 'application/json',
    };
    if (config.bearerToken) headers.authorization = `Bearer ${config.bearerToken}`;

    try {
        const response = await fetchImpl(config.webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                text: buildAlertText(alert),
                alert,
            }),
            ...(controller ? { signal: controller.signal } : {}),
        });

        if (!response?.ok) {
            logger.warn?.('[ALERT] Operational alert webhook rejected payload:', response?.status || 'unknown_status');
            return { sent: false, reason: 'webhook_rejected', status: response?.status || null };
        }

        return { sent: true, reason: 'sent' };
    } catch (error) {
        logger.warn?.('[ALERT] Operational alert delivery failed:', error.message);
        return { sent: false, reason: 'delivery_failed' };
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

export function createOperationalAlertService({
    env = process.env,
    fetchImpl = globalThis.fetch,
    now = () => Date.now(),
    logger = console,
} = {}) {
    const lastSentByDedupeKey = new Map();
    const sentTimestamps = [];

    return {
        async send(type, payload = {}) {
            const cleanType = cleanString(type, 80);
            if (!cleanType) return { sent: false, reason: 'invalid_type' };

            const config = getAlertConfig(env);
            if (!config.enabled) return { sent: false, reason: 'disabled' };

            const timestampMs = now();
            const metadata = sanitizeAlertMetadata(payload.metadata || {});
            const dedupeKey = buildDedupeKey(cleanType, payload, metadata);

            pruneMapByAge(lastSentByDedupeKey, timestampMs, config.dedupeMs);
            const lastSentAt = lastSentByDedupeKey.get(dedupeKey);
            if (lastSentAt !== undefined && timestampMs - lastSentAt < config.dedupeMs) {
                return { sent: false, reason: 'deduped' };
            }

            pruneTimestamps(sentTimestamps, timestampMs, config.rateLimitWindowMs);
            if (sentTimestamps.length >= config.rateLimitMax) {
                return { sent: false, reason: 'rate_limited' };
            }

            const alert = {
                type: cleanType,
                severity: cleanString(payload.severity, 20) || 'warning',
                summary: cleanString(payload.summary, 240),
                service: config.service,
                environment: config.environment,
                timestamp: new Date(timestampMs).toISOString(),
                metadata,
            };

            const result = await postAlert({ config, fetchImpl, logger, alert });
            if (result.sent === true) {
                lastSentByDedupeKey.set(dedupeKey, timestampMs);
                sentTimestamps.push(timestampMs);
            }
            return result;
        },

        reset() {
            lastSentByDedupeKey.clear();
            sentTimestamps.length = 0;
        },
    };
}

export function normalizeHttpPath(path) {
    const rawPath = cleanString(path, 500) || '/';
    let pathname = rawPath;

    try {
        pathname = new URL(rawPath, 'https://mysticka.local').pathname;
    } catch {
        pathname = rawPath.split('?')[0] || '/';
    }

    return pathname
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
        .replace(/\b\d{6,}\b/g, ':id')
        .slice(0, 240);
}

export function isPremiumOperationalPath(path) {
    return PREMIUM_OPERATIONAL_PATH_RE.test(normalizeHttpPath(path));
}

export function createServer5xxAlertMonitor({
    alertService = null,
    env = process.env,
    now = () => Date.now(),
    premiumPathMatcher = isPremiumOperationalPath,
} = {}) {
    const service = alertService || operationalAlertService;
    const premiumFailures = [];

    function prunePremiumFailures(timestampMs, windowMs) {
        while (premiumFailures.length > 0 && timestampMs - premiumFailures[0] > windowMs) {
            premiumFailures.shift();
        }
    }

    return {
        async recordResponse({ method, path, statusCode, userId = null, userAgent = null } = {}) {
            const numericStatus = Number(statusCode);
            if (!Number.isFinite(numericStatus) || numericStatus < 500) {
                return { recorded: false, reason: 'not_5xx' };
            }

            const timestampMs = now();
            const normalizedPath = normalizeHttpPath(path);
            const cleanMethod = cleanString(method, 12) || 'UNKNOWN';
            const metadata = {
                method: cleanMethod,
                path: normalizedPath,
                statusCode: numericStatus,
                userId,
                userAgent,
            };

            const results = [];
            results.push(await service.send('server_5xx', {
                severity: 'critical',
                summary: `${cleanMethod} ${normalizedPath} returned ${numericStatus}`,
                dedupeKey: `server_5xx:${cleanMethod}:${normalizedPath}:${numericStatus}`,
                metadata,
            }));

            let premiumFailureCount = 0;
            let spikeAlertSent = false;

            if (premiumPathMatcher(normalizedPath)) {
                const spikeWindowMs = parsePositiveInt(env.OPERATIONAL_ALERT_PREMIUM_5XX_WINDOW_MS, DEFAULT_PREMIUM_5XX_WINDOW_MS);
                const spikeThreshold = parsePositiveInt(env.OPERATIONAL_ALERT_PREMIUM_5XX_THRESHOLD, DEFAULT_PREMIUM_5XX_THRESHOLD);

                prunePremiumFailures(timestampMs, spikeWindowMs);
                premiumFailures.push(timestampMs);
                premiumFailureCount = premiumFailures.length;

                if (premiumFailureCount >= spikeThreshold) {
                    const spikeResult = await service.send('premium_endpoint_5xx_spike', {
                        severity: 'critical',
                        summary: `${premiumFailureCount} premium/revenue endpoint 5xx responses in ${Math.round(spikeWindowMs / 1000)}s`,
                        dedupeKey: `premium_endpoint_5xx_spike:${normalizedPath}`,
                        metadata: {
                            ...metadata,
                            count: premiumFailureCount,
                            windowMs: spikeWindowMs,
                            threshold: spikeThreshold,
                        },
                    });
                    results.push(spikeResult);
                    spikeAlertSent = spikeResult.sent === true;
                }
            }

            return {
                recorded: true,
                premiumFailureCount,
                spikeAlertSent,
                results,
            };
        },

        reset() {
            premiumFailures.length = 0;
        },
    };
}

export const operationalAlertService = createOperationalAlertService();

export function sendOperationalAlert(type, payload = {}) {
    return operationalAlertService.send(type, payload);
}
