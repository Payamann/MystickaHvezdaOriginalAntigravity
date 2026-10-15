import { getLunarState, getNextPrimaryPhase, getPrimaryPhaseEvents } from '../../js/utils/lunar-state.js';

test('all stored primary phase instants agree with their source phase', () => {
    const expected = { 'New Moon': 'new-moon', 'First Quarter': 'first-quarter', 'Full Moon': 'full-moon', 'Last Quarter': 'last-quarter' };
    for (const [name, slug] of Object.entries(expected)) {
        const events = getPrimaryPhaseEvents(name);
        expect(events.length).toBeGreaterThan(0);
        for (const event of events) {
            expect(getLunarState(event.at)).toMatchObject({ slug, source: 'usno-primary-phases', approximate: true });
        }
    }
});

test('the countdown uses sourced 2026 dates rather than a mean-cycle estimate', () => {
    expect(getNextPrimaryPhase('Full Moon', '2026-04-01T00:00:00Z').at).toBe('2026-04-02T02:12:00Z');
    expect(getNextPrimaryPhase('Full Moon', '2026-12-23T00:00:00Z').at).toBe('2026-12-24T01:28:00Z');
    expect(getNextPrimaryPhase('New Moon', '2026-03-18T00:00:00Z').at).toBe('2026-03-19T01:23:00Z');
});

test('missing table years stay approximate and do not invent a distant next event', () => {
    expect(getLunarState('2025-06-01T00:00:00Z').source).toBe('mean-cycle');
    expect(getNextPrimaryPhase('New Moon', '2025-06-01T00:00:00Z')).toBeNull();
    expect(getNextPrimaryPhase('Full Moon', '2027-01-01T00:00:00Z')).toBeNull();
    expect(() => getLunarState('not-a-date')).toThrow('Invalid date');
});
