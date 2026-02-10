import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatTime } from '../utils/formatTime';

interface UseWorkoutTimerOptions {
    /** ISO date string or Unix timestamp (ms) from the server. If provided, the
     *  timer resumes from this point on mount — surviving page refreshes. */
    initialStartTime?: string | number;
}

interface UseWorkoutTimerReturn {
    /** Total elapsed seconds since the workout started. */
    elapsedSeconds: number;
    /** Formatted elapsed time as MM:SS. */
    formattedTime: string;
}

/**
 * Tracks workout elapsed time using delta-time logic.
 *
 * Instead of incrementing a counter, each tick recalculates:
 *   elapsed = Date.now() - startTimestamp
 *
 * This ensures that even if the JS thread is throttled (background tab,
 * screen-off), the next tick will jump to the correct value.
 *
 * When `initialStartTime` is provided (e.g. from `workoutLog.startTime`),
 * the timer picks up exactly where it left off after a page refresh.
 */
export function useWorkoutTimer(
    options: UseWorkoutTimerOptions = {},
): UseWorkoutTimerReturn {
    const { initialStartTime } = options;

    // Resolve the start timestamp once — either from the server or from now.
    const startTimestamp = useMemo<number>(() => {
        if (initialStartTime != null) {
            const parsed =
                typeof initialStartTime === 'string'
                    ? new Date(initialStartTime).getTime()
                    : initialStartTime;

            // Guard against invalid dates — fall back to Date.now()
            return Number.isFinite(parsed) ? parsed : Date.now();
        }
        return Date.now();
    }, [initialStartTime]);

    const computeElapsed = useCallback(
        (): number => Math.floor((Date.now() - startTimestamp) / 1000),
        [startTimestamp],
    );

    const [elapsedSeconds, setElapsedSeconds] = useState<number>(computeElapsed);

    useEffect(() => {
        // Immediately sync on mount / when startTimestamp changes
        setElapsedSeconds(computeElapsed());

        const intervalId: number = window.setInterval(() => {
            setElapsedSeconds(computeElapsed());
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [computeElapsed]);

    return {
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
    };
}
