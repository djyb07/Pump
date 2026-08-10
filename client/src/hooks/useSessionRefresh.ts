import { useCallback, useEffect, useRef } from 'react';
import { refreshSession } from '../services/auth';

/**
 * useSessionRefresh
 *
 * Keeps the access token fresh so an in-use session is never dropped
 * mid-workout (finding M10). The server will only renew a token that has not
 * yet expired, so the whole job here is to renew early and often enough that
 * expiry is never reached while the app is open.
 *
 * Renewal is attempted when the token has less than REFRESH_THRESHOLD_MS left:
 *   1. on mount — the common case, opening the app after a day away
 *   2. every CHECK_INTERVAL_MS while open — covers a long workout
 *   3. on focus / visibilitychange — covers a phone backgrounded between sets
 *
 * A failed renewal is deliberately silent: the existing token is still valid
 * for hours, and the next trigger will try again. Only genuine expiry logs the
 * user out, via the apiClient response interceptor.
 */

/** Renew once the token has less than this remaining (12h of a 24h token). */
const REFRESH_THRESHOLD_MS = 12 * 60 * 60 * 1000;

/** How often to re-check while the app is open. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/** Don't hammer the endpoint if several triggers fire at once. */
const MIN_ATTEMPT_GAP_MS = 60 * 1000;

function msUntilExpiry(token: string): number | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload?.exp) return null;
        return payload.exp * 1000 - Date.now();
    } catch {
        return null;
    }
}

export function useSessionRefresh() {
    const lastAttemptRef = useRef(0);
    const inFlightRef = useRef(false);

    const maybeRefresh = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const remaining = msUntilExpiry(token);
        // Unreadable token, or still plenty of life left — nothing to do.
        if (remaining === null || remaining > REFRESH_THRESHOLD_MS) return;
        // Already expired: renewal is not possible, let the interceptor handle it.
        if (remaining <= 0) return;

        const now = Date.now();
        if (inFlightRef.current || now - lastAttemptRef.current < MIN_ATTEMPT_GAP_MS) return;

        inFlightRef.current = true;
        lastAttemptRef.current = now;

        try {
            const { token: fresh, user } = await refreshSession();
            localStorage.setItem('token', fresh);
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch {
            // Keep the current token; the next trigger retries.
        } finally {
            inFlightRef.current = false;
        }
    }, []);

    useEffect(() => {
        maybeRefresh();

        const interval = window.setInterval(maybeRefresh, CHECK_INTERVAL_MS);

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                maybeRefresh();
            }
        };

        window.addEventListener('focus', maybeRefresh);
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener('focus', maybeRefresh);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [maybeRefresh]);
}
