import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';

interface Program {
    id: string;
    name: string;
    description?: string;
    days: WorkoutDay[];
}

interface WorkoutDay {
    id: string;
    name: string;
    dayNumber: number;
    exercises?: any[];
}

interface WorkoutLog {
    id: string;
    userId: string;
    dayId?: string;
    programId?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: string;
    exerciseLogs?: any[];
}

interface ExercisePR {
    exerciseId: string;
    exerciseName: string;
    bestWeight: number;
    bestWeightDate: string;
    bestVolume: number;
    bestVolumeDate: string;
    bestReps: number;
    bestRepsDate: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Data state
    const [programs, setPrograms] = useState<Program[]>([]);
    const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
    const [recentPRs, setRecentPRs] = useState<ExercisePR[]>([]);

    // Derived state
    const [activeProgram, setActiveProgram] = useState<Program | null>(null);
    const [nextWorkout, setNextWorkout] = useState<WorkoutDay | null>(null);
    const [weekStats, setWeekStats] = useState({
        workouts: 0,
        volume: 0,
        sets: 0,
        prs: 0
    });

    useEffect(() => {
        setMounted(true);
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [programsData, workoutsData, prsData] = await Promise.all([
                apiClient.get('/api/programs'),
                apiClient.get('/api/workouts?limit=50'),
                apiClient.get('/api/analytics/personal-records')
            ]);

            setPrograms(programsData.data);
            setWorkouts(workoutsData.data);
            setRecentPRs(prsData.data);

            // Process data
            processActiveProgram(programsData.data, workoutsData.data);
            processWeekStats(workoutsData.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

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
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const thisWeek = workouts.filter(w =>
            new Date(w.startTime) >= oneWeekAgo && w.status === 'completed'
        );

        const stats = {
            workouts: thisWeek.length,
            volume: thisWeek.reduce((sum, w) => sum + calculateVolume(w), 0),
            sets: thisWeek.reduce((sum, w) => sum + getTotalSets(w), 0),
            prs: thisWeek.reduce((sum, w) => sum + getPRCount(w), 0)
        };

        setWeekStats(stats);
    };

    const calculateVolume = (workout: WorkoutLog) => {
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getUserInfo = () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token) return { name: 'User', email: '', initials: 'U' };

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
                    initials: initials.toUpperCase()
                };
            }

            return { name: 'User', email: '', initials: 'U' };
        } catch {
            return { name: 'User', email: '', initials: 'U' };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getRecentPRs = () => {
        const allPRs: any[] = [];

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

    const userInfo = getUserInfo();
    const topPRs = getRecentPRs();

    const startWorkout = async (dayId: string, programId: string) => {
        try {
            const response = await apiClient.post('/api/workouts/start', {
                dayId,
                programId
            });
            navigate(`/workout/${response.data.id}`);
        } catch (error) {
            console.error('Failed to start workout:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
            {/* Background animated gradient orbs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <img src="/logo.png" alt="PUMP" className="h-10 w-10" />
                                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    PUMP
                                </div>
                                <span className="text-gray-500 text-sm hidden sm:inline">Fitness Tracker</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-all duration-200 text-sm font-medium">
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-purple-900/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
                            <div className="flex items-center space-x-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {userInfo.initials}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                                        Welcome Back, {userInfo.name}! 👋
                                    </h1>
                                    {userInfo.email && (
                                        <p className="text-purple-300/80 text-sm">{userInfo.email}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-white text-xl">Loading your dashboard...</div>
                        </div>
                    ) : (
                        <>
                            {/* Dashboard Cards Grid */}
                            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                {/* Active Program Card */}
                                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 shadow-lg">
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                        <span className="mr-2">🏋️</span>
                                        Active Program
                                    </h3>
                                    {activeProgram ? (
                                        <>
                                            <div className="mb-4">
                                                <h4 className="text-2xl font-bold text-white mb-1">{activeProgram.name}</h4>
                                                <p className="text-gray-400 text-sm">
                                                    {activeProgram.days.length} days • {activeProgram.description || 'Custom program'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/programs/${activeProgram.id}`)}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200">
                                                View Program →
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400 mb-4">No active program</p>
                                            <button
                                                onClick={() => navigate('/programs')}
                                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all">
                                                Create Program
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Next Workout Card */}
                                <div className="bg-gradient-to-br from-pink-900/30 to-pink-800/30 backdrop-blur-sm border border-pink-500/30 rounded-xl p-6 shadow-lg">
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                        <span className="mr-2">📅</span>
                                        Next Workout
                                    </h3>
                                    {nextWorkout && activeProgram ? (
                                        <>
                                            <div className="mb-4">
                                                <h4 className="text-2xl font-bold text-white mb-1">{nextWorkout.name}</h4>
                                                <p className="text-gray-400 text-sm">
                                                    {nextWorkout.exercises?.length || 0} exercises • Day {nextWorkout.dayNumber}
                                                </p>
                                            </div>
                                            {nextWorkout.exercises && nextWorkout.exercises.length > 0 && (
                                                <div className="mb-4 space-y-1">
                                                    {nextWorkout.exercises.slice(0, 3).map((ex: any, idx: number) => (
                                                        <div key={idx} className="text-gray-300 text-sm">
                                                            • {(ex.exercise as any)?.name || 'Exercise'}
                                                        </div>
                                                    ))}
                                                    {nextWorkout.exercises.length > 3 && (
                                                        <div className="text-gray-400 text-sm">
                                                            +{nextWorkout.exercises.length - 3} more...
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => startWorkout(nextWorkout.id, activeProgram.id)}
                                                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200">
                                                Start Workout →
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400 mb-4">No workout scheduled</p>
                                            <button
                                                onClick={() => navigate('/programs')}
                                                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-all">
                                                Browse Programs
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Week Stats Card */}
                                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 shadow-lg">
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                        <span className="mr-2">📊</span>
                                        This Week
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-gray-400 text-sm mb-1">Workouts</div>
                                            <div className="text-3xl font-bold text-white">{weekStats.workouts}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 text-sm mb-1">Total Sets</div>
                                            <div className="text-3xl font-bold text-white">{weekStats.sets}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 text-sm mb-1">Volume</div>
                                            <div className="text-2xl font-bold text-white">{(weekStats.volume / 1000).toFixed(1)}k kg</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 text-sm mb-1">PRs</div>
                                            <div className="text-3xl font-bold text-yellow-400">{weekStats.prs}</div>
                                        </div>
                                    </div>
                                    {weekStats.workouts > 0 && (
                                        <div className="mt-4 pt-4 border-t border-blue-500/30 text-center">
                                            <p className="text-blue-300 text-sm">
                                                {weekStats.workouts >= 4 ? "🔥 Great progress!" : "💪 Keep it up!"}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Recent Progress Card */}
                                <div className="bg-gradient-to-br from-yellow-900/30 to-orange-800/30 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 shadow-lg">
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                        <span className="mr-2">🏆</span>
                                        Recent Progress
                                    </h3>
                                    {topPRs.length > 0 ? (
                                        <>
                                            <div className="space-y-3 mb-4">
                                                {topPRs.map((pr, idx) => (
                                                    <div key={idx} className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="text-white font-semibold">{pr.exerciseName}</div>
                                                            <div className="text-gray-400 text-sm">{formatDate(pr.date)}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-yellow-400 font-bold">{pr.value}</div>
                                                            <div className="text-gray-400 text-xs">
                                                                {pr.type === 'weight' ? '💪' : pr.type === 'volume' ? '📊' : '🔥'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => navigate('/personal-records')}
                                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 text-sm">
                                                View All PRs →
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400 mb-4">No PRs yet</p>
                                            <button
                                                onClick={() => navigate('/programs')}
                                                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all">
                                                Start Training
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="mr-2">⚡</span>
                                    Quick Actions
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button
                                        onClick={() => navigate('/programs')}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                                        🏋️ Programs
                                    </button>
                                    <button
                                        onClick={() => navigate('/workout/history')}
                                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                                        📊 History
                                    </button>
                                    <button
                                        onClick={() => navigate('/exercises')}
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                                        📚 Exercises
                                    </button>
                                    <button
                                        onClick={() => navigate('/personal-records')}
                                        className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                                        🏆 Records
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600 text-sm">
                            🚀 Powered by Azure & Vercel | Built with ❤️
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
