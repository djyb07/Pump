import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { UnifiedPageHeader, SmartFilterBar } from '../components/layout';
import type { FilterConfig } from '../components/layout';
import { Trophy, Calendar, Dumbbell, BarChart3, Flame } from 'lucide-react';

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

    // Build SmartFilterBar config
    const filters: FilterConfig[] = [
        {
            label: 'Date Range',
            icon: Calendar,
            value: dateRange,
            onChange: (val) => setDateRange(val as any),
            options: [
                { value: 'all', label: 'All Time' },
                { value: '30', label: 'Last 30 Days' },
                { value: '90', label: 'Last 90 Days' },
                { value: '180', label: 'Last 6 Months' },
                { value: '365', label: 'Last Year' },
            ],
        },
        {
            label: 'PR Type',
            icon: Trophy,
            value: prType,
            onChange: (val) => setPrType(val as any),
            options: [
                { value: 'all', label: 'All PRs' },
                { value: 'weight', label: 'Weight PRs' },
                { value: 'volume', label: 'Volume PRs' },
                { value: 'reps', label: 'Reps PRs' },
            ],
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-200 text-xl">Loading records...</div>
            </div>
        );
    }

    return (
        <div className="relative z-10">
            <UnifiedPageHeader
                title="Personal Records"
                subtitle={`${filteredRecords.length} ${filteredRecords.length === 1 ? 'exercise' : 'exercises'}${hasActiveFilters ? ` (filtered from ${records.length})` : ''}`}
                icon={Trophy}
            />

            {/* SmartFilterBar (sticky, sticks on scroll) */}
            <SmartFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search exercises..."
                filters={filters}
                resultCount={filteredRecords.length}
                totalCount={records.length}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
            />


            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {filteredRecords.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                        <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
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
                                        <span className="flex items-center gap-1.5 text-sm text-slate-400">
                                            <BarChart3 className="w-4 h-4" /> View Progress
                                        </span>
                                    </h2>
                                </button>

                                {/* PR Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Weight PR */}
                                    {record.bestWeight > 0 && (prType === 'all' || prType === 'weight') && (
                                        <div className="bg-lime-400/10 border border-lime-400/30 rounded-lg p-4">
                                            <div className="flex items-center gap-1.5 text-lime-400 text-sm font-medium mb-1">
                                                <Dumbbell className="w-4 h-4" /> Weight PR
                                            </div>
                                            <div className="text-3xl font-bold text-white">{record.bestWeight} kg</div>
                                            <div className="text-slate-400 text-xs mt-1">{formatDate(record.bestWeightDate)}</div>
                                        </div>
                                    )}

                                    {/* Volume PR */}
                                    {record.bestVolume > 0 && (prType === 'all' || prType === 'volume') && (
                                        <div className="bg-lime-400/10 border border-lime-400/30 rounded-lg p-4">
                                            <div className="flex items-center gap-1.5 text-lime-400 text-sm font-medium mb-1">
                                                <BarChart3 className="w-4 h-4" /> Volume PR
                                            </div>
                                            <div className="text-3xl font-bold text-white">{Math.round(record.bestVolume)} kg</div>
                                            <div className="text-slate-400 text-xs mt-1">{formatDate(record.bestVolumeDate)}</div>
                                        </div>
                                    )}

                                    {/* Reps PR */}
                                    {record.bestReps > 0 && (prType === 'all' || prType === 'reps') && (
                                        <div className="bg-lime-400/10 border border-lime-400/30 rounded-lg p-4">
                                            <div className="flex items-center gap-1.5 text-lime-400 text-sm font-medium mb-1">
                                                <Flame className="w-4 h-4" /> Reps PR
                                            </div>
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
