import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { workoutService, type WorkoutLog, type SetLog } from '../services/workoutService';
import { exerciseService, type Exercise } from '../services/exerciseService';
import RestTimer from '../components/RestTimer';
import WorkoutSummaryModal from '../components/WorkoutSummaryModal';
import ExerciseModal from '../components/ExerciseModal';
import WorkoutHeader from '../components/workout/WorkoutHeader';
import WorkoutControls from '../components/workout/WorkoutControls';
import ExerciseSetList from '../components/workout/ExerciseSetList';

export default function ActiveWorkoutPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dayId = searchParams.get('dayId');
    const programId = searchParams.get('programId');

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

    // Edit/Delete state
    const [editingSet, setEditingSet] = useState<{ exerciseLogId: string, setIndex: number } | null>(null);
    const [showEditConfirm, setShowEditConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [setToDelete, setSetToDelete] = useState<{ exerciseLogId: string, setIndex: number } | null>(null);

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
                const newWorkout = await workoutService.startWorkout(dayId, programId || undefined);
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

    // Handle edit set - load values into inputs
    const handleEditSet = (exerciseLogId: string, setIndex: number, set: SetLog) => {
        setShowEditConfirm(true);
        setEditingSet({ exerciseLogId, setIndex });
        setReps(set.reps.toString());
        setWeight(set.weight ? set.weight.toString() : '');
    };

    const confirmEdit = () => {
        setShowEditConfirm(false);
        // editingSet is already set, inputs are populated
    };

    const cancelEdit = () => {
        setShowEditConfirm(false);
        setEditingSet(null);
        setReps('');
        setWeight('');
    };

    // Handle update set (when in edit mode)
    const handleUpdateSet = async () => {
        if (!workout || !editingSet || !reps) return;

        try {
            const repsNum = parseInt(reps);
            const weightNum = weight ? parseFloat(weight) : undefined;

            await workoutService.updateSet(
                workout.id,
                editingSet.exerciseLogId,
                editingSet.setIndex,
                repsNum,
                weightNum
            );

            // Reload workout to get updated data
            const updatedWorkout = await workoutService.getWorkoutById(workout.id);
            setWorkout(updatedWorkout);

            // Clear editing state and inputs
            setEditingSet(null);
            setReps('');
            setWeight('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update set');
        }
    };

    // Handle delete set request
    const handleRequestDelete = (exerciseLogId: string, setIndex: number) => {
        setSetToDelete({ exerciseLogId, setIndex });
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!workout || !setToDelete) return;

        try {
            await workoutService.deleteSet(
                workout.id,
                setToDelete.exerciseLogId,
                setToDelete.setIndex
            );

            // Reload workout to get updated data
            const updatedWorkout = await workoutService.getWorkoutById(workout.id);
            setWorkout(updatedWorkout);

            // Clear state
            setSetToDelete(null);
            setShowDeleteConfirm(false);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete set');
            setShowDeleteConfirm(false);
        }
    };

    const cancelDelete = () => {
        setSetToDelete(null);
        setShowDeleteConfirm(false);
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

    const handleShowExerciseInfo = async (exerciseId: string) => {
        if (exerciseId) {
            const exerciseData = await exerciseService.getById(exerciseId);
            setSelectedExercise(exerciseData);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-200 text-xl">Loading workout...</div>
            </div>
        );
    }

    if (error || !workout) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-red-400 text-xl">{error || 'Failed to load workout'}</div>
            </div>
        );
    }

    const currentExercise = workout.day?.exercises?.[currentExerciseIndex];
    const totalExercises = workout.day?.exercises?.length || 0;
    const currentSets = getCurrentExerciseSets();
    const currentExerciseLog = workout.exerciseLogs?.find(
        log => log.dayExerciseId === currentExercise?.id
    );

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header - Extracted Component */}
            <WorkoutHeader
                workout={workout}
                elapsedMinutes={elapsedMinutes}
                onFinishWorkout={handleFinishWorkout}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
                    {/* Main Exercise Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Exercise Navigator - Extracted Component */}
                        <WorkoutControls
                            workout={workout}
                            currentExerciseIndex={currentExerciseIndex}
                            totalExercises={totalExercises}
                            currentExercise={currentExercise || null}
                            onNavigatePrevious={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                            onNavigateNext={() => setCurrentExerciseIndex(Math.min(totalExercises - 1, currentExerciseIndex + 1))}
                            onShowExerciseInfo={handleShowExerciseInfo}
                        />

                        {/* Set Logger - Extracted Component */}
                        <ExerciseSetList
                            sets={currentSets}
                            isEditing={!!editingSet}
                            editingSetIndex={editingSet?.setIndex ?? null}
                            reps={reps}
                            weight={weight}
                            exerciseLogId={currentExerciseLog?.id || null}
                            onRepsChange={setReps}
                            onWeightChange={setWeight}
                            onLogSet={handleLogSet}
                            onUpdateSet={handleUpdateSet}
                            onCancelEdit={() => {
                                setEditingSet(null);
                                setReps('');
                                setWeight('');
                            }}
                            onEditSet={handleEditSet}
                            onRequestDelete={handleRequestDelete}
                        />
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

            {/* Edit Confirmation Modal */}
            {showEditConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="glass-card p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-2">Edit This Set?</h3>
                        <p className="text-slate-400 mb-6">The set values have been loaded into the input fields. Make your changes and click "Update Set".</p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmEdit}
                                className="flex-1 px-4 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all"
                            >
                                OK
                            </button>
                            <button
                                onClick={cancelEdit}
                                className="flex-1 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-white rounded-lg font-semibold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="glass-card p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-2">Delete This Set?</h3>
                        <p className="text-slate-400 mb-6">Are you sure you want to delete this set? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                            >
                                Delete
                            </button>
                            <button
                                onClick={cancelDelete}
                                className="flex-1 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-white rounded-lg font-semibold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
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
