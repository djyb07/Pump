import type { WorkoutLog } from '../../services/workoutService';

interface WorkoutHeaderProps {
    workout: WorkoutLog;
    elapsedMinutes: number;
    onFinishWorkout: () => void;
}

export default function WorkoutHeader({
    workout,
    elapsedMinutes,
    onFinishWorkout
}: WorkoutHeaderProps) {
    const getElapsedTime = () => {
        return `${elapsedMinutes} min`;
    };

    return (
        <header className="bg-slate-900/60 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            {workout.day?.name || 'Active Workout'}
                        </h1>
                        <p className="text-slate-400 text-xs sm:text-sm">
                            {workout.day?.program?.name} • {getElapsedTime()} elapsed
                        </p>
                    </div>
                    <button
                        onClick={onFinishWorkout}
                        className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-bold transition-all text-base sm:text-sm min-h-[44px]"
                    >
                        ✓ Finish Workout
                    </button>
                </div>
            </div>
        </header>
    );
}
