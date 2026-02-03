/**
 * DashboardHeader Component
 * Header with logo, title, and logout button
 */

interface DashboardHeaderProps {
    onLogout: () => void;
}

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
    return (
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
                        onClick={onLogout}
                        className="px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-all duration-200 text-sm font-medium">
                        🚪 Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
