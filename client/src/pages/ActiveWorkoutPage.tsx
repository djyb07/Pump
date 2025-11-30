import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { workoutService, type WorkoutLog, type SetLog } from '../services/workoutService';
import { exerciseService, type Exercise } from '../services/exerciseService';
import RestTimer from '../components/RestTimer';
import WorkoutSummaryModal from '../components/WorkoutSummaryModal';
import ExerciseModal from '../components/ExerciseModal';

export default function ActiveWorkoutPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dayId = searchParams.get('dayId');

    const [workout, setWorkout] = useState<WorkoutLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [startTime] = useState(new Date());
    const [elapsedMinutes, setElapsedMinutes] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [finishedWorkout, setFinishedWorkout] = useState<WorkoutLog | null>(null);

    useEffect(() => {
        initWorkout();
    }, [dayId]);

    // Update elapsed time every minute
    useEffect(() => {
        const interval = window.setInterval(() => {
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 60000);
            setElapsedMinutes(elapsed);
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, [startTime]);

    const initWorkout = async () => {
        try {
            // If dayId is provided, start a new workout (user clicked Start Workout)
            if (dayId) {
                const newWorkout = await workoutService.startWorkout(dayId);
                setWorkout(newWorkout);
                setLoading(false);
                return;
            }

            // No dayId - check if there's an active workout (page refresh scenario)
            const activeWorkout = await workoutService.getActiveWorkout();
            if (activeWorkout) {
                setWorkout(activeWorkout);
                setLoading(false);
                return;
            }

            // No dayId and no active workout
            setError('No day selected');
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to start workout');
        } finally {
            setLoading(false);
        }
    };

    const handleLogSet = async () => {
        if (!workout || !reps) return;

        const currentExercise = workout.day?.exercises?.[currentExerciseIndex];
        if (!currentExercise) return;

        try {
            await workoutService.logSet(
                workout.id,
                currentExercise.id,
                parseInt(reps),
                weight ? parseFloat(weight) : undefined
            );

            // Reload workout to get updated data
            const updatedWorkout = await workoutService.getWorkoutById(workout.id);
            setWorkout(updatedWorkout);

            // Clear inputs
            setReps('');
            setWeight('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to log set');
        }
    };

    const handleFinishWorkout = async () => {
        if (!workout) return;

        try {
            const completed = await workoutService.finishWorkout(workout.id);
            setFinishedWorkout(completed);
            setShowSummary(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to finish workout');
        }
    };

    const handleCloseSummary = () => {
        setShowSummary(false);
        navigate('/workout/history');
    };

    const getCurrentExerciseSets = (): SetLog[] => {
        if (!workout?.exerciseLogs) return [];

        const currentExercise = workout.day?.exercises?.[currentExerciseIndex];
        if (!currentExercise) return [];

        const exerciseLog = workout.exerciseLogs.find(
            log => log.dayExerciseId === currentExercise.id
        );

        return exerciseLog?.sets as SetLog[] || [];
    };

    const getElapsedTime = () => {
        return `${elapsedMinutes} min`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 flex items-center justify-center">
                <div className="text-white text-xl">Loading workout...</div>
            </div>
        );
    }

    if (error || !workout) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 flex items-center justify-center">
                <div className="text-red-400 text-xl">{error || 'Failed to load workout'}</div>
            </div>
        );
    }

    const currentExercise = workout.day?.exercises?.[currentExerciseIndex];
    const totalExercises = workout.day?.exercises?.length || 0;
    const currentSets = getCurrentExerciseSets();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {workout.day?.name || 'Active Workout'}
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {workout.day?.program?.name} • {getElapsedTime()} elapsed
                            </p>
                        </div>
                        <button
                            onClick={handleFinishWorkout}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
                        >
                            ✓ Finish Workout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Exercise Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Exercise Navigator */}
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                                    disabled={currentExerciseIndex === 0}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← Previous
                                </button>
                                <span className="text-gray-400">
                                    Exercise {currentExerciseIndex + 1} of {totalExercises}
                                </span>
                                <button
                                    onClick={() => setCurrentExerciseIndex(Math.min(totalExercises - 1, currentExerciseIndex + 1))}
                                    disabled={currentExerciseIndex >= totalExercises - 1}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next →
                                </button>
                            </div>

                            {/* Current Exercise */}
                            {currentExercise && (
                                <div className="text-center">
                                    <button
                                        onClick={async () => {
                                            const exerciseId = currentExercise.exercise?.id;
                                            if (exerciseId) {
                                                const exerciseData = await exerciseService.getById(exerciseId);
                                                setSelectedExercise(exerciseData);
                                            }
                                        }}
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

                        {/* Set Logger */}
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Log Set #{currentSets.length + 1}</h3>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Reps *
                                    </label>
                                    <input
                                        type="number"
                                        value={reps}
                                        onChange={(e) => setReps(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-xl text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-xl text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleLogSet}
                                disabled={!reps}
                                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ✓ Log Set
                            </button>
                        </div>

                        {/* Set History */}
                        {currentSets.length > 0 && (
                            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4">Completed Sets</h3>
                                <div className="space-y-2">
                                    {currentSets.map((set, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                                        >
                                            <span className="text-gray-400">Set {set.setNumber}</span>
                                            <span className="text-white font-semibold">
                                                {set.weight ? `${set.weight}kg × ` : ''}{set.reps} reps
                                            </span>
                                            <span className="text-green-500">✓</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <RestTimer initialSeconds={120} />
                    </div>
                </div>
            </main>

            {/* Workout Summary Modal */}
            {showSummary && finishedWorkout && (
                <WorkoutSummaryModal
                    workout={finishedWorkout}
                    onClose={handleCloseSummary}
                />
            )}

            {/* Exercise Info Modal */}
            <ExerciseModal
                exercise={selectedExercise}
                isOpen={!!selectedExercise}
                onClose={() => setSelectedExercise(null)}
            />
        </div>
    );
}
