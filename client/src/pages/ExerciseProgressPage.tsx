import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

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
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 flex items-center justify-center">
                <div className="text-white text-xl">Loading progress...</div>
            </div>
        );
    }

    if (error || !exercise) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">{error || 'Exercise not found'}</div>
                    <button
                        onClick={() => navigate('/workout/history')}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                    >
                        ← Back to History
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{exercise.nameEn}</h1>
                            <p className="text-gray-400 mt-1">{exercise.nameHe}</p>
                        </div>
                        <button
                            onClick={() => navigate('/workout/history')}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                        >
                            ← Back to History
                        </button>
                    </div>

                    {/* Time Filter */}
                    <div className="mt-6 flex space-x-2">
                        {[
                            { value: '7' as const, label: 'Last 7 Days' },
                            { value: '30' as const, label: 'Last 30 Days' },
                            { value: '90' as const, label: 'Last 90 Days' },
                            { value: 'all' as const, label: 'All Time' }
                        ].map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => setTimeFilter(filter.value)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${timeFilter === filter.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {filteredData.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                        <p className="text-xl">No workout data in this time period</p>
                        <p className="mt-2">Try selecting a longer time range</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Max Weight Chart */}
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">💪 Max Weight Progression</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        labelStyle={{ color: '#F3F4F6' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="maxWeight" stroke="#8B5CF6" strokeWidth={3} name="Max Weight (kg)">
                                        <LabelList dataKey="maxWeight" position="top" fill="#FFFFFF" fontSize={14} fontWeight="bold" offset={5} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Total Volume Chart */}
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">📊 Total Volume Progression</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        labelStyle={{ color: '#F3F4F6' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="totalVolume" stroke="#EC4899" strokeWidth={3} name="Volume (kg)">
                                        <LabelList dataKey="totalVolume" position="top" fill="#FFFFFF" fontSize={14} fontWeight="bold" offset={5} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* e1RM Chart */}
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">🎯 Estimated 1RM Progression</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        labelStyle={{ color: '#F3F4F6' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="e1RM" stroke="#10B981" strokeWidth={3} name="e1RM (kg)">
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
