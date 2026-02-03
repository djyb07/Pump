import { useState } from 'react';

interface AddDayModalProps {
    onAdd: (dayName: string) => void;
    onClose: () => void;
}

export default function AddDayModal({ onAdd, onClose }: AddDayModalProps) {
    const [dayName, setDayName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (dayName.trim()) {
            onAdd(dayName.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Add New Day</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl transition-colors"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-300 font-medium mb-2">
                            Day Name
                        </label>
                        <input
                            type="text"
                            value={dayName}
                            onChange={(e) => setDayName(e.target.value)}
                            placeholder='e.g., "Push Day", "Monday"'
                            className="w-full px-4 py-3 bg-slate-800/60 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-colors"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 text-white rounded-lg font-semibold transition-colors border border-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-colors"
                        >
                            Add Day
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
