import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { programService, type WorkoutProgram, type DayExercise } from '../services/programService';
import { exerciseService, type Exercise } from '../services/exerciseService';
import EditExerciseModal from '../components/EditExerciseModal';
import AddDayModal from '../components/AddDayModal';
import ConfirmModal from '../components/ConfirmModal';

export default function ProgramDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [program, setProgram] = useState<WorkoutProgram | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [selectedDayId, setSelectedDayId] = useState<string>('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [editingExercise, setEditingExercise] = useState<DayExercise | null>(null);
    const [showAddDayModal, setShowAddDayModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    useEffect(() => {
        if (id) {
            loadProgram();
        }
    }, [id]);

    const loadProgram = async () => {
        try {
            setLoading(true);
            const data = await programService.getProgramById(id!);
            setProgram(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load program');
        } finally {
            setLoading(false);
        }
    };

    const handleAddExercise = async (dayId: string) => {
        setSelectedDayId(dayId);
        try {
            const allExercises = await exerciseService.getAll();
            setExercises(allExercises);
            setShowExerciseModal(true);
        } catch (err) {
            setError('Failed to load exercises');
        }
    };

    const handleSelectExercise = async (exerciseId: string) => {
        try {
            await programService.addExerciseToDay(selectedDayId, {
                exerciseId,
                targetSets: 3,
                targetReps: 10
            });
            setShowExerciseModal(false);
            await loadProgram();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add exercise');
        }
    };

    const handleRemoveExercise = async (exerciseId: string) => {
        setConfirmAction({
            title: 'Remove Exercise',
            message: 'Are you sure you want to remove this exercise from the day?',
            onConfirm: async () => {
                try {
                    await programService.removeDayExercise(exerciseId);
                    await loadProgram();
                } catch (err: any) {
                    setError(err.response?.data?.error || 'Failed to remove exercise');
                }
            }
        });
    };

    const handleDeleteProgram = async () => {
        setConfirmAction({
            title: 'Delete Program',
            message: 'Are you sure you want to delete this program? This action cannot be undone and all associated data will be permanently removed.',
            onConfirm: async () => {
                try {
                    await programService.deleteProgram(id!);
                    navigate('/programs');
                } catch (err: any) {
                    setError(err.response?.data?.error || 'Failed to delete program');
                }
            }
        });
    };

    const handleAddDay = async (dayName: string) => {
        try {
            await programService.addDay(id!, { name: dayName });
            await loadProgram();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add day');
        }
    };

    const handleDeleteDay = async (dayId: string) => {
        setConfirmAction({
            title: 'Delete Day',
            message: 'Are you sure you want to delete this day? All exercises in this day will be removed.',
            onConfirm: async () => {
                try {
                    await programService.deleteDay(dayId);
                    await loadProgram();
                } catch (err: any) {
                    setError(err.response?.data?.error || 'Failed to delete day');
                }
            }
        });
    };

    const handleEditExercise = (dayEx: DayExercise) => {
        setEditingExercise(dayEx);
    };

    const handleSaveExercise = async (data: { targetSets: number; targetReps: number; targetWeight?: number }) => {
        if (!editingExercise) return;
        try {
            await programService.updateDayExercise(editingExercise.id, data);
            setEditingExercise(null);
            await loadProgram();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update exercise');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
                <div className="text-white text-xl">Loading program...</div>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
                <div className="text-white text-xl">Program not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
            {/* Background orbs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => navigate('/programs')}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ← Back
                                </button>
                                <h1 className="text-2xl font-bold text-white">{program.name}</h1>
                                {program.isActive && (
                                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
                                        Active
                                    </span>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowAddDayModal(true)}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200"
                                >
                                    + Add Day
                                </button>
                                <button
                                    onClick={handleDeleteProgram}
                                    className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 rounded-lg font-semibold transition-all duration-200 border border-red-700"
                                >
                                    Delete Program
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {error && (
                        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                            {error}
                        </div>
                    )}

                    {/* Days */}
                    <div className="space-y-6">
                        {program.days?.map((day) => (
                            <div
                                key={day.id}
                                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6"
                            >
                                {/* Day Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{day.name}</h2>
                                        <p className="text-gray-400 text-sm">{day.exercises?.length || 0} exercises</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => navigate(`/workout/active?dayId=${day.id}`)}
                                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold transition-all duration-200 transform hover:scale-105"
                                        >
                                            ▶️ Start Workout
                                        </button>
                                        <button
                                            onClick={() => handleAddExercise(day.id)}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200"
                                        >
                                            + Add Exercise
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDay(day.id)}
                                            className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg font-semibold transition-all duration-200"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {/* Exercises */}
                                {day.exercises && day.exercises.length > 0 ? (
                                    <div className="space-y-3">
                                        {day.exercises.map((dayEx: DayExercise) => (
                                            <div
                                                key={dayEx.id}
                                                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white">{dayEx.exercise?.nameEn}</h3>
                                                    <p className="text-gray-400 text-sm">
                                                        {dayEx.targetSets} sets × {dayEx.targetReps} reps
                                                        {dayEx.targetWeight && ` @ ${dayEx.targetWeight}kg`}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditExercise(dayEx)}
                                                        className="text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded hover:bg-purple-500/10"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveExercise(dayEx.id)}
                                                        className="text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No exercises yet. Click "Add Exercise" to get started.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Exercise Selection Modal */}
            {showExerciseModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white">Select Exercise</h2>
                                <button
                                    onClick={() => setShowExerciseModal(false)}
                                    className="text-gray-400 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Exercise List */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {exercises.map((exercise) => (
                                    <div
                                        key={exercise.id}
                                        onClick={() => handleSelectExercise(exercise.id)}
                                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500 cursor-pointer transition-all duration-200 hover:scale-102"
                                    >
                                        <h3 className="font-semibold text-white mb-1">{exercise.nameEn}</h3>
                                        <p className="text-gray-400 text-sm mb-2">{exercise.muscleGroups.join(', ')}</p>
                                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                            {exercise.difficulty}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Exercise Modal */}
            {editingExercise && (
                <EditExerciseModal
                    dayExercise={editingExercise}
                    onSave={handleSaveExercise}
                    onClose={() => setEditingExercise(null)}
                />
            )}

            {/* Add Day Modal */}
            {showAddDayModal && (
                <AddDayModal
                    onAdd={handleAddDay}
                    onClose={() => setShowAddDayModal(false)}
                />
            )}

            {/* Confirm Modal */}
            {confirmAction && (
                <ConfirmModal
                    title={confirmAction.title}
                    message={confirmAction.message}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={confirmAction.onConfirm}
                    onCancel={() => setConfirmAction(null)}
                    danger={true}
                />
            )}
        </div>
    );
}
