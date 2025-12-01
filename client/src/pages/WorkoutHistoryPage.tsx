import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutService, type WorkoutLog } from '../services/workoutService';
import { useToast } from '../contexts/ToastContext';
import { useToast } from '../contexts/ToastContext';

export default function WorkoutHistoryPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter state
    const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('all');
    const [selectedProgram, setSelectedProgram] = useState('all');
    const [selectedExercise, setSelectedExercise] = useState('all');
    const [showOnlyPRs, setShowOnlyPRs] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const history = await workoutService.getWorkoutHistory(50);
            setWorkouts(history);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load workout history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '0 min';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const calculateTotalVolume = (workout: WorkoutLog) => {
        let total = 0;
        workout.exerciseLogs?.forEach(log => {
            const sets = log.sets as any[];
            sets.forEach(set => {
                if (set.weight && set.reps) {
                    total += set.weight * set.reps;
                }
            });
        });
        return Math.round(total);
    };

    const getTotalSets = (workout: WorkoutLog) => {
        let total = 0;
        workout.exerciseLogs?.forEach(log => {
            const sets = log.sets as any[];
            total += sets.length;
        });
        return total;
    };

    const getPRCount = (workout: WorkoutLog) => {
        let count = 0;
        workout.exerciseLogs?.forEach(log => {
            if (log.isWeightPR || log.isVolumePR || log.isRepsPR) {
                count++;
            }
        });
        return count;
    };

    // Get unique programs
    const uniquePrograms = useMemo(() => {
        const programs = new Map<string, string>();
        workouts.forEach(workout => {
            if (workout.programId && (workout as any).programName) {
                programs.set(workout.programId, (workout as any).programName);
            }
        });
        return Array.from(programs, ([id, name]) => ({ id, name }));
    }, [workouts]);

    // Get unique exercises
    const uniqueExercises = useMemo(() => {
        const exercises = new Map<string, string>();
        workouts.forEach(workout => {
            workout.exerciseLogs?.forEach(log => {
                const exerciseId = (log as any).exerciseId;
                const exerciseName = (log as any).exerciseName;
                if (exerciseId && exerciseName) {
                    exercises.set(exerciseId, exerciseName);
                }
            });
        });
        return Array.from(exercises, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [workouts]);

    // Apply filters
    const filteredWorkouts = useMemo(() => {
        let filtered = [...workouts];

        // Date range filter
        if (dateRange !== 'all') {
            const days = parseInt(dateRange);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            filtered = filtered.filter(w => new Date(w.startTime) >= cutoffDate);
        }

        // Program filter
        if (selectedProgram !== 'all') {
            filtered = filtered.filter(w => w.programId === selectedProgram);
        }

        // Exercise filter
        if (selectedExercise !== 'all') {
            filtered = filtered.filter(w =>
                w.exerciseLogs?.some(log => (log as any).exerciseId === selectedExercise)
            );
        }

        // PR filter
        if (showOnlyPRs) {
            filtered = filtered.filter(w => getPRCount(w) > 0);
        }

        return filtered;
    }, [workouts, dateRange, selectedProgram, selectedExercise, showOnlyPRs]);

    const hasActiveFilters = dateRange !== 'all' || selectedProgram !== 'all' || selectedExercise !== 'all' || showOnlyPRs;

    const clearFilters = () => {
        setDateRange('all');
        setSelectedProgram('all');
        setSelectedExercise('all');
        setShowOnlyPRs(false);
    };
    const handleDeleteWorkout = async (workoutId: string) => {
        try {
            await workoutService.deleteWorkout(workoutId);
            showToast('success', 'Workout deleted successfully');
            loadHistory();
            setDeleteConfirmId(null);
        } catch (err: any) {
            console.error('Error deleting workout:', err);
            showToast('error', err.response?.data?.error || 'Failed to delete workout');
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 flex items-center justify-center">
                <div className="text-white text-xl">Loading history...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Workout History</h1>
                            <p className="text-gray-400 mt-1">
                                {filteredWorkouts.length} {filteredWorkouts.length === 1 ? 'workout' : 'workouts'}
                                {hasActiveFilters && ` (filtered from ${workouts.length})`}
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => navigate('/personal-records')}
                                className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg font-semibold transition-all">
                                🏆 Personal Records
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all">
                                ← Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-gray-800/50 border-b border-gray-700 md:sticky md:top-[89px] z-10 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Date Range Filter */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">📅 Date Range</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                                <option value="all">All Time</option>
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                            </select>
                        </div>

                        {/* Program Filter */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">🏋️ Program</label>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                                <option value="all">All Programs</option>
                                {uniquePrograms.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Exercise Filter */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">💪 Exercise</label>
                            <select
                                value={selectedExercise}
                                onChange={(e) => setSelectedExercise(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                                <option value="all">All Exercises</option>
                                {uniqueExercises.map(ex => (
                                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* PR Filter */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">🏆 PRs Only</label>
                            <button
                                onClick={() => setShowOnlyPRs(!showOnlyPRs)}
                                className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${showOnlyPRs
                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                    : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700'
                                    }`}>
                                {showOnlyPRs ? '✓ PRs Only' : 'Show All'}
                            </button>
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-gray-400 text-sm">
                                {filteredWorkouts.length} result{filteredWorkouts.length !== 1 ? 's' : ''} found
                            </span>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-semibold transition-all">
                                ✕ Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                        {error}
                    </div>
                )}

                {filteredWorkouts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">💪</div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {hasActiveFilters ? 'No workouts match your filters' : 'No workouts yet!'}
                        </h2>
                        <p className="text-gray-400 mb-6">
                            {hasActiveFilters
                                ? 'Try adjusting your filters or clear them to see all workouts'
                                : 'Start your first workout to see it here'
                            }
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all">
                                Clear Filters
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/programs')}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold transition-all">
                                Go to Programs
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredWorkouts.map((workout) => {
                            const prCount = getPRCount(workout);
                            const volume = calculateTotalVolume(workout);
                            const sets = getTotalSets(workout);

                            return (
                                <div
                                    key={workout.id}
                                    onClick={() => navigate(`/workout/${workout.id}`)}
                                    className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">
                                                {(workout as any).dayName || 'Custom Workout'}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {(workout as any).programName || 'Ad-hoc workout'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <div className="text-white font-semibold">
                                                    {formatDate(workout.startTime)}
                                                </div>
                                                <div className="text-gray-400 text-sm">
                                                    {formatDuration(workout.duration)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirmId(workout.id);
                                                }}
                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete workout"
                                            >
                                                🗑️
                                            </button>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <div className="text-gray-400 text-sm mb-1">Exercises</div>
                                            <div className="text-white font-bold text-lg">
                                                {workout.exerciseLogs?.length || 0}
                                            </div>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <div className="text-gray-400 text-sm mb-1">Total Sets</div>
                                            <div className="text-white font-bold text-lg">{sets}</div>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <div className="text-gray-400 text-sm mb-1">Volume</div>
                                            <div className="text-white font-bold text-lg">
                                                {volume.toLocaleString()} kg
                                            </div>
                                        </div>
                                    </div>

                                    {prCount > 0 && (
                                        <div className="mt-4 flex items-center space-x-2">
                                            <span className="text-yellow-500 text-xl">🏆</span>
                                            <span className="text-yellow-400 font-semibold">
                                                {prCount} Personal Record{prCount > 1 ? 's' : ''}!
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <p className="text-white text-lg mb-4">
                            Are you sure you want to delete this workout?
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteWorkout(deleteConfirmId)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
