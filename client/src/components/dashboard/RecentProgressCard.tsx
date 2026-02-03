/**
 * RecentProgressCard Component - Midnight Pro Bento Style
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
        <div className="glass-card p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🏆</span>
                Recent PRs
            </h3>
            {topPRs.length > 0 ? (
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 space-y-3 mb-4">
                        {topPRs.slice(0, 3).map((pr, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1">
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium text-sm truncate">{pr.exerciseName}</div>
                                    <div className="text-slate-500 text-xs">{formatDate(pr.date)}</div>
                                </div>
                                <div className="text-right ml-2">
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
                        className="w-full bg-slate-800/60 hover:bg-slate-700/60 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 border border-white/5 hover:border-lime-400/30 text-sm"
                    >
                        View All PRs →
                    </button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                    <p className="text-slate-400 mb-4">No PRs yet</p>
                    <button
                        onClick={() => onNavigate('/programs')}
                        className="px-6 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all"
                    >
                        Start Training
                    </button>
                </div>
            )}
        </div>
    );
}
