/**
 * Dashboard Page
 * 
 * Main dashboard for the PUMP fitness tracking application.
 * Refactored to use modular components and custom hook for better maintainability.
 */

import { useDashboard } from '../hooks/useDashboard';
import {
    DashboardHeader,
    WelcomeSection,
    ActiveProgramCard,
    NextWorkoutCard,
    WeekStatsCard,
    RecentProgressCard,
    QuickActions
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
        handleLogout,
        startWorkout,
        navigate
    } = useDashboard();

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="relative z-10">
                <DashboardHeader onLogout={handleLogout} />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <WelcomeSection userInfo={userInfo} mounted={mounted} />

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-slate-200 text-xl">Loading your dashboard...</div>
                        </div>
                    ) : (
                        <>
                            {/* Dashboard Cards Grid */}
                            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <ActiveProgramCard
                                    activeProgram={activeProgram}
                                    onNavigate={navigate}
                                />
                                <NextWorkoutCard
                                    nextWorkout={nextWorkout}
                                    activeProgram={activeProgram}
                                    onStartWorkout={startWorkout}
                                    onNavigate={navigate}
                                />
                                <WeekStatsCard
                                    weekStats={weekStats}
                                    lastWeekStats={lastWeekStats}
                                />
                                <RecentProgressCard
                                    topPRs={topPRs}
                                    formatDate={formatDate}
                                    onNavigate={navigate}
                                />
                            </div>

                            <QuickActions mounted={mounted} onNavigate={navigate} />
                        </>
                    )}

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-slate-600 text-sm">
                            🚀 Powered by Render & Vercel | Built with ❤️
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
