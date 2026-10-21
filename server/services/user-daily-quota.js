import { supabase } from '../db-supabase.js';

const DAILY_QUOTA_LIMITS = Object.freeze({
    mentor: 3,
    crystal_ball: 3
});

function getResultRow(data) {
    return Array.isArray(data) ? data[0] : data;
}

export async function reserveUserDailyQuota({ userId, feature, now = new Date() }) {
    const limit = DAILY_QUOTA_LIMITS[feature];
    if (typeof userId !== 'string' || !userId || !limit) {
        throw new Error('Invalid daily quota reservation request.');
    }

    const { data, error } = await supabase.rpc('reserve_user_daily_quota', {
        p_user_id: userId,
        p_date_key: now.toISOString().slice(0, 10),
        p_feature: feature,
        p_limit: limit
    });
    if (error) throw error;

    const row = getResultRow(data);
    if (!row || typeof row.allowed !== 'boolean'
        || !Number.isInteger(row.used) || row.used < 0
        || !Number.isInteger(row.remaining) || row.remaining < 0) {
        throw new Error('Daily quota reservation returned an invalid result.');
    }

    if (!row.allowed) {
        return {
            allowed: false,
            reservationId: null,
            used: row.used,
            remaining: 0
        };
    }

    if (typeof row.reservation_id !== 'string' || !row.reservation_id) {
        throw new Error('Daily quota reservation is missing its reservation ID.');
    }

    return {
        allowed: true,
        reservationId: row.reservation_id,
        used: row.used,
        remaining: row.remaining
    };
}

export async function finishUserDailyQuotaReservation(reservationId, outcome) {
    if (typeof reservationId !== 'string' || !reservationId) return false;
    const rpcName = outcome === 'commit'
        ? 'commit_user_daily_quota'
        : outcome === 'release'
            ? 'release_user_daily_quota'
            : null;

    if (!rpcName) throw new Error('Invalid daily quota reservation outcome.');

    const { data, error } = await supabase.rpc(rpcName, {
        p_reservation_id: reservationId
    });
    if (error) throw error;
    if (typeof data !== 'boolean') {
        throw new Error('Daily quota reservation finalization returned an invalid result.');
    }
    return data;
}
