import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workoutService, type WorkoutLog } from '../services/workoutService';

export default function WorkoutDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [workout, setWorkout] = useState<WorkoutLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadWorkout();
    }, [id]);

    const loadWorkout = async () => {
        if (!id) return;

        try {
            const data = await workoutService.getWorkoutById(id);
            setWorkout(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load workout');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '0 min';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const calculateTotalVolume = () => {
        if (!workout?.exerciseLogs) return 0;
        let total = 0;
        workout.exerciseLogs.forEach(log => {
            const sets = log.sets as any[];
            sets.forEach(set => {
                if (set.weight && set.reps) {
                    total += set.weight * set.reps;
                }
            });
        });
        return Math.round(total);
    };

    const getTotalSets = () => {
        if (!workout?.exerciseLogs) return 0;
        let total = 0;
        workout.exerciseLogs.forEach(log => {
            const sets = log.sets as any[];
            total += sets.length;
        });
        return total;
    };

    const getPRCount = () => {
        if (!workout?.exerciseLogs) return 0;
        let count = 0;
        workout.exerciseLogs.forEach(log => {
            if (log.isWeightPR || log.isVolumePR || log.isRepsPR) {
                count++;
            }
        });
        return count;
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
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">{error || 'Workout not found'}</div>
                    <button
                        onClick={() => navigate('/workout/history')}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                    >
                        ← Back to History
                    </button>
                </div>
            </div>
        );
    }

    const prCount = getPRCount();
    const totalVolume = calculateTotalVolume();
    const totalSets = getTotalSets();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                {workout.day?.name || workout.customName || 'Workout Details'}
                            </h1>
                            <p className="text-gray-400 mt-1">
                                {formatDate(workout.startTime)} • {formatTime(workout.startTime)}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/workout/history')}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                        >
                            ← Back to History
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-2">Duration</div>
                        <div className="text-3xl font-bold text-white">
                            {formatDuration(workout.duration)}
                        </div>
                    </div>
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-2">Exercises</div>
                        <div className="text-3xl font-bold text-white">
                            {workout.exerciseLogs?.length || 0}
                        </div>
                    </div>
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-2">Total Sets</div>
                        <div className="text-3xl font-bold text-white">{totalSets}</div>
                    </div>
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                        <div className="text-gray-400 text-sm mb-2">Total Volume</div>
                        <div className="text-3xl font-bold text-white">
                            {totalVolume.toLocaleString()} kg
                        </div>
                    </div>
                </div>

                {/* PRs Banner */}
                {prCount > 0 && (
                    <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border border-yellow-500/50 rounded-xl p-6 mb-8">
                        <div className="flex items-center space-x-3">
                            <span className="text-4xl">🏆</span>
                            <div>
                                <h2 className="text-2xl font-bold text-yellow-400">
                                    {prCount} Personal Record{prCount > 1 ? 's' : ''} Achieved!
                                </h2>
                                <p className="text-yellow-200/80">Great job! You hit new PRs in this workout.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Program Info */}
                {workout.day?.program && (
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
                        <h3 className="text-lg font-semibold text-white mb-2">Program</h3>
                        <p className="text-gray-300">{workout.day.program.name}</p>
                    </div>
                )}

                {/* Exercise Logs */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Exercises</h2>

                    {workout.exerciseLogs?.map((exerciseLog, index) => {
                        const sets = exerciseLog.sets as any[];
                        const hasPR = exerciseLog.isWeightPR || exerciseLog.isVolumePR || exerciseLog.isRepsPR;
                        const prTypes = [];
                        if (exerciseLog.isWeightPR) prTypes.push('Weight');
                        if (exerciseLog.isVolumePR) prTypes.push('Volume');
                        if (exerciseLog.isRepsPR) prTypes.push('Reps');

                        return (
                            <div
                                key={exerciseLog.id}
                                className={`bg-gray-900/50 backdrop-blur-sm border ${hasPR ? 'border-yellow-500/50' : 'border-gray-800'
                                    } rounded-xl p-6`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">
                                            {index + 1}. {(exerciseLog as any).exerciseName || 'Unknown Exercise'}
                                        </h3>
                                        {hasPR && (
                                            <div className="flex items-center space-x-2 mt-2">
                                                <span className="text-yellow-500 text-lg">🏆</span>
                                                <span className="text-yellow-400 font-semibold text-sm">
                                                    PR: {prTypes.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gray-400 text-sm">Sets</div>
                                        <div className="text-2xl font-bold text-white">{sets.length}</div>
                                    </div>
                                </div>

                                {/* Sets Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="text-left text-gray-400 text-sm font-medium py-2 px-3">Set</th>
                                                <th className="text-right text-gray-400 text-sm font-medium py-2 px-3">Weight (kg)</th>
                                                <th className="text-right text-gray-400 text-sm font-medium py-2 px-3">Reps</th>
                                                <th className="text-right text-gray-400 text-sm font-medium py-2 px-3">Volume</th>
                                                <th className="text-center text-gray-400 text-sm font-medium py-2 px-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sets.map((set: any, setIndex: number) => (
                                                <tr key={setIndex} className="border-b border-gray-800/50">
                                                    <td className="text-gray-300 py-3 px-3">{set.setNumber || setIndex + 1}</td>
                                                    <td className="text-white font-semibold text-right py-3 px-3">
                                                        {set.weight || '-'}
                                                    </td>
                                                    <td className="text-white font-semibold text-right py-3 px-3">
                                                        {set.reps}
                                                    </td>
                                                    <td className="text-gray-300 text-right py-3 px-3">
                                                        {set.weight && set.reps ? `${(set.weight * set.reps).toFixed(0)} kg` : '-'}
                                                    </td>
                                                    <td className="text-center py-3 px-3">
                                                        {set.completed !== false ? (
                                                            <span className="text-green-500">✓</span>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {exerciseLog.notes && (
                                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                                        <div className="text-gray-400 text-sm mb-1">Notes</div>
                                        <div className="text-white">{exerciseLog.notes}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Workout Notes */}
                {workout.notes && (
                    <div className="mt-8 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Workout Notes</h3>
                        <p className="text-gray-300">{workout.notes}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
