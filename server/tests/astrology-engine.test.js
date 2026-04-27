import {
    angularDistance,
    calculateAspects,
    calculateAstrocartographyInsights,
    calculateMoonPhase,
    calculateNatalChart,
    calculateSynastryChart,
    calculateTransitSnapshot,
    formatAstrocartographyForPrompt,
    formatNatalChartForPrompt,
    formatSynastryForPrompt,
    getZodiacSignByLongitude,
    normalizeDegrees,
    resolveBirthLocation
} from '../services/astrology.js';

describe('Astro engine', () => {
    test('calculates deterministic moon phase for supplied dates', () => {
        expect(calculateMoonPhase('2024-01-11T11:57:00Z')).toContain('Nov');
        expect(calculateMoonPhase('2024-01-25T17:54:00Z')).toContain('Úplněk');
        expect(() => calculateMoonPhase('not-a-date')).toThrow('Invalid date');
    });

    test('normalizes zodiac degrees and resolves signs', () => {
        expect(normalizeDegrees(-10)).toBe(350);
        expect(normalizeDegrees(370)).toBe(10);
        expect(getZodiacSignByLongitude(280.5).name).toBe('Kozoroh');
        expect(getZodiacSignByLongitude(15).name).toBe('Beran');
        expect(angularDistance(350, 10)).toBe(20);
    });

    test('calculates deterministic natal chart placements', () => {
        const chart = calculateNatalChart({
            name: 'Test',
            birthDate: '1990-01-01',
            birthTime: '12:00',
            birthPlace: 'Praha'
        });

        expect(chart.engine.version).toBe('astro-engine-v1');
        expect(chart.summary.sunSign).toBe('Kozoroh');
        expect(chart.planets.sun.longitude).toBeGreaterThanOrEqual(270);
        expect(chart.planets.sun.longitude).toBeLessThan(300);
        expect(chart.planets.moon.sign.name).toBeTruthy();
        expect(chart.aspects.length).toBeGreaterThan(0);
        expect(chart.elementBalance.dominant).toBeTruthy();
        expect(chart.engine.precision).toBe('birth_time_location_timezone');
        expect(chart.location.name).toBe('Praha');
        expect(chart.houses.available).toBe(true);
        expect(chart.houses.ascendant.sign.name).toBeTruthy();
        expect(chart.houses.houses).toHaveLength(12);
        expect(chart.planets.sun.house).toBeGreaterThanOrEqual(1);
        expect(chart.summary.ascendantSign).toBe(chart.houses.ascendant.sign.name);

        const prompt = formatNatalChartForPrompt(chart);
        expect(prompt).toContain('Presnost: birth_time_location_timezone');
        expect(prompt).toContain('Misto narozeni: Praha');
    });

    test('marks missing birth time as date-noon precision', () => {
        const chart = calculateNatalChart({ birthDate: '1990-01-01' });

        expect(chart.engine.precision).toBe('date_noon_utc');
        expect(chart.engine.notes.some((note) => note.includes('Cas narozeni chybi'))).toBe(true);
    });

    test('resolves known birth places and leaves unknown places explicit', () => {
        expect(resolveBirthLocation({ birthPlace: 'Praha 2' })).toEqual(expect.objectContaining({
            name: 'Praha',
            timeZone: 'Europe/Prague'
        }));
        expect(resolveBirthLocation({ birthPlace: 'Kladno' })).toEqual(expect.objectContaining({
            name: 'Kladno'
        }));
        expect(resolveBirthLocation({ birthPlace: 'Atlantida' })).toBe(null);
        expect(resolveBirthLocation({ birthPlace: 'LA' })).toEqual(expect.objectContaining({
            name: 'Los Angeles'
        }));

        const chart = calculateNatalChart({
            birthDate: '1990-01-01',
            birthTime: '12:00',
            birthPlace: 'Neznámé město'
        });

        expect(chart.houses.available).toBe(false);
        expect(chart.location).toBe(null);
        expect(chart.engine.notes.some((note) => note.includes('Misto narozeni nebylo rozpoznano'))).toBe(true);
    });

    test('detects major aspects from supplied planet positions', () => {
        const aspects = calculateAspects({
            sun: {
                id: 'sun',
                name: 'Slunce',
                group: 'luminary',
                longitude: 10
            },
            moon: {
                id: 'moon',
                name: 'Měsíc',
                group: 'luminary',
                longitude: 130
            },
            mars: {
                id: 'mars',
                name: 'Mars',
                group: 'personal',
                longitude: 100
            }
        });

        expect(aspects).toEqual(expect.arrayContaining([
            expect.objectContaining({ planetA: 'sun', planetB: 'moon', aspect: 'trine' }),
            expect.objectContaining({ planetA: 'sun', planetB: 'mars', aspect: 'square' })
        ]));
    });

    test('calculates synastry scores and cross aspects', () => {
        const synastry = calculateSynastryChart(
            { name: 'A', birthDate: '1990-01-01' },
            { name: 'B', birthDate: '1992-07-15' }
        );

        expect(synastry.engine.version).toBe('astro-engine-v1');
        expect(synastry.scores.total).toBeGreaterThanOrEqual(0);
        expect(synastry.scores.total).toBeLessThanOrEqual(100);
        expect(synastry.scores.emotion).toBeGreaterThanOrEqual(0);
        expect(synastry.crossAspects.length).toBeGreaterThan(0);
        expect(synastry.summary.sunSigns).toContain(' + ');
    });

    test('preserves location/time precision in synastry metadata', () => {
        const synastry = calculateSynastryChart(
            { name: 'A', birthDate: '1990-01-01', birthTime: '12:00', birthPlace: 'Praha' },
            { name: 'B', birthDate: '1992-07-15', birthTime: '08:30', birthPlace: 'Brno' }
        );

        expect(synastry.engine.precision).toBe('birth_time_location_timezone');
        expect(synastry.engine.person1Precision).toBe('birth_time_location_timezone');
        expect(synastry.engine.person2Precision).toBe('birth_time_location_timezone');
        expect(synastry.person1.chart.summary.ascendantSign).toBeTruthy();
        expect(synastry.person2.chart.summary.ascendantSign).toBeTruthy();

        const prompt = formatSynastryForPrompt(synastry);
        expect(prompt).toContain('Presnost celkem: birth_time_location_timezone');
        expect(prompt).toContain('misto Praha');
        expect(prompt).toContain('misto Brno');
    });

    test('downgrades synastry precision when exact birth time is missing', () => {
        const synastry = calculateSynastryChart(
            { name: 'A', birthDate: '1990-01-01', birthPlace: 'Praha' },
            { name: 'B', birthDate: '1992-07-15', birthTime: '08:30', birthPlace: 'Brno' }
        );

        expect(synastry.engine.precision).toBe('date_noon_location_timezone');
        expect(synastry.engine.person1Precision).toBe('date_noon_location_timezone');
        expect(synastry.engine.person2Precision).toBe('birth_time_location_timezone');
    });

    test('calculates current transit snapshot against natal chart', () => {
        const transit = calculateTransitSnapshot(
            { birthDate: '1990-01-01', birthTime: '12:00', birthPlace: 'Praha' },
            new Date('2026-04-27T00:00:00Z')
        );

        expect(transit.engine.version).toBe('astro-engine-v1');
        expect(transit.current.sunSign).toBeTruthy();
        expect(transit.natal.sunSign).toBe('Kozoroh');
        expect(transit.title).toBeTruthy();
        expect(transit.message).toBeTruthy();
        expect(Array.isArray(transit.aspects)).toBe(true);
    });

    test('calculates symbolic astrocartography destination recommendations', () => {
        const insights = calculateAstrocartographyInsights(
            { birthDate: '1990-01-01', birthTime: '12:00', birthPlace: 'Praha' },
            'kariera'
        );

        expect(insights.engine.version).toBe('astro-engine-v1');
        expect(insights.engine.method).toBe('symbolic_destination_resonance');
        expect(insights.engine.isSymbolic).toBe(true);
        expect(insights.intention.key).toBe('kariera');
        expect(insights.precision).toBe('birth_time_location_timezone');
        expect(insights.location).toEqual(expect.objectContaining({ name: 'Praha', country: 'CZ' }));
        expect(insights.notes).toEqual(expect.arrayContaining([
            expect.stringContaining('Misto narozeni rozpoznano')
        ]));
        expect(insights.angularLines.length).toBeGreaterThan(0);
        expect(insights.angularLines).toEqual(expect.arrayContaining([
            expect.objectContaining({ planetId: 'sun', angle: 'MC' }),
            expect.objectContaining({ planetId: 'sun', angle: 'IC' })
        ]));
        expect(insights.angularLines[0].longitude).toBeGreaterThanOrEqual(-180);
        expect(insights.angularLines[0].longitude).toBeLessThanOrEqual(180);
        expect(insights.angularLines[0].map.x).toBeGreaterThanOrEqual(0);
        expect(insights.angularLines[0].map.x).toBeLessThanOrEqual(100);
        expect(insights.recommendations).toHaveLength(5);
        expect(insights.recommendations[0].score).toBeGreaterThanOrEqual(insights.recommendations[1].score);
        expect(insights.recommendations[0].primaryPlanet.name).toBeTruthy();
        expect(insights.recommendations[0].primaryPlanet.degreeText).toMatch(/°/);
        expect(insights.recommendations[0].reason).toContain(insights.recommendations[0].city);
        expect(insights.recommendations[0].map.x).toBeGreaterThanOrEqual(0);
        expect(insights.recommendations[0].map.y).toBeLessThanOrEqual(100);

        const prompt = formatAstrocartographyForPrompt(insights);
        expect(prompt).toContain('Presnost zdrojove mapy: birth_time_location_timezone');
        expect(prompt).toContain('Misto narozeni: Praha (CZ)');
        expect(prompt).toContain(insights.recommendations[0].primaryPlanet.degreeText);
    });
});
