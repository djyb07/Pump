/**
 * useDashboard Hook
 * 
 * Custom hook that handles all data fetching and business logic for the Dashboard.
 * Extracts logic from Dashboard component for better separation of concerns.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import type {
    Program,
    WorkoutDay,
    WorkoutLog,
    ExercisePR,
    WeekStats,
    UserInfo,
    ProcessedPR
} from '../types/dashboard';

const DEFAULT_STATS: WeekStats = { workouts: 0, volume: 0, sets: 0, prs: 0 };

export function useDashboard() {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Data state
    const [recentPRs, setRecentPRs] = useState<ExercisePR[]>([]);
    const [activeProgram, setActiveProgram] = useState<Program | null>(null);
    const [nextWorkout, setNextWorkout] = useState<WorkoutDay | null>(null);
    const [weekStats, setWeekStats] = useState<WeekStats>(DEFAULT_STATS);
    const [lastWeekStats, setLastWeekStats] = useState<WeekStats>(DEFAULT_STATS);

    const [liveUserStats, setLiveUserStats] = useState<{
        avatarUrl?: string;
        totalWorkouts: number;
        currentStreak: number;
    }>({ totalWorkouts: 0, currentStreak: 0 });

    useEffect(() => {
        setMounted(true);
        loadDashboardData();
    }, []);

    // ==================== Data Fetching ====================

    const loadDashboardData = async () => {
        try {
            const [programsData, workoutsData, prsData, meData] = await Promise.all([
                apiClient.get('/api/programs'),
                apiClient.get('/api/workouts?limit=50'),
                apiClient.get('/api/analytics/personal-records'),
                apiClient.get('/api/auth/me').catch(() => null)
            ]);

            setRecentPRs(prsData.data);
            processActiveProgram(programsData.data, workoutsData.data);
            processWeekStats(workoutsData.data);

            if (meData?.data?.user) {
                setLiveUserStats({
                    avatarUrl: meData.data.user.avatarUrl || undefined,
                    totalWorkouts: meData.data.user.totalWorkouts ?? 0,
                    currentStreak: meData.data.user.currentStreak ?? 0,
                });
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ==================== Data Processing ====================

    const processActiveProgram = (programs: Program[], workouts: WorkoutLog[]) => {
        if (!programs.length) return;

        // Find most recently used program
        const recentWorkout = workouts
            .filter(w => w.programId && w.status === 'completed')
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

        const active = recentWorkout
            ? programs.find(p => p.id === recentWorkout.programId) || programs[0]
            : programs[0];

        setActiveProgram(active);

        // Find next workout
        if (active) {
            const lastWorkout = workouts
                .filter(w => w.programId === active.id && w.status === 'completed')
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

            if (!lastWorkout?.dayId && active.days.length > 0) {
                setNextWorkout(active.days[0]);
            } else if (lastWorkout?.dayId && active.days.length > 0) {
                const lastDayIndex = active.days.findIndex(d => d.id === lastWorkout.dayId);
                const nextDayIndex = (lastDayIndex + 1) % active.days.length;
                setNextWorkout(active.days[nextDayIndex]);
            }
        }
    };

    const processWeekStats = (workouts: WorkoutLog[]) => {
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const thisWeek = workouts.filter(w =>
            new Date(w.startTime) >= oneWeekAgo && w.status === 'completed'
        );

        const lastWeek = workouts.filter(w => {
            const date = new Date(w.startTime);
            return date >= twoWeeksAgo && date < oneWeekAgo && w.status === 'completed';
        });

        setWeekStats({
            workouts: thisWeek.length,
            volume: thisWeek.reduce((sum, w) => sum + calculateVolume(w), 0),
            sets: thisWeek.reduce((sum, w) => sum + getTotalSets(w), 0),
            prs: thisWeek.reduce((sum, w) => sum + getPRCount(w), 0)
        });

        setLastWeekStats({
            workouts: lastWeek.length,
            volume: lastWeek.reduce((sum, w) => sum + calculateVolume(w), 0),
            sets: lastWeek.reduce((sum, w) => sum + getTotalSets(w), 0),
            prs: lastWeek.reduce((sum, w) => sum + getPRCount(w), 0)
        });
    };

    // ==================== Utility Functions ====================

    const calculateVolume = (workout: WorkoutLog): number => {
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

    const getTotalSets = (workout: WorkoutLog): number => {
        let total = 0;
        workout.exerciseLogs?.forEach(log => {
            const sets = log.sets as any[];
            total += sets.length;
        });
        return total;
    };

    const getPRCount = (workout: WorkoutLog): number => {
        let count = 0;
        workout.exerciseLogs?.forEach(log => {
            if (log.isWeightPR || log.isVolumePR || log.isRepsPR) {
                count++;
            }
        });
        return count;
    };

    const getUserInfo = (): UserInfo => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token) return { name: 'User', email: '', initials: 'U', currentStreak: 0, totalWorkouts: 0 };

        try {
            if (userStr) {
                const user = JSON.parse(userStr);
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

                let displayName = fullName;
                if (!displayName && user.email) {
                    displayName = user.email.split('@')[0]
                        .replace(/[._-]/g, ' ')
                        .split(' ')
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }

                const nameParts = displayName.split(' ');
                const initials = nameParts.length >= 2
                    ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
                    : nameParts[0]?.slice(0, 2) || 'U';

                return {
                    name: displayName || user.email || 'User',
                    email: user.email || '',
                    initials: initials.toUpperCase(),
                    avatarUrl: liveUserStats.avatarUrl || user.avatarUrl || undefined,
                    currentStreak: liveUserStats.currentStreak,
                    totalWorkouts: liveUserStats.totalWorkouts,
                };
            }

            return { name: 'User', email: '', initials: 'U', currentStreak: 0, totalWorkouts: 0 };
        } catch {
            return { name: 'User', email: '', initials: 'U', currentStreak: 0, totalWorkouts: 0 };
        }
    };

    const getRecentPRs = (): ProcessedPR[] => {
        const allPRs: ProcessedPR[] = [];

        recentPRs.forEach(exercise => {
            if (exercise.bestWeight > 0) {
                allPRs.push({
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    type: 'weight',
                    value: `${exercise.bestWeight} kg`,
                    date: exercise.bestWeightDate
                });
            }
            if (exercise.bestVolume > 0) {
                allPRs.push({
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    type: 'volume',
                    value: `${Math.round(exercise.bestVolume)} kg`,
                    date: exercise.bestVolumeDate
                });
            }
            if (exercise.bestReps > 0) {
                allPRs.push({
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    type: 'reps',
                    value: `${exercise.bestReps} reps`,
                    date: exercise.bestRepsDate
                });
            }
        });

        return allPRs
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // ==================== Actions ====================

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const startWorkout = (dayId: string, programId: string) => {
        navigate(`/workout/active?dayId=${dayId}&programId=${programId}`);
    };

    return {
        // State
        mounted,
        loading,
        activeProgram,
        nextWorkout,
        weekStats,
        lastWeekStats,

        // Computed
        userInfo: getUserInfo(),
        topPRs: getRecentPRs(),

        // Functions
        formatDate,
        handleLogout,
        startWorkout,
        navigate
    };
}
