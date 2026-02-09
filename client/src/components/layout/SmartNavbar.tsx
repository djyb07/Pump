/**
 * SmartNavbar Component - Midnight Pro Glassmorphism Navigation
 * 
 * Features:
 * - Sticky positioning with hide-on-scroll effect
 * - Glassmorphism styling (bg-slate-900/30, backdrop-blur-xl)
 * - Responsive: Desktop horizontal nav, Mobile bottom nav
 * - Active state highlighting with lime-400 accent
 */

import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, History, Library, Trophy, LogOut, type LucideIcon } from 'lucide-react';

interface SmartNavbarProps {
    onLogout: () => void;
}

interface NavLink {
    path: string;
    label: string;
    icon: LucideIcon;
}

const navLinks: NavLink[] = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/programs', label: 'Programs', icon: Dumbbell },
    { path: '/workout/history', label: 'History', icon: History },
    { path: '/exercises', label: 'Exercises', icon: Library },
    { path: '/personal-records', label: 'PRs', icon: Trophy },
];

export function SmartNavbar({ onLogout }: SmartNavbarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show navbar when scrolling up or at top
            if (currentScrollY < lastScrollY || currentScrollY < 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Hide navbar when scrolling down (after 100px)
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Desktop Navbar */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 border-b border-white/5 
                    bg-slate-900/30 backdrop-blur-xl
                    transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : '-translate-y-full'}
                    hidden md:block`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center hover:opacity-80 transition-opacity"
                        >
                            <img src="/pump-logo.png" alt="PUMP" className="h-14 w-auto" />
                        </button>

                        {/* Navigation Links */}
                        <nav className="flex items-center space-x-1">
                            {navLinks.map((link) => {
                                const IconComponent = link.icon;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.path)
                                            ? 'text-lime-400 bg-lime-400/10'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                            }`}
                                    >
                                        <IconComponent className="w-4 h-4" />
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
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Top Bar */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 border-b border-white/5 
                    bg-slate-900/30 backdrop-blur-xl
                    transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : '-translate-y-full'}
                    md:hidden`}
            >
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center"
                    >
                        <img src="/pump-logo.png" alt="PUMP" className="h-10 w-auto" />
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-white/5 text-slate-300"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl md:hidden">
                <div className="flex items-center justify-around py-2 px-2">
                    {navLinks.map((link) => {
                        const IconComponent = link.icon;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isActive(link.path)
                                    ? 'text-lime-400'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <IconComponent className="w-5 h-5 mb-0.5" />
                                <span className="text-[10px]">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
