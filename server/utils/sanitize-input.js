/**
 * Request input sanitization for /api routes. Replaces the unmaintained
 * `xss-clean` package (archived since 2021) with the actively maintained
 * `xss` package that is already a production dependency.
 *
 * Semantics match what the app relied on from xss-clean: string values in
 * body/query/params get HTML tags escaped to entities (not stripped, so no
 * user text is silently lost), meaning stored input can never carry
 * executable markup back into a page. No HTML is allowed in API input,
 * non-string primitives pass through untouched.
 */
import { FilterXSS } from 'xss';

const inputFilter = new FilterXSS({
    whiteList: {}, // no HTML tags are allowed in API input
    stripIgnoreTag: false // escape disallowed tags to entities instead of dropping the text
});

export function sanitizeValue(value) {
    if (typeof value === 'string') {
        return inputFilter.process(value);
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
        const sanitized = {};
        for (const [key, entry] of Object.entries(value)) {
            sanitized[sanitizeValue(key)] = sanitizeValue(entry);
        }
        return sanitized;
    }
    return value;
}

export function sanitizeRequestInput(req, res, next) {
    if (req.body) req.body = sanitizeValue(req.body);
    if (req.query) req.query = sanitizeValue(req.query);
    if (req.params) req.params = sanitizeValue(req.params);
    next();
}
