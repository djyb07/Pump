/**
 * RecentActivityFeed Component - Dashboard Recent Workouts
 * 
 * Displays the last 3 completed workouts with:
 * - Program/Day name
 * - Relative date (e.g., "2 days ago")
 * - Total volume
 * - Click navigation to workout details
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutService, type WorkoutLog } from '../../services/workoutService';
import { TrendingUp, Dumbbell, ChevronRight } from 'lucide-react';

interface RecentActivityFeedProps {
    mounted: boolean;
}

export function RecentActivityFeed({ mounted }: RecentActivityFeedProps) {
    const navigate = useNavigate();
    const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecentWorkouts();
    }, []);

    const loadRecentWorkouts = async () => {
        try {
            const workouts = await workoutService.getWorkoutHistory(3);
            setRecentWorkouts(workouts.filter(w => w.status === 'completed'));
        } catch (error) {
            console.error('Error loading recent workouts:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRelativeDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 14) return '1 week ago';
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const calculateTotalVolume = (workout: WorkoutLog) => {
        let total = 0;
        workout.exerciseLogs?.forEach(log => {
            const sets = log.sets as any[];
            sets?.forEach(set => {
                if (set.weight && set.reps) {
                    total += set.weight * set.reps;
                }
            });
        });
        return Math.round(total);
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '--';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-lime-400" />
                    Recent Activity
                </h3>
                <div className="glass-card p-6">
                    <div className="text-slate-400 text-center py-4">Loading recent workouts...</div>
                </div>
            </div>
        );
    }

    if (recentWorkouts.length === 0) {
        return (
            <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-lime-400" />
                    Recent Activity
                </h3>
                <div className="glass-card p-6">
                    <div className="text-center py-4">
                        <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No workouts yet</p>
                        <p className="text-slate-500 text-sm mt-1">Start your first workout to see it here!</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-lime-400" />
                    Recent Activity
                </h3>
                <button
                    onClick={() => navigate('/workout/history')}
                    className="flex items-center gap-1 text-slate-400 hover:text-lime-400 text-sm font-medium transition-colors"
                >
                    View All <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentWorkouts.map((workout) => {
                    const volume = calculateTotalVolume(workout);
                    const dayName = (workout as any).dayName || 'Custom Workout';
                    const programName = (workout as any).programName || '';

                    return (
                        <button
                            key={workout.id}
                            onClick={() => navigate(`/workout/${workout.id}`)}
                            className="glass-card p-4 text-left hover:border-lime-400/30 transition-all duration-200 hover:scale-[1.02] group"
                        >
                            {/* Day Name */}
                            <h4 className="font-semibold text-white group-hover:text-lime-400 transition-colors mb-1 truncate">
                                {dayName}
                            </h4>

                            {/* Program Name */}
                            {programName && (
                                <p className="text-slate-500 text-xs mb-3 truncate">
                                    {programName}
                                </p>
                            )}

                            {/* Stats Row */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">
                                    {getRelativeDate(workout.startTime)}
                                </span>
                                <span className="text-lime-400 font-medium">
                                    {volume > 0 ? `${volume.toLocaleString()} kg` : formatDuration(workout.duration)}
                                </span>
                            </div>

                            {/* Exercises Count */}
                            <div className="mt-2 pt-2 border-t border-white/5">
                                <span className="text-slate-500 text-xs">
                                    {workout.exerciseLogs?.length || 0} exercises
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
