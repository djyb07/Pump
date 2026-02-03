import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

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

    // Filter state
    const [dateRange, setDateRange] = useState<'30' | '90' | '180' | '365' | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [prType, setPrType] = useState<'all' | 'weight' | 'volume' | 'reps'>('all');

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const response = await apiClient.get(`/api/analytics/personal-records`);
            setRecords(response.data);
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

    // Apply filters
    const filteredRecords = useMemo(() => {
        let filtered = [...records];

        // Date range filter - filter by most recent PR date
        if (dateRange !== 'all') {
            const days = parseInt(dateRange);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            filtered = filtered.filter(record => {
                const mostRecentPRDate = [
                    new Date(record.bestWeightDate),
                    new Date(record.bestVolumeDate),
                    new Date(record.bestRepsDate)
                ].sort((a, b) => b.getTime() - a.getTime())[0];

                return mostRecentPRDate >= cutoffDate;
            });
        }

        // Exercise name search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(record =>
                record.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // PR type filter
        if (prType !== 'all') {
            filtered = filtered.filter(record => {
                if (prType === 'weight') return record.bestWeight > 0;
                if (prType === 'volume') return record.bestVolume > 0;
                if (prType === 'reps') return record.bestReps > 0;
                return true;
            });
        }

        return filtered;
    }, [records, dateRange, searchQuery, prType]);

    const hasActiveFilters = dateRange !== 'all' || searchQuery.trim() !== '' || prType !== 'all';

    const clearFilters = () => {
        setDateRange('all');
        setSearchQuery('');
        setPrType('all');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-200 text-xl">Loading records...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="bg-slate-900/60 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                                🏆 Personal Records
                            </h1>
                            <p className="text-slate-400 mt-1">
                                {filteredRecords.length} {filteredRecords.length === 1 ? 'exercise' : 'exercises'}
                                {hasActiveFilters && ` (filtered from ${records.length})`}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all"
                        >
                            ← Go Back
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-slate-900/60 border-b border-white/5 md:sticky md:top-[89px] z-10 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Date Range Filter */}
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">📅 Date Range</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                                className="w-full px-4 py-2 bg-slate-800/60 border border-white/5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime-400/50">
                                <option value="all">All Time</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                                <option value="180">Last 6 Months</option>
                                <option value="365">Last Year</option>
                            </select>
                        </div>

                        {/* Exercise Search */}
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">💪 Exercise Search</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search exercises..."
                                className="w-full px-4 py-2 bg-slate-800/60 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                            />
                        </div>

                        {/* PR Type Filter */}
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">🏆 PR Type</label>
                            <select
                                value={prType}
                                onChange={(e) => setPrType(e.target.value as any)}
                                className="w-full px-4 py-2 bg-slate-800/60 border border-white/5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime-400/50">
                                <option value="all">All PRs</option>
                                <option value="weight">Weight PRs</option>
                                <option value="volume">Volume PRs</option>
                                <option value="reps">Reps PRs</option>
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-slate-400 text-sm">
                                {filteredRecords.length} result{filteredRecords.length !== 1 ? 's' : ''} found
                            </span>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 rounded-lg text-sm font-semibold transition-all">
                                ✕ Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {filteredRecords.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                        <div className="text-6xl mb-4">🏆</div>
                        <p className="text-xl mb-2">
                            {hasActiveFilters ? 'No PRs match your filters' : 'No personal records yet'}
                        </p>
                        <p className="mt-2">
                            {hasActiveFilters
                                ? 'Try adjusting your filters'
                                : 'Start working out to set your first PRs!'
                            }
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 px-6 py-3 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-bold transition-all">
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredRecords.map(record => (
                            <div
                                key={record.exerciseId}
                                className="glass-card p-6 hover:border-lime-400/30 transition-all"
                            >
                                {/* Exercise Header */}
                                <button
                                    onClick={() => navigate(`/exercise/${record.exerciseId}/progress`)}
                                    className="w-full text-left mb-4 hover:text-lime-400 transition-colors"
                                >
                                    <h2 className="text-2xl font-bold text-white flex items-center justify-between">
                                        {record.exerciseName}
                                        <span className="text-sm text-slate-400">📊 View Progress</span>
                                    </h2>
                                </button>

                                {/* PR Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Weight PR */}
                                    {record.bestWeight > 0 && (prType === 'all' || prType === 'weight') && (
                                        <div className="bg-lime-400/10 border border-lime-400/30 rounded-lg p-4">
                                            <div className="text-lime-400 text-sm font-medium mb-1">💪 Weight PR</div>
                                            <div className="text-3xl font-bold text-white">{record.bestWeight} kg</div>
                                            <div className="text-slate-400 text-xs mt-1">{formatDate(record.bestWeightDate)}</div>
                                        </div>
                                    )}

                                    {/* Volume PR */}
                                    {record.bestVolume > 0 && (prType === 'all' || prType === 'volume') && (
                                        <div className="bg-lime-400/10 border border-lime-400/30 rounded-lg p-4">
                                            <div className="text-lime-400 text-sm font-medium mb-1">📊 Volume PR</div>
                                            <div className="text-3xl font-bold text-white">{Math.round(record.bestVolume)} kg</div>
                                            <div className="text-slate-400 text-xs mt-1">{formatDate(record.bestVolumeDate)}</div>
                                        </div>
                                    )}

                                    {/* Reps PR */}
                                    {record.bestReps > 0 && (prType === 'all' || prType === 'reps') && (
                                        <div className="bg-lime-400/10 border border-lime-400/30 rounded-lg p-4">
                                            <div className="text-lime-400 text-sm font-medium mb-1">🔥 Reps PR</div>
                                            <div className="text-3xl font-bold text-white">{record.bestReps}</div>
                                            <div className="text-slate-400 text-xs mt-1">{formatDate(record.bestRepsDate)}</div>
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
