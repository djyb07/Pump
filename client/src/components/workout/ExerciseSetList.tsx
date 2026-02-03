import { type SetLog } from '../../services/workoutService';

interface ExerciseSetListProps {
    sets: SetLog[];
    isEditing: boolean;
    editingSetIndex: number | null;
    reps: string;
    weight: string;
    exerciseLogId: string | null;
    onRepsChange: (value: string) => void;
    onWeightChange: (value: string) => void;
    onLogSet: () => void;
    onUpdateSet: () => void;
    onCancelEdit: () => void;
    onEditSet: (exerciseLogId: string, setIndex: number, set: SetLog) => void;
    onRequestDelete: (exerciseLogId: string, setIndex: number) => void;
}

export default function ExerciseSetList({
    sets,
    isEditing,
    editingSetIndex,
    reps,
    weight,
    exerciseLogId,
    onRepsChange,
    onWeightChange,
    onLogSet,
    onUpdateSet,
    onCancelEdit,
    onEditSet,
    onRequestDelete
}: ExerciseSetListProps) {
    const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow empty string for clearing
        if (value === '') {
            onRepsChange('');
            return;
        }
        // Only allow positive integers
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1) {
            onRepsChange(value);
        }
    };

    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow empty string for clearing
        if (value === '') {
            onWeightChange('');
            return;
        }
        // Only allow non-negative numbers
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            onWeightChange(value);
        }
    };

    return (
        <>
            {/* Set Logger */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4">
                    {isEditing ? `Edit Set #${(editingSetIndex ?? 0) + 1}` : `Log Set #${sets.length + 1}`}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Reps *
                        </label>
                        <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            value={reps}
                            onChange={handleRepsChange}
                            className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white text-2xl text-center focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[56px]"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Weight (kg)
                        </label>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            min="0"
                            value={weight}
                            onChange={handleWeightChange}
                            className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white text-2xl text-center focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[56px]"
                            placeholder="0"
                        />
                    </div>
                </div>

                <button
                    onClick={isEditing ? onUpdateSet : onLogSet}
                    disabled={!reps}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-base sm:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
                >
                    {isEditing ? '✓ Update Set' : '✓ Log Set'}
                </button>
                {isEditing && (
                    <button
                        onClick={onCancelEdit}
                        className="w-full px-6 py-2 mt-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                    >
                        Cancel Edit
                    </button>
                )}
            </div>

            {/* Set History */}
            {sets.length > 0 && (
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Completed Sets</h3>
                    <div className="space-y-2">
                        {sets.map((set, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg gap-2"
                            >
                                <span className="text-gray-400">Set {set.setNumber}</span>
                                <span className="text-white font-semibold flex-1 text-center">
                                    {set.weight ? `${set.weight}kg × ` : ''}{set.reps} reps
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => exerciseLogId && onEditSet(exerciseLogId, index, set)}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-all"
                                        title="Edit set"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => exerciseLogId && onRequestDelete(exerciseLogId, index)}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-all"
                                        title="Delete set"
                                    >
                                        🗑️
                                    </button>
                                    <span className="text-green-500">✓</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
