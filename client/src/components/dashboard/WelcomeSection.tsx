/**
 * WelcomeSection Component — Midnight Pro Dashboard Header
 * 
 * Premium greeting with smart avatar, gradient name text,
 * gamification glass badges (streak + level), and profile link.
 */

import { Link } from 'react-router-dom';
import type { UserInfo } from '../../types/dashboard';
import { Hand, Flame, Trophy } from 'lucide-react';

interface WelcomeSectionProps {
    userInfo: UserInfo;
    mounted: boolean;
}

/** Calculate level from total workouts */
function getUserLevel(totalWorkouts: number): { label: string; color: string } {
    if (totalWorkouts >= 100) return { label: 'Elite', color: 'text-amber-400' };
    if (totalWorkouts >= 50) return { label: 'Pro', color: 'text-purple-400' };
    if (totalWorkouts >= 10) return { label: 'Regular', color: 'text-sky-400' };
    return { label: 'Novice', color: 'text-slate-400' };
}

/** Time-based greeting */
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

export function WelcomeSection({ userInfo, mounted }: WelcomeSectionProps) {
    const level = getUserLevel(userInfo.totalWorkouts);
    const greeting = getGreeting();

    return (
        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="glass-card-lg p-4 sm:p-8">
                <Link
                    to="/profile"
                    className="flex items-center space-x-4 sm:space-x-6 group cursor-pointer"
                >
                    {/* Smart Avatar */}
                    {userInfo.avatarUrl ? (
                        <img
                            src={userInfo.avatarUrl}
                            alt={userInfo.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-lime-400/50 shadow-lg shadow-lime-400/10 flex-shrink-0 transition-all duration-300 group-hover:ring-lime-400/80"
                        />
                    ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center ring-2 ring-lime-400/50 shadow-lg shadow-lime-400/10 flex-shrink-0 transition-all duration-300 group-hover:ring-lime-400/80">
                            <span className="text-lime-400 font-bold text-xl sm:text-2xl">
                                {userInfo.initials}
                            </span>
                        </div>
                    )}

                    {/* Name + Badges */}
                    <div className="flex-1 min-w-0">
                        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                {greeting}, {userInfo.name}!
                            </span>
                            <Hand className="w-7 h-7 sm:w-8 sm:h-8 text-lime-400 flex-shrink-0" />
                        </h1>

                        {/* Glass Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Streak Badge */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 backdrop-blur-sm border border-white/10 text-sm font-medium text-slate-200">
                                <Flame className="w-3.5 h-3.5 text-orange-400" />
                                {userInfo.currentStreak} Day Streak
                            </span>

                            {/* Level Badge */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 backdrop-blur-sm border border-white/10 text-sm font-medium text-slate-200">
                                <Trophy className={`w-3.5 h-3.5 ${level.color}`} />
                                <span className={level.color}>{level.label}</span>
                            </span>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
