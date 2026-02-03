/**
 * NextWorkoutCard Component
 * Displays the next scheduled workout with start button
 */

import type { Program, WorkoutDay } from '../../types/dashboard';

interface NextWorkoutCardProps {
    nextWorkout: WorkoutDay | null;
    activeProgram: Program | null;
    onStartWorkout: (dayId: string, programId: string) => void;
    onNavigate: (path: string) => void;
}

export function NextWorkoutCard({ nextWorkout, activeProgram, onStartWorkout, onNavigate }: NextWorkoutCardProps) {
    const handleStartWorkout = () => {
        if (!nextWorkout || !activeProgram) return;

        if (!nextWorkout.exercises || nextWorkout.exercises.length === 0) {
            alert('Cannot start workout: This day has no exercises. Please add exercises first.');
            return;
        }
        onStartWorkout(nextWorkout.id, activeProgram.id);
    };

    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">📅</span>
                Next Workout
            </h3>
            {nextWorkout && activeProgram ? (
                <>
                    <div className="mb-4">
                        <h4 className="text-2xl font-bold text-white mb-1">{nextWorkout.name}</h4>
                        <p className="text-slate-400 text-sm">
                            {nextWorkout.exercises?.length || 0} exercises • Day {nextWorkout.dayNumber}
                        </p>
                    </div>
                    {nextWorkout.exercises && nextWorkout.exercises.length > 0 && (
                        <div className="mb-4 space-y-1">
                            {nextWorkout.exercises.slice(0, 3).map((ex: any, idx: number) => (
                                <div key={idx} className="text-slate-300 text-sm">
                                    • {ex.exercise?.nameEn || ex.exercise?.name || 'Exercise'}
                                </div>
                            ))}
                            {nextWorkout.exercises.length > 3 && (
                                <div className="text-slate-500 text-sm">
                                    +{nextWorkout.exercises.length - 3} more...
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleStartWorkout}
                        className="w-full bg-lime-400 hover:bg-lime-500 text-slate-950 py-3 px-4 rounded-lg font-semibold transition-all duration-200">
                        Start Workout →
                    </button>
                </>
            ) : (
                <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">No workout scheduled</p>
                    <button
                        onClick={() => onNavigate('/programs')}
                        className="px-6 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all">
                        Browse Programs
                    </button>
                </div>
            )}
        </div>
    );
}
