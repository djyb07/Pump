import { useState, useEffect } from 'react';

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
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">⏱️ Rest Timer</h3>

            {/* Circular Progress */}
            <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-800"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                            className="text-purple-500 transition-all duration-1000"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                            {formatTime(seconds)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-2">
                {!isRunning ? (
                    <button
                        onClick={startTimer}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                    >
                        ▶️ Start
                    </button>
                ) : (
                    <button
                        onClick={pauseTimer}
                        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all"
                    >
                        {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                    </button>
                )}
                <button
                    onClick={resetTimer}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                >
                    🔄 Reset
                </button>
                <button
                    onClick={skipTimer}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                >
                    ⏭️ Skip
                </button>
            </div>
        </div>
    );
}
