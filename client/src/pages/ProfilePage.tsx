/**
 * ProfilePage — Placeholder
 * 
 * Future home for profile settings, avatar upload, and account management.
 */

import { UnifiedPageHeader } from '../components/layout';
import { User } from 'lucide-react';

export default function ProfilePage() {
    return (
        <div className="relative z-10">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <UnifiedPageHeader
                    title="Profile & Settings"
                    subtitle="Manage your account"
                    icon={User}
                    showBackButton
                />

                <div className="glass-card-lg p-8 sm:p-12 text-center mt-6">
                    <div className="w-20 h-20 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-6 ring-2 ring-lime-400/30">
                        <User className="w-10 h-10 text-slate-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Profile settings, avatar upload, and account management are on the way.
                    </p>
                </div>
            </main>
        </div>
    );
}
