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
        if (value === '') {
            onRepsChange('');
            return;
        }
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1) {
            onRepsChange(value);
        }
    };

    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            onWeightChange('');
            return;
        }
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            onWeightChange(value);
        }
    };

    // Increment/decrement helpers
    const incrementReps = () => {
        const current = parseInt(reps) || 0;
        onRepsChange((current + 1).toString());
    };

    const decrementReps = () => {
        const current = parseInt(reps) || 0;
        if (current > 0) onRepsChange((current - 1).toString());
    };

    const incrementWeight = () => {
        const current = parseFloat(weight) || 0;
        onWeightChange((current + 2.5).toString());
    };

    const decrementWeight = () => {
        const current = parseFloat(weight) || 0;
        if (current >= 2.5) onWeightChange((current - 2.5).toString());
    };

    return (
        <>
            {/* Set Logger */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                    {isEditing ? `Edit Set #${(editingSetIndex ?? 0) + 1}` : `Log Set #${sets.length + 1}`}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Reps Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Reps *
                        </label>
                        <div className="flex items-stretch gap-2">
                            <button
                                type="button"
                                onClick={decrementReps}
                                className="w-12 h-14 flex items-center justify-center bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 rounded-lg text-white text-xl font-bold transition-all active:scale-95"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                value={reps}
                                onChange={handleRepsChange}
                                className="flex-1 min-w-0 px-3 py-3 bg-slate-900/30 border border-white/10 rounded-lg text-white text-2xl text-center font-bold focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                                placeholder="0"
                            />
                            <button
                                type="button"
                                onClick={incrementReps}
                                className="w-12 h-14 flex items-center justify-center bg-lime-400 hover:bg-lime-500 rounded-lg text-slate-950 text-xl font-bold transition-all active:scale-95"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Weight Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Weight (kg)
                        </label>
                        <div className="flex items-stretch gap-2">
                            <button
                                type="button"
                                onClick={decrementWeight}
                                className="w-12 h-14 flex items-center justify-center bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 rounded-lg text-white text-xl font-bold transition-all active:scale-95"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.5"
                                min="0"
                                value={weight}
                                onChange={handleWeightChange}
                                className="flex-1 min-w-0 px-3 py-3 bg-slate-900/30 border border-white/10 rounded-lg text-white text-2xl text-center font-bold focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                                placeholder="0"
                            />
                            <button
                                type="button"
                                onClick={incrementWeight}
                                className="w-12 h-14 flex items-center justify-center bg-lime-400 hover:bg-lime-500 rounded-lg text-slate-950 text-xl font-bold transition-all active:scale-95"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Log Set Button */}
                <button
                    onClick={isEditing ? onUpdateSet : onLogSet}
                    disabled={!reps}
                    className="w-full px-6 py-4 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                    {isEditing ? '✓ Update Set' : '✓ Log Set'}
                </button>
                {isEditing && (
                    <button
                        onClick={onCancelEdit}
                        className="w-full px-6 py-3 mt-2 bg-slate-800/60 hover:bg-slate-700/60 text-white rounded-lg font-semibold transition-all border border-white/10"
                    >
                        Cancel Edit
                    </button>
                )}
            </div>

            {/* Set History */}
            {sets.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Completed Sets</h3>
                    <div className="space-y-2">
                        {sets.map((set, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg gap-2"
                            >
                                <span className="text-slate-400">Set {set.setNumber}</span>
                                <span className="text-white font-semibold flex-1 text-center">
                                    {set.weight ? `${set.weight}kg × ` : ''}{set.reps} reps
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => exerciseLogId && onEditSet(exerciseLogId, index, set)}
                                        className="px-3 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg text-sm font-semibold transition-all active:scale-95"
                                        title="Edit set"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => exerciseLogId && onRequestDelete(exerciseLogId, index)}
                                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all active:scale-95"
                                        title="Delete set"
                                    >
                                        🗑️
                                    </button>
                                    <span className="text-lime-400">✓</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
