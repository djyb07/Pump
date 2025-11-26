import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { programService } from '../services/programService';

const SPLIT_TYPES = [
    { value: 'PPL', label: 'Push/Pull/Legs', icon: '🔄', description: '3-day split focusing on movement patterns' },
    { value: 'UPPER_LOWER', label: 'Upper/Lower', icon: '⬆️⬇️', description: '2-day split alternating upper and lower body' },
    { value: 'FULL_BODY', label: 'Full Body', icon: '🏃', description: 'Train all muscle groups each session' },
    { value: 'PUSH_PULL', label: 'Push/Pull', icon: '↔️', description: '2-day split by pushing and pulling movements' },
    { value: 'FIVE_DAY', label: '5-Day Split', icon: '5️⃣', description: 'Each day targets specific muscle groups' },
    { value: 'CUSTOM', label: 'Custom', icon: '⚙️', description: 'Build your own program from scratch' }
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
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
            {/* Background orbs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => navigate('/programs')}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ← Back
                            </button>
                            <h1 className="text-2xl font-bold text-white">Create New Program</h1>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Program Name */}
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                            <label className="block text-white font-semibold mb-2">
                                Program Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Summer Gains PPL"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                                maxLength={50}
                            />
                            <p className="text-gray-500 text-sm mt-2">{name.length}/50 characters</p>
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
                                                ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-500 scale-105'
                                                : 'bg-gray-900/50 border-2 border-gray-800 hover:border-purple-500/50 hover:scale-102'
                                            }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className="text-4xl">{split.icon}</div>
                                            <div className="flex-1">
                                                <h3 className={`font-bold mb-1 ${selectedSplit === split.value ? 'text-white' : 'text-gray-300 group-hover:text-white'
                                                    }`}>
                                                    {split.label}
                                                </h3>
                                                <p className="text-gray-400 text-sm">{split.description}</p>
                                            </div>
                                            {selectedSplit === split.value && (
                                                <div className="text-green-400 text-2xl">✓</div>
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
                                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-200 border border-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !name.trim() || !selectedSplit}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
