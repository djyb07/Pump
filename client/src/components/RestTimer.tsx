import { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface RestTimerProps {
    initialSeconds?: number;
    onComplete?: () => void;
}

export default function RestTimer({ initialSeconds = 120, onComplete }: RestTimerProps) {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let interval: number;

        if (isRunning && !isPaused && seconds > 0) {
            interval = window.setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        onComplete?.();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isRunning, isPaused, seconds, onComplete]);

    const startTimer = () => {
        if (seconds === 0) {
            setSeconds(initialSeconds);
        }
        setIsRunning(true);
        setIsPaused(false);
    };

    const pauseTimer = () => {
        setIsPaused(!isPaused);
    };

    const resetTimer = () => {
        setSeconds(initialSeconds);
        setIsRunning(false);
        setIsPaused(false);
    };

    const skipTimer = () => {
        setSeconds(0);
        setIsRunning(false);
        setIsPaused(false);
    };

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    const progress = ((initialSeconds - seconds) / initialSeconds) * 100;

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
                            onClick={() => {
                                setSeconds(time);
                                setIsRunning(false);
                                setIsPaused(false);
                            }}
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

