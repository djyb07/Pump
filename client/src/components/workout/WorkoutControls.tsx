import { type WorkoutLog } from '../../services/workoutService';
import { type Exercise } from '../../services/exerciseService';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface DayExercise {
    id: string;
    exercise: Exercise;
    targetSets: number;
    targetReps: number;
    targetWeight?: number;
}

interface WorkoutControlsProps {
    workout: WorkoutLog;
    currentExerciseIndex: number;
    totalExercises: number;
    currentExercise: DayExercise | null;
    onNavigatePrevious: () => void;
    onNavigateNext: () => void;
    onShowExerciseInfo: (exerciseId: string) => void;
}

export default function WorkoutControls({
    currentExerciseIndex,
    totalExercises,
    currentExercise,
    onNavigatePrevious,
    onNavigateNext,
    onShowExerciseInfo
}: WorkoutControlsProps) {
    return (
        <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                <button
                    onClick={onNavigatePrevious}
                    disabled={currentExerciseIndex === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-1 px-6 py-3 bg-slate-800/60 hover:bg-slate-700/60 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold min-h-[44px] border border-white/5"
                >
                    <ChevronLeft className="w-5 h-5" /> Previous
                </button>
                <span className="text-slate-400 text-sm">
                    Exercise {currentExerciseIndex + 1} of {totalExercises}
                </span>
                <button
                    onClick={onNavigateNext}
                    disabled={currentExerciseIndex >= totalExercises - 1}
                    className="w-full sm:w-auto flex items-center justify-center gap-1 px-6 py-3 bg-slate-800/60 hover:bg-slate-700/60 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold min-h-[44px] border border-white/5"
                >
                    Next <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Current Exercise */}
            {currentExercise && (
                <div className="text-center">
                    <button
                        onClick={() => onShowExerciseInfo(currentExercise.exercise?.id)}
                        className="inline-flex items-center gap-2 text-3xl font-bold text-white mb-2 hover:text-lime-400 transition-colors"
                    >
                        {currentExercise.exercise.nameEn} <Info className="w-6 h-6 text-lime-400" />
                    </button>
                    <p className="text-slate-400">
                        Target: {currentExercise.targetSets} sets × {currentExercise.targetReps} reps
                        {currentExercise.targetWeight && ` @ ${currentExercise.targetWeight}kg`}
                    </p>
                </div>
            )}
        </div>
    );
}

