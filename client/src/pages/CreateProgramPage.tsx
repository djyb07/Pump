import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { programService } from '../services/programService';
import { UnifiedPageHeader } from '../components/layout';
import { PlusCircle, RefreshCw, ArrowUpDown, Activity, ArrowLeftRight, Calendar, Settings, Check, type LucideIcon } from 'lucide-react';

interface SplitType {
    value: string;
    label: string;
    Icon: LucideIcon;
    description: string;
}

const SPLIT_TYPES: SplitType[] = [
    { value: 'PPL', label: 'Push/Pull/Legs', Icon: RefreshCw, description: '3-day split focusing on movement patterns' },
    { value: 'UPPER_LOWER', label: 'Upper/Lower', Icon: ArrowUpDown, description: '2-day split alternating upper and lower body' },
    { value: 'FULL_BODY', label: 'Full Body', Icon: Activity, description: 'Train all muscle groups each session' },
    { value: 'PUSH_PULL', label: 'Push/Pull', Icon: ArrowLeftRight, description: '2-day split by pushing and pulling movements' },
    { value: 'FIVE_DAY', label: '5-Day Split', Icon: Calendar, description: 'Each day targets specific muscle groups' },
    { value: 'CUSTOM', label: 'Custom', Icon: Settings, description: 'Build your own program from scratch' }
];

export default function CreateProgramPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [selectedSplit, setSelectedSplit] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Program name is required');
            return;
        }

        if (!selectedSplit) {
            setError('Please select a split type');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const program = await programService.createProgram({
                name: name.trim(),
                splitType: selectedSplit
            });
            navigate(`/programs/${program.id}`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create program');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative overflow-hidden">
            {/* Background subtle glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <UnifiedPageHeader title="Create New Program" showBackButton icon={PlusCircle} />

                {/* Main Content */}
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Program Name */}
                        <div className="glass-card p-6">
                            <label className="block text-white font-semibold mb-2">
                                Program Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Summer Gains PPL"
                                className="w-full px-4 py-3 bg-slate-800/60 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-colors"
                                maxLength={50}
                            />
                            <p className="text-slate-500 text-sm mt-2">{name.length}/50 characters</p>
                        </div>

                        {/* Split Type Selection */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Select Split Type</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {SPLIT_TYPES.map((split) => (
                                    <div
                                        key={split.value}
                                        onClick={() => setSelectedSplit(split.value)}
                                        className={`group cursor-pointer p-6 rounded-xl transition-all duration-300 ${selectedSplit === split.value
                                            ? 'bg-lime-400/10 border-2 border-lime-400 scale-105'
                                            : 'bg-slate-900/50 border-2 border-white/5 hover:border-lime-400/30 hover:scale-102'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <split.Icon className={`w-10 h-10 ${selectedSplit === split.value ? 'text-lime-400' : 'text-slate-400 group-hover:text-lime-400'}`} />
                                            <div className="flex-1">
                                                <h3 className={`font-bold mb-1 ${selectedSplit === split.value ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                                    }`}>
                                                    {split.label}
                                                </h3>
                                                <p className="text-slate-400 text-sm">{split.description}</p>
                                            </div>
                                            {selectedSplit === split.value && (
                                                <Check className="w-6 h-6 text-lime-400" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/programs')}
                                className="px-6 py-3 bg-slate-800/60 hover:bg-slate-700/60 text-white rounded-lg font-semibold transition-all duration-200 border border-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !name.trim() || !selectedSplit}
                                className="px-6 py-3 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? 'Creating...' : 'Create Program'}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
