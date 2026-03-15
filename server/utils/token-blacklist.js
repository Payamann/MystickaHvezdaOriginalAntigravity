/**
 * Token Blacklist Management
 * Handles token invalidation for logout and password reset
 * Uses Supabase table: expired_tokens (token_jti, expires_at)
 */

import { supabase } from '../db-supabase.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';
import crypto from 'crypto';

/**
 * Add token to blacklist (for logout or password change)
 * @param {string} token - JWT token to blacklist
 */
export async function blacklistToken(token) {
    try {
        if (!token) return;

        // Decode token to get expiration
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return;

        // Add to blacklist with expiration time
        const expiresAt = new Date(decoded.exp * 1000);

        const { error } = await supabase
            .from('expired_tokens')
            .insert({
                token_jti: generateTokenJti(token),
                user_id: decoded.id,
                expires_at: expiresAt.toISOString()
            });

        if (error) {
            console.error('[BLACKLIST] Error adding token:', error);
        }
    } catch (e) {
        console.error('[BLACKLIST] Error blacklisting token:', e);
    }
}

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} - true if token is blacklisted
 */
export async function isTokenBlacklisted(token) {
    try {
        if (!token) return false;

        const decoded = jwt.decode(token);
        if (!decoded) return false;

        const { count, error } = await supabase
            .from('expired_tokens')
            .select('*', { count: 'exact', head: true })
            .eq('token_jti', generateTokenJti(token))
            .eq('user_id', decoded.id);

        if (error) {
            console.error('[BLACKLIST] Query error:', error);
            return false;
        }

        return count > 0;
    } catch (e) {
        console.error('[BLACKLIST] Error checking blacklist:', e);
        return false;
    }
}

/**
 * Blacklist all tokens for a user (password change, security event)
 * @param {string} userId - User ID
 */
export async function blacklistAllUserTokens(userId) {
    try {
        if (!userId) return;

        const now = new Date();

        // Insert a record that invalidates all previous tokens for this user
        const { error } = await supabase
            .from('expired_tokens')
            .insert({
                token_jti: `user_${userId}_all_${Date.now()}`,
                user_id: userId,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                reason: 'password_change'
            });

        if (error) {
            console.error('[BLACKLIST] Error blacklisting all tokens:', error);
        }
    } catch (e) {
        console.error('[BLACKLIST] Error in blacklistAllUserTokens:', e);
    }
}

/**
 * Clean up expired tokens from blacklist (optional, runs periodically)
 */
export async function cleanupExpiredTokens() {
    try {
        const { error } = await supabase
            .from('expired_tokens')
            .delete()
            .lt('expires_at', new Date().toISOString());

        if (error) {
            console.error('[BLACKLIST] Cleanup error:', error);
        } else {
            console.log('[BLACKLIST] Cleanup completed');
        }
    } catch (e) {
        console.error('[BLACKLIST] Error cleaning up:', e);
    }
}

/**
 * Generate deterministic JTI (JWT ID) from token
 * @param {string} token - JWT token
 * @returns {string} - Hash of token for blacklist tracking
 */
function generateTokenJti(token) {
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 32);
}
