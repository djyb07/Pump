/**
 * WeekStatsCard Component
 * Displays weekly workout statistics with comparison to last week
 */

import type { WeekStats } from '../../types/dashboard';

interface WeekStatsCardProps {
    weekStats: WeekStats;
    lastWeekStats: WeekStats;
}

interface StatItemProps {
    label: string;
    value: string | number;
    lastValue: number;
    currentValue: number;
    isVolume?: boolean;
    isHighlight?: boolean;
}

function StatItem({ label, value, lastValue, currentValue, isVolume = false, isHighlight = false }: StatItemProps) {
    const showChange = lastValue > 0 && currentValue !== lastValue;
    const isPositive = currentValue > lastValue;
    const diff = Math.abs(currentValue - lastValue);
    const displayDiff = isVolume ? `${(diff / 1000).toFixed(1)}k` : diff;

    return (
        <div>
            <div className="text-slate-400 text-sm mb-1">{label}</div>
            <div className="flex items-center space-x-2">
                <div className={`${isVolume ? 'text-2xl' : 'text-3xl'} font-bold ${isHighlight ? 'text-lime-400' : 'text-white'}`}>
                    {value}
                </div>
                {showChange && (
                    <span className={`text-${isVolume ? 'xs' : 'sm'} ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '↑' : '↓'}{displayDiff}
                    </span>
                )}
            </div>
        </div>
    );
}

export function WeekStatsCard({ weekStats, lastWeekStats }: WeekStatsCardProps) {
    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">📊</span>
                This Week
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <StatItem
                    label="Workouts"
                    value={weekStats.workouts}
                    currentValue={weekStats.workouts}
                    lastValue={lastWeekStats.workouts}
                />
                <StatItem
                    label="Total Sets"
                    value={weekStats.sets}
                    currentValue={weekStats.sets}
                    lastValue={lastWeekStats.sets}
                />
                <StatItem
                    label="Volume"
                    value={`${(weekStats.volume / 1000).toFixed(1)}k`}
                    currentValue={weekStats.volume}
                    lastValue={lastWeekStats.volume}
                    isVolume
                />
                <StatItem
                    label="PRs"
                    value={weekStats.prs}
                    currentValue={weekStats.prs}
                    lastValue={lastWeekStats.prs}
                    isHighlight
                />
            </div>
            {weekStats.workouts > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <p className="text-lime-400 text-sm">
                        {weekStats.workouts >= 4 ? "🔥 Great progress!" : "💪 Keep it up!"}
                    </p>
                </div>
            )}
        </div>
    );
}
