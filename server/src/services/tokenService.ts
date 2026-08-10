/**
 * Access Token Issuance
 *
 * Centralises JWT minting so login, OAuth exchange and refresh all produce
 * identically-shaped tokens.
 *
 * SESSION MODEL (finding M10)
 * Tokens live for ACCESS_TOKEN_TTL. The client renews well before expiry, so
 * an active session is never interrupted. Renewal is not unlimited: every
 * token carries an `authTime` claim recording when the user actually proved
 * who they are, it is carried forward unchanged across refreshes, and refresh
 * is refused once the session exceeds MAX_SESSION_AGE_MS. That bounds how long
 * a single sign-in can be extended without a schema change.
 *
 * Deliberately NOT done here: refreshing an already-expired token. Accepting
 * expired tokens would stretch a stolen credential's useful life to the full
 * absolute cap. Proactive renewal covers the case that matters (the app is
 * open and in use); a token that expired while the app was closed requires a
 * normal sign-in.
 */

import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/validateEnv';

/** Lifetime of a single access token. */
export const ACCESS_TOKEN_TTL = '24h';

/** Hard ceiling on how long one sign-in can be extended by refreshing. */
export const MAX_SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AccessTokenClaims {
    userId: string;
    /** Unix seconds when the user last authenticated with credentials. */
    authTime: number;
}

/**
 * Mint an access token.
 *
 * @param userId   subject of the token
 * @param authTime unix seconds of the original sign-in; omit for a fresh one
 */
export function issueAccessToken(userId: string, authTime?: number): string {
    const claims: AccessTokenClaims = {
        userId,
        authTime: authTime ?? Math.floor(Date.now() / 1000),
    };

    return jwt.sign(claims, getJwtSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

/**
 * Whether a session that began at `authTime` (unix seconds) may still be
 * extended. Tokens issued before this claim existed fall back to their `iat`.
 */
export function isWithinMaxSessionAge(authTime: number | undefined, issuedAt?: number): boolean {
    const start = authTime ?? issuedAt;
    if (!start) {
        // No usable anchor — refuse to extend rather than allow it forever.
        return false;
    }
    return Date.now() - start * 1000 < MAX_SESSION_AGE_MS;
}
