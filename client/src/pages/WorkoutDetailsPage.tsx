import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workoutService, type WorkoutLog } from '../services/workoutService';
import { UnifiedPageHeader } from '../components/layout';
import { Dumbbell, Trophy, BarChart3, Check, ChevronLeft, ThermometerSun, Layers, AlertCircle } from 'lucide-react';

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
            if (log.isWeightPR) count++;
            if (log.isVolumePR) count++;
            if (log.isRepsPR) count++;
        });
        return count;
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
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">{error || 'Workout not found'}</div>
                    <button
                        onClick={() => navigate('/workout/history')}
                        className="flex items-center gap-2 px-6 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to History
                    </button>
                </div>
            </div>
        );
    }

    const prCount = getPRCount();
    const totalVolume = calculateTotalVolume();
    const totalSets = getTotalSets();

    return (
        <div className="relative z-10">
            <UnifiedPageHeader
                title={(workout as any).dayName || 'Workout Details'}
                subtitle={`${formatDate(workout.startTime)} • ${formatTime(workout.startTime)}`}
                showBackButton
                icon={Dumbbell}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-6">
                        <div className="text-slate-400 text-sm mb-2">Duration</div>
                        <div className="text-3xl font-bold text-white">
                            {formatDuration(workout.duration)}
                        </div>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-slate-400 text-sm mb-2">Exercises</div>
                        <div className="text-3xl font-bold text-white">
                            {workout.exerciseLogs?.length || 0}
                        </div>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-slate-400 text-sm mb-2">Total Sets</div>
                        <div className="text-3xl font-bold text-white">{totalSets}</div>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-slate-400 text-sm mb-2">Total Volume</div>
                        <div className="text-3xl font-bold text-white">
                            {totalVolume.toLocaleString()} kg
                        </div>
                    </div>
                </div>

                {/* PRs Banner */}
                {prCount > 0 && (
                    <div className="bg-lime-400/10 border border-lime-400/30 rounded-xl p-6 mb-8">
                        <div className="flex items-center gap-4">
                            <Trophy className="w-10 h-10 text-lime-400" />
                            <div>
                                <h2 className="text-2xl font-bold text-lime-400">
                                    {prCount} Personal Record{prCount > 1 ? 's' : ''} Achieved!
                                </h2>
                                <p className="text-lime-300/80">Great job! You hit new PRs in this workout.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Program Info */}
                {(workout as any).programName && (
                    <div className="glass-card p-6 mb-8">
                        <h3 className="text-lg font-semibold text-white mb-2">Program</h3>
                        <p className="text-slate-300">{(workout as any).programName}</p>
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
                                className={`glass-card ${hasPR ? 'border-lime-400/30' : ''} p-6`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <button
                                            onClick={() => {
                                                const exerciseId = (exerciseLog as any).exerciseId;
                                                if (exerciseId) {
                                                    navigate(`/exercise/${exerciseId}/progress`);
                                                }
                                            }}
                                            className="flex items-center gap-2 text-xl font-bold text-white mb-1 hover:text-lime-400 transition-colors text-left"
                                        >
                                            {index + 1}. {(exerciseLog as any).exerciseName || 'Unknown Exercise'} <BarChart3 className="w-5 h-5 text-slate-400" />
                                        </button>
                                        {hasPR && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <Trophy className="w-5 h-5 text-lime-400" />
                                                <span className="text-lime-400 font-semibold text-sm">
                                                    PR: {prTypes.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-slate-400 text-sm">Sets</div>
                                        <div className="text-2xl font-bold text-white">{sets.length}</div>
                                    </div>
                                </div>

                                {/* Sets Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="text-left text-slate-400 text-sm font-medium py-2 px-3">Set</th>
                                                <th className="text-right text-slate-400 text-sm font-medium py-2 px-3">Weight (kg)</th>
                                                <th className="text-right text-slate-400 text-sm font-medium py-2 px-3">Reps</th>
                                                <th className="text-right text-slate-400 text-sm font-medium py-2 px-3">Volume</th>
                                                <th className="text-right text-slate-400 text-sm font-medium py-2 px-3">RPE</th>
                                                <th className="text-center text-slate-400 text-sm font-medium py-2 px-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sets.map((set: any, setIndex: number) => {
                                                const setTypeBadge = () => {
                                                    const t = set.type || 'NORMAL';
                                                    if (t === 'WARMUP') return (
                                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 ml-2">
                                                            <ThermometerSun className="w-3 h-3" />Warmup
                                                        </span>
                                                    );
                                                    if (t === 'DROP') return (
                                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20 ml-2">
                                                            <Layers className="w-3 h-3" />Drop
                                                        </span>
                                                    );
                                                    if (t === 'FAILURE') return (
                                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium bg-red-500/10 text-red-500 border border-red-500/20 ml-2">
                                                            <AlertCircle className="w-3 h-3" />Failure
                                                        </span>
                                                    );
                                                    return null;
                                                };

                                                return (
                                                    <tr key={setIndex} className="border-b border-white/5">
                                                        <td className="text-slate-300 py-3 px-3">
                                                            <span className="inline-flex items-center">
                                                                {set.setNumber || setIndex + 1}
                                                                {setTypeBadge()}
                                                            </span>
                                                        </td>
                                                        <td className="text-white font-semibold text-right py-3 px-3">
                                                            {set.weight || '-'}
                                                        </td>
                                                        <td className="text-white font-semibold text-right py-3 px-3">
                                                            {set.reps}
                                                        </td>
                                                        <td className="text-slate-300 text-right py-3 px-3">
                                                            {set.weight && set.reps ? `${(set.weight * set.reps).toFixed(0)} kg` : '-'}
                                                        </td>
                                                        <td className="text-right py-3 px-3">
                                                            {set.rpe ? (
                                                                <span className="text-xs text-slate-500 font-mono tracking-tighter">RPE {set.rpe}</span>
                                                            ) : (
                                                                <span className="text-slate-600">—</span>
                                                            )}
                                                        </td>
                                                        <td className="text-center py-3 px-3">
                                                            {set.completed !== false ? (
                                                                <Check className="w-4 h-4 text-lime-400 mx-auto" />
                                                            ) : (
                                                                <span className="text-slate-500">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {exerciseLog.notes && (
                                    <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                                        <div className="text-slate-400 text-sm mb-1">Notes</div>
                                        <div className="text-white">{exerciseLog.notes}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Workout Notes */}
                {workout.notes && (
                    <div className="mt-8 glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Workout Notes</h3>
                        <p className="text-slate-300">{workout.notes}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
