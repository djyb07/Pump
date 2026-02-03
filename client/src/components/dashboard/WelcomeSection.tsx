/**
 * WelcomeSection Component
 * Welcome card with user avatar and greeting
 */

import type { UserInfo } from '../../types/dashboard';

interface WelcomeSectionProps {
    userInfo: UserInfo;
    mounted: boolean;
}

export function WelcomeSection({ userInfo, mounted }: WelcomeSectionProps) {
    return (
        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="glass-card-lg p-4 sm:p-8">
                <div className="flex items-center space-x-4 sm:space-x-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-lime-400 flex items-center justify-center text-slate-950 text-xl sm:text-2xl font-bold shadow-lg">
                        {userInfo.initials}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                            Welcome Back, {userInfo.name}! 👋
                        </h1>
                        {userInfo.email && (
                            <p className="text-slate-400 text-xs sm:text-sm">{userInfo.email}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
