import { jest } from '@jest/globals';
import { sanitizeValue, sanitizeRequestInput } from '../utils/sanitize-input.js';

describe('sanitizeValue', () => {
    test('escapes HTML tags in strings', () => {
        expect(sanitizeValue('<b>ahoj</b>')).toBe('&lt;b&gt;ahoj&lt;/b&gt;');
    });

    test('escapes script tags so they can never execute, without losing text', () => {
        const result = sanitizeValue('před<script>alert(1)</script>po');
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
        expect(result).toContain('před');
        expect(result).toContain('po');
    });

    test('neutralizes img onerror payloads', () => {
        const result = sanitizeValue('<img src=x onerror=alert(1)>');
        expect(result).not.toMatch(/<img/);
    });

    test('leaves plain Czech text with diacritics untouched', () => {
        expect(sanitizeValue('Dnešní horoskop pro Štíra — láska & kariéra')).toBe(
            'Dnešní horoskop pro Štíra — láska & kariéra'
        );
    });

    test('passes through non-string primitives', () => {
        expect(sanitizeValue(42)).toBe(42);
        expect(sanitizeValue(true)).toBe(true);
        expect(sanitizeValue(null)).toBeNull();
        expect(sanitizeValue(undefined)).toBeUndefined();
    });

    test('sanitizes nested objects and arrays recursively', () => {
        const input = {
            name: '<script>x</script>Anna',
            tags: ['<i>tag</i>', 'čistý'],
            nested: { note: '<svg/onload=alert(1)>' }
        };
        const result = sanitizeValue(input);
        expect(result.name).toBe('&lt;script&gt;x&lt;/script&gt;Anna');
        expect(result.tags[0]).toBe('&lt;i&gt;tag&lt;/i&gt;');
        expect(result.tags[1]).toBe('čistý');
        expect(result.nested.note).not.toMatch(/<svg/);
    });

    test('sanitizes object keys as well as values', () => {
        const result = sanitizeValue({ '<b>key</b>': 'value' });
        expect(Object.keys(result)[0]).toBe('&lt;b&gt;key&lt;/b&gt;');
    });
});

describe('sanitizeRequestInput middleware', () => {
    test('sanitizes body, query and params, then calls next', () => {
        const req = {
            body: { comment: '<script>steal()</script>text' },
            query: { q: '<img src=x onerror=alert(1)>' },
            params: { slug: 'beran' }
        };
        const next = jest.fn();

        sanitizeRequestInput(req, {}, next);

        expect(req.body.comment).not.toContain('<script>');
        expect(req.body.comment).toContain('&lt;script&gt;');
        expect(req.query.q).not.toMatch(/<img/);
        expect(req.params.slug).toBe('beran');
        expect(next).toHaveBeenCalledTimes(1);
    });

    test('tolerates requests without body/query/params', () => {
        const req = {};
        const next = jest.fn();
        sanitizeRequestInput(req, {}, next);
        expect(next).toHaveBeenCalledTimes(1);
    });
});
