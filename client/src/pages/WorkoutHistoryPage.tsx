import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutService, type WorkoutLog } from '../services/workoutService';
import { UnifiedPageHeader, SmartFilterBar } from '../components/layout';
import type { FilterConfig, ToggleConfig } from '../components/layout';
import { History, Trophy, Calendar, Dumbbell, Trash2 } from 'lucide-react';

export default function WorkoutHistoryPage() {
    const navigate = useNavigate();
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
            if (log.isWeightPR) count++;
            if (log.isVolumePR) count++;
            if (log.isRepsPR) count++;
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
            loadHistory();
            setDeleteConfirmId(null);
        } catch (err: any) {
            console.error('Error deleting workout:', err);
            alert('Failed to delete workout');
        }
    };

    // Build SmartFilterBar config
    const filters: FilterConfig[] = [
        {
            label: 'Date Range',
            icon: Calendar,
            value: dateRange,
            onChange: (val) => setDateRange(val as any),
            options: [
                { value: 'all', label: 'All Time' },
                { value: '7', label: 'Last 7 Days' },
                { value: '30', label: 'Last 30 Days' },
                { value: '90', label: 'Last 90 Days' },
            ],
        },
        {
            label: 'Program',
            icon: Dumbbell,
            value: selectedProgram,
            onChange: setSelectedProgram,
            options: [
                { value: 'all', label: 'All Programs' },
                ...uniquePrograms.map(p => ({ value: p.id, label: p.name })),
            ],
        },
        {
            label: 'Exercise',
            icon: Dumbbell,
            value: selectedExercise,
            onChange: setSelectedExercise,
            options: [
                { value: 'all', label: 'All Exercises' },
                ...uniqueExercises.map(ex => ({ value: ex.id, label: ex.name })),
            ],
        },
    ];

    const toggles: ToggleConfig[] = [
        {
            label: 'PRs Only',
            icon: Trophy,
            active: showOnlyPRs,
            onToggle: () => setShowOnlyPRs(!showOnlyPRs),
            activeColor: 'yellow',
        },
    ];


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-200 text-xl">Loading history...</div>
            </div>
        );
    }

    return (
        <div className="relative z-10">
            <UnifiedPageHeader
                title="Workout History"
                subtitle={`${filteredWorkouts.length} ${filteredWorkouts.length === 1 ? 'workout' : 'workouts'}${hasActiveFilters ? ` (filtered from ${workouts.length})` : ''}`}
                icon={History}
                rightContent={
                    <button
                        onClick={() => navigate('/personal-records')}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 rounded-lg font-semibold transition-all text-sm">
                        <Trophy className="w-4 h-4" /> Personal Records
                    </button>
                }
            />

            {/* SmartFilterBar (sticky, sticks on scroll) */}
            <SmartFilterBar
                searchValue=""
                onSearchChange={() => { }}
                searchPlaceholder="Search workouts..."
                filters={filters}
                toggles={toggles}
                resultCount={filteredWorkouts.length}
                totalCount={workouts.length}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
            />


            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                        {error}
                    </div>
                )}

                {filteredWorkouts.length === 0 ? (
                    <div className="text-center py-12">
                        <Dumbbell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {hasActiveFilters ? 'No workouts match your filters' : 'No workouts yet!'}
                        </h2>
                        <p className="text-slate-400 mb-6">
                            {hasActiveFilters
                                ? 'Try adjusting your filters or clear them to see all workouts'
                                : 'Start your first workout to see it here'
                            }
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-bold transition-all">
                                Clear Filters
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/programs')}
                                className="px-6 py-3 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-bold transition-all">
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
                                    className="glass-card p-6 hover:border-lime-400/30 transition-all cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">
                                                {(workout as any).dayName || 'Custom Workout'}
                                            </h3>
                                            <p className="text-slate-400 text-sm">
                                                {(workout as any).programName || 'Ad-hoc workout'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <div className="text-white font-semibold">
                                                    {formatDate(workout.startTime)}
                                                </div>
                                                <div className="text-slate-400 text-sm">
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
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-slate-800/50 rounded-lg p-3">
                                            <div className="text-slate-400 text-sm mb-1">Exercises</div>
                                            <div className="text-white font-bold text-lg">
                                                {workout.exerciseLogs?.length || 0}
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded-lg p-3">
                                            <div className="text-slate-400 text-sm mb-1">Total Sets</div>
                                            <div className="text-white font-bold text-lg">{sets}</div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded-lg p-3">
                                            <div className="text-slate-400 text-sm mb-1">Volume</div>
                                            <div className="text-white font-bold text-lg">
                                                {volume.toLocaleString()} kg
                                            </div>
                                        </div>
                                    </div>

                                    {prCount > 0 && (
                                        <div className="mt-4 flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-yellow-500" />
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
                    <div className="glass-card p-6">
                        <p className="text-white text-lg mb-4">
                            Are you sure you want to delete this workout?
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="bg-slate-700/60 hover:bg-slate-600/60 text-white px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteWorkout(deleteConfirmId)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
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
