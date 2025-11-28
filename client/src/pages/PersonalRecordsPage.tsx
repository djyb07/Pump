import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ExercisePR {
    exerciseId: string;
    exerciseName: string;
    bestWeight: number;
    bestWeightDate: string;
    bestVolume: number;
    bestVolumeDate: string;
    bestReps: number;
    bestRepsDate: string;
}

export default function PersonalRecordsPage() {
    const navigate = useNavigate();
    const [records, setRecords] = useState<ExercisePR[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'weight' | 'volume' | 'reps'>('all');

    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/analytics/personal-records`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load personal records');

            const data = await response.json();
            setRecords(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load personal records');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFilteredRecords = () => {
        if (filter === 'all') return records;

        return records.filter(record => {
            if (filter === 'weight') return record.bestWeight > 0;
            if (filter === 'volume') return record.bestVolume > 0;
            if (filter === 'reps') return record.bestReps > 0;
            return true;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 flex items-center justify-center">
                <div className="text-white text-xl">Loading records...</div>
            </div>
        );
    }

    const filteredRecords = getFilteredRecords();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center">
                                🏆 Personal Records
                            </h1>
                            <p className="text-gray-400 mt-1">Your best performances across all exercises</p>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                        >
                            ← Go Back
                        </button>
                    </div>

                    {/* Filter Buttons */}
                    <div className="mt-6 flex space-x-2">
                        {[
                            { value: 'all' as const, label: 'All Records', icon: '🏆' },
                            { value: 'weight' as const, label: 'Weight PRs', icon: '💪' },
                            { value: 'volume' as const, label: 'Volume PRs', icon: '📊' },
                            { value: 'reps' as const, label: 'Reps PRs', icon: '🔥' }
                        ].map(f => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === f.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {f.icon} {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {filteredRecords.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                        <p className="text-xl">No personal records yet</p>
                        <p className="mt-2">Start working out to set your first PRs!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredRecords.map(record => (
                            <div
                                key={record.exerciseId}
                                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all"
                            >
                                {/* Exercise Header */}
                                <button
                                    onClick={() => navigate(`/exercise/${record.exerciseId}/progress`)}
                                    className="w-full text-left mb-4 hover:text-purple-400 transition-colors"
                                >
                                    <h2 className="text-2xl font-bold text-white flex items-center justify-between">
                                        {record.exerciseName}
                                        <span className="text-sm text-gray-400">📊 View Progress</span>
                                    </h2>
                                </button>

                                {/* PR Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Weight PR */}
                                    {record.bestWeight > 0 && (
                                        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-lg p-4">
                                            <div className="text-purple-400 text-sm font-medium mb-1">💪 Weight PR</div>
                                            <div className="text-3xl font-bold text-white">{record.bestWeight} kg</div>
                                            <div className="text-gray-400 text-xs mt-1">{formatDate(record.bestWeightDate)}</div>
                                        </div>
                                    )}

                                    {/* Volume PR */}
                                    {record.bestVolume > 0 && (
                                        <div className="bg-gradient-to-br from-pink-900/30 to-pink-800/20 border border-pink-500/30 rounded-lg p-4">
                                            <div className="text-pink-400 text-sm font-medium mb-1">📊 Volume PR</div>
                                            <div className="text-3xl font-bold text-white">{Math.round(record.bestVolume)} kg</div>
                                            <div className="text-gray-400 text-xs mt-1">{formatDate(record.bestVolumeDate)}</div>
                                        </div>
                                    )}

                                    {/* Reps PR */}
                                    {record.bestReps > 0 && (
                                        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30 rounded-lg p-4">
                                            <div className="text-green-400 text-sm font-medium mb-1">🔥 Reps PR</div>
                                            <div className="text-3xl font-bold text-white">{record.bestReps}</div>
                                            <div className="text-gray-400 text-xs mt-1">{formatDate(record.bestRepsDate)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
