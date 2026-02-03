/**
 * DashboardHeader Component
 * Header with logo, title, and logout button
 */

interface DashboardHeaderProps {
    onLogout: () => void;
}

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
    return (
        <header className="border-b border-white/5 backdrop-blur-md bg-slate-900/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img src="/logo.png" alt="PUMP" className="h-10 w-10" />
                        <div className="text-3xl font-bold text-lime-400">
                            PUMP
                        </div>
                        <span className="text-slate-500 text-sm hidden sm:inline">Fitness Tracker</span>
                    </div>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-white/5 text-slate-300 hover:text-white transition-all duration-200 text-sm font-medium">
                        🚪 Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
