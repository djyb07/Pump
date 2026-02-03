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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-200 text-xl">Loading programs...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-white/5 backdrop-blur-md bg-slate-900/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    ← Back
                                </button>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">My Programs</h1>
                            </div>
                            <button
                                onClick={() => navigate('/programs/new')}
                                className="w-full sm:w-auto px-4 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg min-h-[44px]"                            >
                                + New Program
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {error && (
                        <div className="mb-4 p-4 bg-red-900/50 border border-red-500/30 rounded-lg text-red-200">
                            {error}
                        </div>
                    )}

                    {programs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🏋️</div>
                            <h2 className="text-2xl font-bold text-white mb-2">No Programs Yet</h2>
                            <p className="text-slate-400 mb-6">Create your first workout program to get started</p>
                            <button
                                onClick={() => navigate('/programs/new')}
                                className="px-6 py-3 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                            >
                                Create Program
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">                            {programs.map((program) => (
                            <div
                                key={program.id}
                                onClick={() => navigate(`/programs/${program.id}`)}
                                className="group glass-card p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-lime-400/30"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="text-4xl">{getSplitTypeIcon(program.splitType)}</div>
                                    {program.isActive && (
                                        <span className="px-3 py-1 bg-lime-400/20 text-lime-400 rounded-full text-xs font-medium border border-lime-400/30">
                                            Active
                                        </span>
                                    )}
                                </div>

                                {/* Program Name */}
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-lime-400 transition-colors">
                                    {program.name}
                                </h3>

                                {/* Split Type */}
                                <p className="text-slate-400 text-sm mb-4">
                                    {getSplitTypeLabel(program.splitType)}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">
                                        {program.days?.length || 0} Days
                                    </span>
                                    <span className="text-slate-500">
                                        {program.days?.reduce((sum, day) => sum + (day.exercises?.length || 0), 0) || 0} Exercises
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-lime-400 transition-all duration-1000"
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
