/**
 * DashboardHeader Component - Midnight Pro Navigation
 * Header with logo, navigation links, and logout button
 */

import { useLocation, Link } from 'react-router-dom';
import { Home, Dumbbell, History, Trophy, LogOut, type LucideIcon } from 'lucide-react';

interface DashboardHeaderProps {
    onLogout: () => void;
}

interface NavLinkType {
    path: string;
    label: string;
    Icon: LucideIcon;
}

const navLinks: NavLinkType[] = [
    { path: '/dashboard', label: 'Dashboard', Icon: Home },
    { path: '/programs', label: 'Programs', Icon: Dumbbell },
    { path: '/workout/history', label: 'History', Icon: History },
    { path: '/personal-records', label: 'PRs', Icon: Trophy },
];

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
    const location = useLocation();

    return (
        <header className="border-b border-white/5 backdrop-blur-md bg-slate-900/60 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    {/* Logo */}
                    <div className="flex items-center">
                        <img src="/pump-logo.png" alt="PUMP" className="h-14 w-auto" />
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
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'text-lime-400 bg-lime-400/10'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                >
                                    <link.Icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-white/5 text-slate-300 hover:text-white transition-all duration-200 text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" /> Logout
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
                                <link.Icon className="w-5 h-5 mb-0.5" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
