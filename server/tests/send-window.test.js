import {
    getPragueHour,
    isAfterDailyHoroscopeSendWindow,
    isAfterDailyPushSendWindow
} from '../utils/send-window.js';

describe('Prague-aware daily send windows', () => {
    test('converts UTC instants to Prague local hours (summer and winter)', () => {
        // Summer (CEST = UTC+2)
        expect(getPragueHour(new Date('2026-07-04T07:20:00Z'))).toBe(9);
        expect(getPragueHour(new Date('2026-07-03T22:20:00Z'))).toBe(0);
        // Winter (CET = UTC+1)
        expect(getPragueHour(new Date('2026-01-15T07:20:00Z'))).toBe(8);
        expect(getPragueHour(new Date('2026-01-15T23:20:00Z'))).toBe(0);
    });

    test('regression: the 22:20 UTC night tick must NOT open the email window', () => {
        // This exact instant sent "morning" horoscopes at 00:20 Prague time
        // (last_sent_at 2026-07-03 22:20 UTC observed in production).
        expect(isAfterDailyHoroscopeSendWindow(new Date('2026-07-03T22:20:00Z'))).toBe(false);
        expect(isAfterDailyHoroscopeSendWindow(new Date('2026-07-03T23:20:00Z'))).toBe(false);
    });

    test('email window opens after the 07:00 UTC send and closes at Prague midnight', () => {
        expect(isAfterDailyHoroscopeSendWindow(new Date('2026-07-04T07:20:00Z'))).toBe(true);  // 9:20 Prague
        expect(isAfterDailyHoroscopeSendWindow(new Date('2026-07-04T15:20:00Z'))).toBe(true);  // 17:20 Prague
        expect(isAfterDailyHoroscopeSendWindow(new Date('2026-07-04T05:20:00Z'))).toBe(false); // 7:20 Prague
        // Winter: 08:20 UTC = 9:20 Prague; 22:20 UTC = 23:20 Prague (same day, still valid);
        // 23:20 UTC = 00:20 Prague NEXT day (the false window in winter).
        expect(isAfterDailyHoroscopeSendWindow(new Date('2026-01-15T08:20:00Z'))).toBe(true);
        expect(isAfterDailyHoroscopeSendWindow(new Date('2026-01-15T22:20:00Z'))).toBe(true);
        expect(isAfterDailyHoroscopeSendWindow(new Date('2026-01-15T23:20:00Z'))).toBe(false);
    });

    test('push window opens after the 06:00 UTC send and closes at Prague midnight', () => {
        expect(isAfterDailyPushSendWindow(new Date('2026-07-04T06:40:00Z'))).toBe(true);   // 8:40 Prague
        expect(isAfterDailyPushSendWindow(new Date('2026-07-03T22:40:00Z'))).toBe(false);  // 0:40 Prague
        expect(isAfterDailyPushSendWindow(new Date('2026-07-04T05:40:00Z'))).toBe(false);  // 7:40 Prague
    });
});
