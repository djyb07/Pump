import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { programService, type WorkoutProgram } from '../services/programService';

export default function ProgramsPage() {
    const navigate = useNavigate();
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPrograms();
    }, []);

    const loadPrograms = async () => {
        try {
            setLoading(true);
            const data = await programService.getPrograms();
            setPrograms(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load programs');
        } finally {
            setLoading(false);
        }
    };

    const getSplitTypeLabel = (splitType: string) => {
        const labels: Record<string, string> = {
            'PPL': 'Push/Pull/Legs',
            'UPPER_LOWER': 'Upper/Lower',
            'FULL_BODY': 'Full Body',
            'PUSH_PULL': 'Push/Pull',
            'FIVE_DAY': '5-Day Split',
            'CUSTOM': 'Custom'
        };
        return labels[splitType] || splitType;
    };

    const getSplitTypeIcon = (splitType: string) => {
        const icons: Record<string, string> = {
            'PPL': '🔄',
            'UPPER_LOWER': '⬆️⬇️',
            'FULL_BODY': '🏃',
            'PUSH_PULL': '↔️',
            'FIVE_DAY': '5️⃣',
            'CUSTOM': '⚙️'
        };
        return icons[splitType] || '💪';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
                <div className="text-white text-xl">Loading programs...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
            {/* Background orbs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                        {error && (
                                            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                                                {error}
                                            </div>
                                        )}

                                        {programs.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="text-6xl mb-4">🏋️</div>
                                                <h2 className="text-2xl font-bold text-white mb-2">No Programs Yet</h2>
                                                <p className="text-gray-400 mb-6">Create your first workout program to get started</p>
                                                <button
                                                    onClick={() => navigate('/programs/new')}
                                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                                                >
                                                    Create Program
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                                {programs.map((program) => (
                                                    <div
                                                        key={program.id}
                                                        onClick={() => navigate(`/programs/${program.id}`)}
                                                        className="group bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20"
                                                    >
                                                        {/* Header */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="text-4xl">{getSplitTypeIcon(program.splitType)}</div>
                                                            {program.isActive && (
                                                                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Program Name */}
                                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                                            {program.name}
                                                        </h3>

                                                        {/* Split Type */}
                                                        <p className="text-gray-400 text-sm mb-4">
                                                            {getSplitTypeLabel(program.splitType)}
                                                        </p>

                                                        {/* Stats */}
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-500">
                                                                {program.days?.length || 0} Days
                                                            </span>
                                                            <span className="text-gray-500">
                                                                {program.days?.reduce((sum, day) => sum + (day.exercises?.length || 0), 0) || 0} Exercises
                                                            </span>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                                                                style={{ width: program.isActive ? '100%' : '50%' }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </main>
                            </div>
                        </div>
                        );
}
