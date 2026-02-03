/**
 * RecentProgressCard Component
 * Displays recent personal records with navigation to full list
 */

import type { ProcessedPR } from '../../types/dashboard';

interface RecentProgressCardProps {
    topPRs: ProcessedPR[];
    formatDate: (dateString: string) => string;
    onNavigate: (path: string) => void;
}

export function RecentProgressCard({ topPRs, formatDate, onNavigate }: RecentProgressCardProps) {
    const getPRIcon = (type: string) => {
        switch (type) {
            case 'weight': return '💪';
            case 'volume': return '📊';
            case 'reps': return '🔥';
            default: return '🏆';
        }
    };

    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">🏆</span>
                Recent Progress
            </h3>
            {topPRs.length > 0 ? (
                <>
                    <div className="space-y-3 mb-4">
                        {topPRs.map((pr, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="text-white font-semibold">{pr.exerciseName}</div>
                                    <div className="text-slate-400 text-sm">{formatDate(pr.date)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lime-400 font-bold">{pr.value}</div>
                                    <div className="text-slate-500 text-xs">
                                        {getPRIcon(pr.type)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => onNavigate('/personal-records')}
                        className="w-full bg-lime-400 hover:bg-lime-500 text-slate-950 py-2 px-4 rounded-lg font-semibold transition-all duration-200 text-sm">
                        View All PRs →
                    </button>
                </>
            ) : (
                <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">No PRs yet</p>
                    <button
                        onClick={() => onNavigate('/programs')}
                        className="px-6 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all">
                        Start Training
                    </button>
                </div>
            )}
        </div>
    );
}
