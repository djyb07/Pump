import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutService, type WorkoutLog } from '../services/workoutService';

export default function WorkoutHistoryPage() {
    const navigate = useNavigate();
    const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                            <h1 className="text-3xl font-bold text-white">Workout History</h1>
                            <p className="text-gray-400 mt-1">{workouts.length} completed workouts</p>
                        </div>
                        <button
                            onClick={() => navigate('/programs')}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                        >
                            ← Back to Programs
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                        {error}
                    </div>
                )}

                {workouts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">💪</div>
                        <h2 className="text-2xl font-bold text-white mb-2">No workouts yet!</h2>
                        <p className="text-gray-400 mb-6">Start your first workout to see it here</p>
                        <button
                            onClick={() => navigate('/programs')}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold transition-all"
                        >
                            Go to Programs
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workouts.map((workout) => {
                            const prCount = getPRCount(workout);
                            const volume = calculateTotalVolume(workout);
                            const sets = getTotalSets(workout);

                            return (
                                <div
                                    key={workout.id}
                                    onClick={() => navigate(`/workout/${workout.id}`)}
                                    className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">
                                                {(workout as any).dayName || 'Custom Workout'}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {(workout as any).programName || 'Ad-hoc workout'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white font-semibold">
                                                {formatDate(workout.startTime)}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                {formatDuration(workout.duration)}
                                            </div>
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
        </div>
    );
}
