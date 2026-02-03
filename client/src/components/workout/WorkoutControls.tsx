import { type WorkoutLog } from '../../services/workoutService';
import { type Exercise } from '../../services/exerciseService';

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
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                <button
                    onClick={onNavigatePrevious}
                    disabled={currentExerciseIndex === 0}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold min-h-[44px]"
                >
                    ← Previous
                </button>
                <span className="text-gray-400 text-sm">
                    Exercise {currentExerciseIndex + 1} of {totalExercises}
                </span>
                <button
                    onClick={onNavigateNext}
                    disabled={currentExerciseIndex >= totalExercises - 1}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold min-h-[44px]"
                >
                    Next →
                </button>
            </div>

            {/* Current Exercise */}
            {currentExercise && (
                <div className="text-center">
                    <button
                        onClick={() => onShowExerciseInfo(currentExercise.exercise?.id)}
                        className="text-3xl font-bold text-white mb-2 hover:text-purple-400 transition-colors"
                    >
                        {currentExercise.exercise.nameEn} ℹ️
                    </button>
                    <p className="text-gray-400">
                        Target: {currentExercise.targetSets} sets × {currentExercise.targetReps} reps
                        {currentExercise.targetWeight && ` @ ${currentExercise.targetWeight}kg`}
                    </p>
                </div>
            )}
        </div>
    );
}
