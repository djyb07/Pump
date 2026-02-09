import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { programService, type WorkoutProgram, type DayExercise } from '../services/programService';
import { exerciseService, type Exercise } from '../services/exerciseService';
import EditExerciseModal from '../components/EditExerciseModal';
import AddDayModal from '../components/AddDayModal';
import ConfirmModal from '../components/ConfirmModal';
import ExerciseModal from '../components/ExerciseModal';
import { UnifiedPageHeader } from '../components/layout';

export default function ProgramDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [program, setProgram] = useState<WorkoutProgram | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [selectedDayId, setSelectedDayId] = useState<string>('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [editingExercise, setEditingExercise] = useState<DayExercise | null>(null);
    const [showAddDayModal, setShowAddDayModal] = useState(false);
    const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<Exercise | null>(null);
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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-200 text-xl">Loading program...</div>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-200 text-xl">Program not found</div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden">
            {/* Background subtle glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <UnifiedPageHeader
                    title={program.name}
                    subtitle={program.isActive ? '✅ Active Program' : `${program.days?.length || 0} days`}
                    showBackButton
                    rightContent={
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowAddDayModal(true)}
                                className="px-4 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all duration-200 text-sm">
                                + Add Day
                            </button>
                            <button
                                onClick={handleDeleteProgram}
                                className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 rounded-lg font-semibold transition-all duration-200 border border-red-700 text-sm">
                                Delete
                            </button>
                        </div>
                    }
                />

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
                                className="glass-card p-6"
                            >
                                {/* Day Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{day.name}</h2>
                                        <p className="text-slate-400 text-sm">{day.exercises?.length || 0} exercises</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => navigate(`/workout/active?dayId=${day.id}`)}
                                            disabled={!day.exercises || day.exercises.length === 0}
                                            className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${!day.exercises || day.exercises.length === 0
                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
                                                    : 'bg-lime-400 hover:bg-lime-500 text-slate-950 transform hover:scale-105'
                                                }`}
                                        >
                                            {!day.exercises || day.exercises.length === 0 ? '⏸️ No Exercises' : '▶️ Start Workout'}
                                        </button>
                                        <button
                                            onClick={() => handleAddExercise(day.id)}
                                            className="px-4 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-white rounded-lg font-semibold transition-all duration-200"
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
                                                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-white/5 hover:border-lime-400/30 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white">{dayEx.exercise?.nameEn}</h3>
                                                    <p className="text-slate-400 text-sm">
                                                        {dayEx.targetSets} sets × {dayEx.targetReps} reps
                                                        {dayEx.targetWeight && ` @ ${dayEx.targetWeight}kg`}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={async () => {
                                                            const ex = await exerciseService.getById(dayEx.exerciseId);
                                                            setSelectedExerciseInfo(ex);
                                                        }}
                                                        className="text-lime-400 hover:text-lime-300 transition-colors px-2 py-1 rounded hover:bg-lime-500/10"
                                                        title="Exercise Info"
                                                    >
                                                        ℹ️
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/exercise/${dayEx.exerciseId}/progress`)}
                                                        className="text-lime-400 hover:text-lime-300 transition-colors px-2 py-1 rounded hover:bg-lime-500/10"
                                                        title="View Progress"
                                                    >
                                                        📊
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditExercise(dayEx)}
                                                        className="text-lime-400 hover:text-lime-300 transition-colors px-2 py-1 rounded hover:bg-lime-500/10"
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
                                    <div className="text-center py-8 text-slate-500">
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
                    <div className="glass-card-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white">Select Exercise</h2>
                                <button
                                    onClick={() => setShowExerciseModal(false)}
                                    className="text-slate-400 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            {/* Search Bar */}
                            <input
                                type="text"
                                placeholder="Search exercises..."
                                value={exerciseSearch}
                                onChange={(e) => setExerciseSearch(e.target.value)}
                                className="w-full px-4 py-3 mt-4 bg-slate-800/60 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                            />
                        </div>

                        {/* Exercise List */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {exercises
                                    .filter(ex =>
                                        exerciseSearch === '' ||
                                        ex.nameEn.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                                        ex.muscleGroups.some(mg => mg.toLowerCase().includes(exerciseSearch.toLowerCase()))
                                    )
                                    .map((exercise) => (
                                        <div
                                            key={exercise.id}
                                            className="p-4 bg-slate-800/50 rounded-lg border border-white/5 hover:border-lime-400/30 transition-all duration-200"
                                        >
                                            <div
                                                onClick={() => handleSelectExercise(exercise.id)}
                                                className="cursor-pointer"
                                            >
                                                <h3 className="font-semibold text-white mb-1">{exercise.nameEn}</h3>
                                                <p className="text-slate-400 text-sm mb-2">{exercise.muscleGroups.join(', ')}</p>
                                                <span className="text-xs px-2 py-1 bg-lime-400/20 text-lime-400 rounded">
                                                    {exercise.difficulty}
                                                </span>
                                            </div>
                                            <div className="flex space-x-2 mt-3 pt-3 border-t border-white/5">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedExerciseInfo(exercise);
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-white rounded-lg font-semibold transition-all text-sm"
                                                >
                                                    ℹ️ Info
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/exercise/${exercise.id}/progress`);
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all text-sm"
                                                >
                                                    📊 Progress
                                                </button>
                                            </div>
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

            {/* Exercise Info Modal */}
            <ExerciseModal
                exercise={selectedExerciseInfo}
                isOpen={!!selectedExerciseInfo}
                onClose={() => setSelectedExerciseInfo(null)}
            />
        </div>
    );
}
