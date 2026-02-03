/**
 * DashboardHeader Component - Midnight Pro Navigation
 * Header with logo, navigation links, and logout button
 */

import { useLocation, Link } from 'react-router-dom';

interface DashboardHeaderProps {
    onLogout: () => void;
}

const navLinks = [
    { path: '/dashboard', label: 'Dashboard', emoji: '🏠' },
    { path: '/programs', label: 'Programs', emoji: '🏋️' },
    { path: '/workout/history', label: 'History', emoji: '📊' },
    { path: '/personal-records', label: 'PRs', emoji: '🏆' },
];

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
    const location = useLocation();

    return (
        <header className="border-b border-white/5 backdrop-blur-md bg-slate-900/60 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <img src="/logo.png" alt="PUMP" className="h-8 w-8" />
                        <div className="text-2xl font-bold text-lime-400">
                            PUMP
                        </div>
                    </div>

                    {/* Navigation Links - Desktop */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path ||
                                (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'text-lime-400 bg-lime-400/10'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                >
                                    <span className="mr-1.5">{link.emoji}</span>
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-white/5 text-slate-300 hover:text-white transition-all duration-200 text-sm font-medium"
                    >
                        🚪 Logout
                    </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="md:hidden flex items-center justify-around py-2 border-t border-white/5 -mx-4 px-2">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path ||
                            (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isActive
                                        ? 'text-lime-400'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg mb-0.5">{link.emoji}</span>
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
