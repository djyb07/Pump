import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { formatTime } from '../utils/formatTime';

const LOCAL_STORAGE_KEY = 'pump_rest_timer';

interface PersistedTimerState {
    /** Unix timestamp (ms) when the countdown should reach 0. */
    targetEndTime: number;
    /** Total duration in seconds that was originally set. */
    totalDuration: number;
}

interface RestTimerProps {
    initialSeconds?: number;
    onComplete?: () => void;
}

export default function RestTimer({ initialSeconds = 120, onComplete }: RestTimerProps) {
    const [seconds, setSeconds] = useState<number>(initialSeconds);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);

    /** Stores the target end timestamp while the timer is actively running. */
    const targetEndTimeRef = useRef<number>(0);
    /** Stores remaining seconds at the moment of pause. */
    const remainingOnPauseRef = useRef<number>(initialSeconds);

    // ── Persistence helpers ──────────────────────────────────────────

    const saveToStorage = useCallback((targetEndTime: number, totalDuration: number): void => {
        const state: PersistedTimerState = { targetEndTime, totalDuration };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }, []);

    const clearStorage = useCallback((): void => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }, []);

    // ── Restore from localStorage on mount ───────────────────────────

    useEffect(() => {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!raw) return;

            const persisted: PersistedTimerState = JSON.parse(raw) as PersistedTimerState;
            const remaining = Math.ceil((persisted.targetEndTime - Date.now()) / 1000);

            if (remaining <= 0) {
                // Timer expired while page was closed — show finished state
                setSeconds(0);
                setIsRunning(false);
                setIsPaused(false);
                clearStorage();
                onComplete?.();
            } else {
                // Timer still has time left — resume it
                targetEndTimeRef.current = persisted.targetEndTime;
                remainingOnPauseRef.current = remaining;
                setSeconds(remaining);
                setIsRunning(true);
                setIsPaused(false);
            }
        } catch {
            clearStorage();
        }
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Delta-time tick ──────────────────────────────────────────────

    useEffect(() => {
        if (!isRunning || isPaused) return;

        const intervalId: number = window.setInterval(() => {
            const remaining = Math.ceil((targetEndTimeRef.current - Date.now()) / 1000);

            if (remaining <= 0) {
                setSeconds(0);
                setIsRunning(false);
                setIsPaused(false);
                clearStorage();
                onComplete?.();
            } else {
                setSeconds(remaining);
            }
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isRunning, isPaused, onComplete, clearStorage]);

    // ── Controls ─────────────────────────────────────────────────────

    const startTimer = (): void => {
        const duration = seconds === 0 ? initialSeconds : seconds;
        const endTime = Date.now() + duration * 1000;

        targetEndTimeRef.current = endTime;
        remainingOnPauseRef.current = duration;
        setSeconds(duration);
        setIsRunning(true);
        setIsPaused(false);
        saveToStorage(endTime, duration);
    };

    const pauseTimer = (): void => {
        if (isPaused) {
            // Resume: recalculate target end time from saved remaining
            const endTime = Date.now() + remainingOnPauseRef.current * 1000;
            targetEndTimeRef.current = endTime;
            setIsPaused(false);
            saveToStorage(endTime, remainingOnPauseRef.current);
        } else {
            // Pause: snapshot remaining seconds
            const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
            remainingOnPauseRef.current = remaining;
            setIsPaused(true);
            clearStorage(); // Don't persist while paused (timer is frozen)
        }
    };

    const resetTimer = (): void => {
        setSeconds(initialSeconds);
        setIsRunning(false);
        setIsPaused(false);
        remainingOnPauseRef.current = initialSeconds;
        targetEndTimeRef.current = 0;
        clearStorage();
    };

    const skipTimer = (): void => {
        setSeconds(0);
        setIsRunning(false);
        setIsPaused(false);
        targetEndTimeRef.current = 0;
        clearStorage();
    };

    const setPreset = (time: number): void => {
        setSeconds(time);
        setIsRunning(false);
        setIsPaused(false);
        remainingOnPauseRef.current = time;
        targetEndTimeRef.current = 0;
        clearStorage();
    };

    // ── Derived values ───────────────────────────────────────────────

    const displayDuration = isRunning || isPaused
        ? remainingOnPauseRef.current || initialSeconds
        : (seconds === 0 ? initialSeconds : seconds);

    const progress = ((displayDuration - seconds) / displayDuration) * 100;

    return (
        <div className="glass-card p-6 sticky top-24">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-lime-400" />
                Rest Timer
            </h3>

            {/* Circular Progress */}
            <div className="flex justify-center mb-6">
                <div className="relative w-36 h-36">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="72"
                            cy="72"
                            r="64"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-800/50"
                        />
                        <circle
                            cx="72"
                            cy="72"
                            r="64"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 64}`}
                            strokeDashoffset={`${2 * Math.PI * 64 * (1 - progress / 100)}`}
                            className="text-lime-400 transition-all duration-1000"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-4xl font-bold ${seconds <= 10 && isRunning ? 'text-red-400' : 'text-white'}`}>
                            {formatTime(seconds)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls - Big touch targets */}
            <div className="grid grid-cols-2 gap-3">
                {!isRunning ? (
                    <button
                        onClick={startTimer}
                        className="col-span-2 flex items-center justify-center gap-2 px-6 py-4 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-lime-400/20"
                    >
                        <Play className="w-5 h-5" /> Start
                    </button>
                ) : (
                    <button
                        onClick={pauseTimer}
                        className="col-span-2 flex items-center justify-center gap-2 px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-slate-950 rounded-xl font-bold text-lg transition-all active:scale-95"
                    >
                        {isPaused ? <><Play className="w-5 h-5" /> Resume</> : <><Pause className="w-5 h-5" /> Pause</>}
                    </button>
                )}
                <button
                    onClick={resetTimer}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/30 hover:bg-slate-800/50 text-white rounded-xl font-semibold transition-all border border-white/10 active:scale-95"
                >
                    <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button
                    onClick={skipTimer}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/30 hover:bg-slate-800/50 text-white rounded-xl font-semibold transition-all border border-white/10 active:scale-95"
                >
                    <SkipForward className="w-4 h-4" /> Skip
                </button>
            </div>

            {/* Quick preset buttons */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-slate-500 mb-2 text-center">Quick Set</div>
                <div className="grid grid-cols-4 gap-2">
                    {[60, 90, 120, 180].map((time) => (
                        <button
                            key={time}
                            onClick={() => setPreset(time)}
                            className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${initialSeconds === time && seconds === time
                                ? 'bg-lime-400/20 text-lime-400 border border-lime-400/30'
                                : 'bg-slate-900/30 text-slate-400 border border-white/5 hover:text-white'
                                }`}
                        >
                            {time >= 60 ? `${time / 60}m` : `${time}s`}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
