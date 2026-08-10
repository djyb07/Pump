/**
 * One-Time OAuth Authorization Codes
 *
 * After a successful Google sign-in the server must hand the browser
 * something it can trade for a JWT. Putting the JWT itself in the redirect
 * URL leaks a 24-hour credential into browser history, referrer headers and
 * every access log between here and the client (finding H8).
 *
 * Instead the callback issues an opaque, single-use, short-lived code and the
 * client POSTs it back to /api/auth/oauth/exchange. The code is worthless
 * once used or once TTL_MS has elapsed, so a copy sitting in a log is inert.
 *
 * SCALING NOTE (Memory Store):
 * Codes live in process memory, matching the existing rate-limiter design.
 * This is correct for the current single-instance deployment. Behind more
 * than one instance the exchange would have to hit whichever instance issued
 * the code; move this to Redis (or a short-lived DB row) before scaling out.
 */

import crypto from 'crypto';

/** Codes expire fast — this is a redirect hop, not a session. */
const TTL_MS = 60 * 1000;

interface PendingCode {
    userId: string;
    expiresAt: number;
}

const pendingCodes = new Map<string, PendingCode>();

/** Drop expired entries so the map cannot grow without bound. */
function pruneExpired(now: number): void {
    for (const [code, entry] of pendingCodes) {
        if (entry.expiresAt <= now) {
            pendingCodes.delete(code);
        }
    }
}

/**
 * Issue a one-time code for a freshly authenticated user.
 * 256 bits of CSPRNG entropy — not brute-forceable within its 60s life.
 */
export function issueOAuthCode(userId: string): string {
    const now = Date.now();
    pruneExpired(now);

    const code = crypto.randomBytes(32).toString('base64url');
    pendingCodes.set(code, { userId, expiresAt: now + TTL_MS });
    return code;
}

/**
 * Redeem a code, returning the userId it was issued for.
 * Returns null if the code is unknown, already used, or expired.
 * The entry is always removed, so a code can never be redeemed twice.
 */
export function redeemOAuthCode(code: string): string | null {
    const entry = pendingCodes.get(code);
    if (!entry) {
        return null;
    }

    // Single-use: delete on lookup, whether or not it turns out to be valid.
    pendingCodes.delete(code);

    if (entry.expiresAt <= Date.now()) {
        return null;
    }

    return entry.userId;
}
