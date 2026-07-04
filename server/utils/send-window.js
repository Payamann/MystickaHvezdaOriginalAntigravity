/**
 * Prague-aware send windows for daily jobs.
 *
 * The daily email/push jobs dedupe per Prague calendar day, so their
 * catch-up windows must be expressed in Prague local time too. A pure
 * UTC-hours check (`getUTCHours() >= N`) opens a false window between
 * Prague midnight and UTC midnight (22:00-24:00 UTC in summer), which
 * made the "morning" horoscope email go out at 00:20 at night.
 */

export const SEND_WINDOW_TIME_ZONE = 'Europe/Prague';

export function getPragueHour(date = new Date()) {
    return Number(new Intl.DateTimeFormat('en-GB', {
        timeZone: SEND_WINDOW_TIME_ZONE,
        hour: 'numeric',
        hour12: false
    }).format(date)) % 24;
}

// Daily horoscope email is scheduled at 07:00 UTC = 09:00 CEST / 08:00 CET.
// Catch-up may run from 09:00 Prague until Prague midnight.
export function isAfterDailyHoroscopeSendWindow(date = new Date()) {
    return getPragueHour(date) >= 9;
}

// Daily push is scheduled at 06:00 UTC = 08:00 CEST / 07:00 CET.
// Catch-up may run from 08:00 Prague until Prague midnight.
export function isAfterDailyPushSendWindow(date = new Date()) {
    return getPragueHour(date) >= 8;
}
