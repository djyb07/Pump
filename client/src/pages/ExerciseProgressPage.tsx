import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { UnifiedPageHeader } from '../components/layout';

interface ProgressData {
    date: string;
    maxWeight: number;
    totalVolume: number;
    sets: number;
    e1RM: number;
}

interface ExerciseInfo {
    id: string;
    nameEn: string;
    nameHe: string;
}

export default function ExerciseProgressPage() {
    const navigate = useNavigate();
    const { exerciseId } = useParams<{ exerciseId: string }>();
    const [exercise, setExercise] = useState<ExerciseInfo | null>(null);
    const [progressData, setProgressData] = useState<ProgressData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeFilter, setTimeFilter] = useState<'7' | '30' | '90' | 'all'>('30');

    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        loadProgress();
    }, [exerciseId]);

    const loadProgress = async () => {
        if (!exerciseId) return;

        try {
            const response = await fetch(`${BASE_URL}/api/analytics/progress/${exerciseId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load progress');

            const data = await response.json();
            setExercise(data.exercise);
            setProgressData(data.progress);
        } catch (err: any) {
            setError(err.message || 'Failed to load progress');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        if (timeFilter === 'all') return progressData;

        const days = parseInt(timeFilter);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return progressData.filter(p => new Date(p.date) >= cutoffDate);
    };

    // Calculate best PRs from all-time data
    const getBestPRs = () => {
        if (progressData.length === 0) return null;

        let bestWeight = { value: 0, date: '' };
        let bestVolume = { value: 0, date: '' };
        let beste1RM = { value: 0, date: '' };

        progressData.forEach(record => {
            if (record.maxWeight > bestWeight.value) {
                bestWeight = { value: record.maxWeight, date: record.date };
            }
            if (record.totalVolume > bestVolume.value) {
                bestVolume = { value: record.totalVolume, date: record.date };
            }
            if (record.e1RM > beste1RM.value) {
                beste1RM = { value: record.e1RM, date: record.date };
            }
        });

        return { bestWeight, bestVolume, beste1RM };
    };

    // Group data by date and take max values for multiple workouts on same day
    const groupDataByDate = (data: ProgressData[]) => {
        const grouped = new Map<string, ProgressData>();

        data.forEach(item => {
            const dateKey = formatDate(item.date);
            const existing = grouped.get(dateKey);

            if (!existing) {
                grouped.set(dateKey, item);
            } else {
                // Keep the max values if multiple workouts on same day
                grouped.set(dateKey, {
                    ...item,
                    maxWeight: Math.max(existing.maxWeight, item.maxWeight),
                    totalVolume: Math.max(existing.totalVolume, item.totalVolume),
                    e1RM: Math.max(existing.e1RM, item.e1RM),
                    sets: existing.sets + item.sets
                });
            }
        });

        return Array.from(grouped.values());
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-200 text-xl">Loading progress...</div>
            </div>
        );
    }

    if (error || !exercise) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">{error || 'Exercise not found'}</div>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    const filteredData = getFilteredData();
    const groupedData = groupDataByDate(filteredData);
    const chartData = groupedData.map(p => ({
        ...p,
        date: formatDate(p.date)
    }));

    return (
        <div className="relative z-10">
            <UnifiedPageHeader
                title={exercise.nameEn}
                subtitle={exercise.nameHe}
                showBackButton
                emoji="📊"
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Time Filter */}
                <div className="mb-8 flex flex-wrap gap-2">
                    {[
                        { value: '7' as const, label: 'Last 7 Days' },
                        { value: '30' as const, label: 'Last 30 Days' },
                        { value: '90' as const, label: 'Last 90 Days' },
                        { value: 'all' as const, label: 'All Time' }
                    ].map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => setTimeFilter(filter.value)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${timeFilter === filter.value
                                ? 'bg-lime-400 text-slate-950'
                                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
                {/* Best PRs Section */}
                {(() => {
                    const prs = getBestPRs();
                    if (!prs) return null;

                    const formatDate = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        });
                    };

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Best Weight PR */}
                            <div className="bg-lime-400/10 border border-lime-400/30 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-lime-400 text-sm font-medium">💪 Best Weight</span>
                                    <span className="text-xs px-2 py-1 bg-lime-400/20 text-lime-400 rounded">PR</span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">{prs.bestWeight.value} kg</div>
                                <div className="text-slate-400 text-sm">{formatDate(prs.bestWeight.date)}</div>
                            </div>

                            {/* Best Volume PR */}
                            <div className="bg-lime-400/10 border border-lime-400/30 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-lime-400 text-sm font-medium">📊 Best Volume</span>
                                    <span className="text-xs px-2 py-1 bg-lime-400/20 text-lime-400 rounded">PR</span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">{Math.round(prs.bestVolume.value)} kg</div>
                                <div className="text-slate-400 text-sm">{formatDate(prs.bestVolume.date)}</div>
                            </div>

                            {/* Best e1RM PR */}
                            <div className="bg-lime-400/10 border border-lime-400/30 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-lime-400 text-sm font-medium">🎯 Best e1RM</span>
                                    <span className="text-xs px-2 py-1 bg-lime-400/20 text-lime-400 rounded">PR</span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">{prs.beste1RM.value} kg</div>
                                <div className="text-slate-400 text-sm">{formatDate(prs.beste1RM.date)}</div>
                            </div>
                        </div>
                    );
                })()}

                {filteredData.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                        <p className="text-xl">No workout data in this time period</p>
                        <p className="mt-2">Try selecting a longer time range</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Max Weight Chart */}
                        <div className="glass-card p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">💪 Max Weight Progression</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        labelStyle={{ color: '#F3F4F6' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="maxWeight" stroke="#a3e635" strokeWidth={3} name="Max Weight (kg)">
                                        <LabelList dataKey="maxWeight" position="top" fill="#FFFFFF" fontSize={14} fontWeight="bold" offset={5} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Total Volume Chart */}
                        <div className="glass-card p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">📊 Total Volume Progression</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        labelStyle={{ color: '#F3F4F6' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="totalVolume" stroke="#a3e635" strokeWidth={3} name="Volume (kg)">
                                        <LabelList dataKey="totalVolume" position="top" fill="#FFFFFF" fontSize={14} fontWeight="bold" offset={5} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* e1RM Chart */}
                        <div className="glass-card p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">🎯 Estimated 1RM Progression</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        labelStyle={{ color: '#F3F4F6' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="e1RM" stroke="#a3e635" strokeWidth={3} name="e1RM (kg)">
                                        <LabelList dataKey="e1RM" position="top" fill="#FFFFFF" fontSize={14} fontWeight="bold" offset={5} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
