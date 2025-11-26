import { useState } from 'react';
import { type DayExercise } from '../services/programService';

interface EditExerciseModalProps {
    dayExercise: DayExercise;
    onSave: (data: { targetSets: number; targetReps: number; targetWeight?: number }) => void;
    onClose: () => void;
}

export default function EditExerciseModal({ dayExercise, onSave, onClose }: EditExerciseModalProps) {
    const [sets, setSets] = useState(dayExercise.targetSets);
    const [reps, setReps] = useState(dayExercise.targetReps);
    const [weight, setWeight] = useState(dayExercise.targetWeight || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            targetSets: sets,
            targetReps: reps,
            targetWeight: weight > 0 ? weight : undefined
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Edit Exercise</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 font-semibold mb-2">
                            {dayExercise.exercise?.nameEn}
                        </label>
                        <p className="text-gray-500 text-sm">
                            {dayExercise.exercise?.muscleGroups.join(', ')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-gray-300 font-medium mb-2">
                            Target Sets
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={sets}
                            onChange={(e) => setSets(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 font-medium mb-2">
                            Target Reps
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={reps}
                            onChange={(e) => setReps(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 font-medium mb-2">
                            Target Weight (kg) - Optional
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={weight}
                            onChange={(e) => setWeight(parseFloat(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
