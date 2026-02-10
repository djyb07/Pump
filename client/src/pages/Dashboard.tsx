/**
 * Dashboard Page - Midnight Pro Bento Grid Layout
 * 
 * Main dashboard for the PUMP fitness tracking application.
 * Refactored to use a Bento Grid layout with prominent Start Workout CTA.
 */

import { useDashboard } from '../hooks/useDashboard';
import { Flame, Dumbbell, Rocket, Heart, ChevronRight } from 'lucide-react';
import {
    WelcomeSection,
    ActiveProgramCard,
    WeekStatsCard,
    RecentProgressCard,
    RecentActivityFeed
} from '../components/dashboard';

export default function Dashboard() {
    const {
        mounted,
        loading,
        activeProgram,
        nextWorkout,
        weekStats,
        lastWeekStats,
        userInfo,
        topPRs,
        formatDate,
        startWorkout,
        navigate
    } = useDashboard();

    return (
        <div className="relative z-10">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <WelcomeSection userInfo={userInfo} mounted={mounted} />

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-slate-200 text-xl">Loading your dashboard...</div>
                    </div>
                ) : (
                    <>
                        {/* Hero Start Workout CTA - Full Width */}
                        <div className={`mb-8 transition-all duration-700 delay-75 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="glass-card-lg p-6 sm:p-8 border-lime-400/20">
                                {nextWorkout && activeProgram ? (
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Flame className="w-8 h-8 text-orange-500" />
                                                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                                                    Ready to Train?
                                                </h2>
                                            </div>
                                            <p className="text-slate-400 text-lg mb-1">
                                                Next: <span className="text-white font-semibold">{nextWorkout.name}</span>
                                            </p>
                                            <p className="text-slate-500 text-sm">
                                                {nextWorkout.exercises?.length || 0} exercises • Day {nextWorkout.dayNumber} of {activeProgram.name}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => startWorkout(nextWorkout.id, activeProgram.id)}
                                            disabled={!nextWorkout.exercises || nextWorkout.exercises.length === 0}
                                            className={`w-full lg:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${!nextWorkout.exercises || nextWorkout.exercises.length === 0
                                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
                                                : 'bg-lime-400 hover:bg-lime-500 text-slate-950 transform hover:scale-105 shadow-lime-400/20'
                                                }`}
                                        >
                                            {!nextWorkout.exercises || nextWorkout.exercises.length === 0
                                                ? 'No Exercises Added'
                                                : <><span>Start Workout</span><ChevronRight className="w-5 h-5 inline" /></>
                                            }
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Dumbbell className="w-8 h-8 text-lime-400" />
                                                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                                                    Let's Get Started
                                                </h2>
                                            </div>
                                            <p className="text-slate-400">
                                                Create or activate a program to begin tracking your workouts
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate('/programs')}
                                            className="w-full lg:w-auto px-8 py-4 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-lime-400/20"
                                        >
                                            Browse Programs <ChevronRight className="w-5 h-5 inline" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bento Grid Layout */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            {/* Weekly Stats - Span 2 columns on large screens */}
                            <div className="md:col-span-2">
                                <WeekStatsCard
                                    weekStats={weekStats}
                                    lastWeekStats={lastWeekStats}
                                />
                            </div>

                            {/* Active Program Card */}
                            <div className="md:col-span-1">
                                <ActiveProgramCard
                                    activeProgram={activeProgram}
                                    onNavigate={navigate}
                                />
                            </div>

                            {/* Recent Progress Card */}
                            <div className="md:col-span-1">
                                <RecentProgressCard
                                    topPRs={topPRs}
                                    formatDate={formatDate}
                                    onNavigate={navigate}
                                />
                            </div>
                        </div>

                        {/* Recent Activity Feed - Replaces QuickActions */}
                        <RecentActivityFeed mounted={mounted} />
                    </>
                )}

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-slate-600 text-sm flex items-center justify-center gap-1">
                        <Rocket className="w-4 h-4" /> Powered by Render & Vercel | Built with <Heart className="w-4 h-4 text-red-400" />
                    </p>
                </div>
            </main>
        </div>
    );
}

