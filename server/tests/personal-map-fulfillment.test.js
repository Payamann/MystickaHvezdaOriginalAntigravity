import { jest } from '@jest/globals';
import { createPersonalMapFulfillment } from '../services/personal-map-fulfillment.js';

function fixture() {
    let time = Date.parse('2026-10-15T10:00:00Z');
    let row = { id: 'map-1', product_type: 'personal_map', customer_email: 'test@example.com', customer_name: 'Test',
        status: 'checkout_created', updated_at: new Date(time).toISOString(),
        payload: { personalMapFulfillment: { version: 1, state: 'pending' }, birthDate: '1990-01-01', sign: 'kozoroh', focus: 'Moje otázka' } };
    let rejectWrite = () => false;
    const db = { from() {
        let patch; const filters = [];
        const query = {
            update(value) { patch = value; return query; },
            eq(key, value) { filters.push([key, value]); return query; },
            is(key, value) { filters.push([key, value]); return query; },
            select() { return query; },
            async maybeSingle() {
                if (rejectWrite(patch)) return { error: { message: 'DB unavailable' }, data: null };
                const matches = filters.every(([key, value]) => key === 'payload->personalMapFulfillment->>revision'
                    ? (row.payload.personalMapFulfillment?.revision ?? null) === value : row[key] === value);
                if (!matches) return { data: null };
                row = { ...row, ...structuredClone(patch) };
                return { data: { id: row.id } };
            }
        };
        return query;
    } };
    const dependencies = {
        db, getOrder: async () => structuredClone(row), now: () => time,
        generate: jest.fn(async () => ({ title: 'Unique generated result' })),
        render: jest.fn(async () => Buffer.from('exact PDF bytes')),
        prepareEmail: jest.fn(async ({ pdfBuffer }) => ({ to: row.customer_email, html: 'frozen template', attachments: [{ content: pdfBuffer.toString('base64') }] })),
        send: jest.fn(async () => ({ id: 'provider-1' })), alert: jest.fn(async () => {})
    };
    return { dependencies, run: () => createPersonalMapFulfillment(dependencies)({ orderId: row.id }),
        row: () => row, advance: ms => { time += ms; }, failWrites: fn => { rejectWrite = fn; } };
}

test('stored receipt makes retry after final status write failure a no-op, including process restart', async () => {
    const f = fixture();
    await f.run();
    expect(f.row().status).toBe('checkout_created'); // caller failed before final mark
    await f.run();
    expect(f.dependencies.generate).toHaveBeenCalledTimes(1);
    expect(f.dependencies.render).toHaveBeenCalledTimes(1);
    expect(f.dependencies.send).toHaveBeenCalledTimes(1);
});

test('provider acceptance followed by receipt write failure retries exact request and key', async () => {
    const f = fixture();
    f.failWrites(patch => Boolean(patch.email_id));
    await expect(f.run()).rejects.toThrow('receipt write failed');
    const firstRequest = structuredClone(f.dependencies.send.mock.calls[0]);
    f.failWrites(() => false);
    await f.run();
    expect(f.dependencies.send.mock.calls[1]).toEqual(firstRequest);
    expect(firstRequest[1].idempotencyKey).toBe('personal-map-map-1');
    expect(f.dependencies.generate).toHaveBeenCalledTimes(1);
    expect(f.dependencies.render).toHaveBeenCalledTimes(1);
    expect(f.row().email_id).toBe('provider-1');
});

test('ambiguous send timeout retries same artifact only within the safe provider window', async () => {
    const f = fixture();
    f.dependencies.send.mockRejectedValueOnce(new Error('timeout'));
    await expect(f.run()).rejects.toThrow('timeout');
    f.advance(23 * 60 * 60 * 1000);
    await expect(f.run()).rejects.toThrow('safe retry window');
    expect(f.dependencies.send).toHaveBeenCalledTimes(1);
    expect(f.dependencies.alert).toHaveBeenCalledTimes(1);
    expect(f.dependencies.generate).toHaveBeenCalledTimes(1);
});

test('render failure retains sections; later attempt does not regenerate', async () => {
    const f = fixture();
    f.dependencies.render.mockRejectedValueOnce(new Error('renderer down'));
    await expect(f.run()).rejects.toThrow('renderer down');
    expect(f.row().payload.personalMapFulfillment.state).toBe('generated');
    await f.run();
    expect(f.dependencies.generate).toHaveBeenCalledTimes(1);
    expect(f.dependencies.send).toHaveBeenCalledTimes(1);
});

test('artifact persistence failure sends nothing and preserves generated sections', async () => {
    const f = fixture();
    f.failWrites(patch => patch.payload?.personalMapFulfillment?.state === 'ready');
    await expect(f.run()).rejects.toThrow('state could not be saved');
    expect(f.dependencies.send).not.toHaveBeenCalled();
    f.failWrites(() => false);
    await f.run();
    expect(f.dependencies.generate).toHaveBeenCalledTimes(1);
});

test('generated output persistence failure cannot silently regenerate on retry', async () => {
    const f = fixture();
    f.failWrites(patch => patch.payload?.personalMapFulfillment?.state === 'generated');
    await expect(f.run()).rejects.toThrow('state could not be saved');
    f.failWrites(() => false);
    f.advance(21 * 60 * 1000);
    await expect(f.run()).rejects.toThrow('generation interrupted');
    expect(f.dependencies.generate).toHaveBeenCalledTimes(1);
    expect(f.dependencies.send).not.toHaveBeenCalled();
    expect(f.dependencies.alert).toHaveBeenCalledTimes(1);
});

test('a definite generation error releases its claim for a normal later retry', async () => {
    const f = fixture();
    f.dependencies.generate.mockRejectedValueOnce(new Error('AI unavailable'));
    await expect(f.run()).rejects.toThrow('AI unavailable');
    expect(f.row().payload.personalMapFulfillment.state).toBe('pending');
    await f.run();
    expect(f.dependencies.send).toHaveBeenCalledTimes(1);
});

test('independent concurrent workers claim generation only once', async () => {
    const f = fixture();
    const results = await Promise.allSettled([f.run(), f.run()]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(f.dependencies.generate).toHaveBeenCalledTimes(1);
    expect(f.dependencies.send).toHaveBeenCalledTimes(1);
});

 test('legacy order without delivery evidence fails safe even without a recorded failed attempt', async () => {
    const f = fixture();
    delete f.row().payload.personalMapFulfillment;
    await expect(f.run()).rejects.toThrow('Legacy personal map');
    expect(f.dependencies.generate).not.toHaveBeenCalled();
    expect(f.dependencies.send).not.toHaveBeenCalled();
    expect(f.dependencies.alert).toHaveBeenCalledTimes(1);
});
