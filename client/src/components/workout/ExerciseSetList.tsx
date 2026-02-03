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

    // Increment/decrement helpers
    const incrementReps = () => {
        const current = parseInt(reps) || 0;
        onRepsChange((current + 1).toString());
    };

    const decrementReps = () => {
        const current = parseInt(reps) || 0;
        if (current > 1) onRepsChange((current - 1).toString());
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
                <h3 className="text-lg sm:text-xl font-bold text-white mb-6">
                    {isEditing ? `Edit Set #${(editingSetIndex ?? 0) + 1}` : `Log Set #${sets.length + 1}`}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    {/* Reps Input with +/- buttons */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">
                            Reps *
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={decrementReps}
                                className="w-16 h-16 flex items-center justify-center bg-slate-900/30 hover:bg-slate-800/50 border border-white/10 rounded-xl text-white text-2xl font-bold transition-all active:scale-95"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                value={reps}
                                onChange={handleRepsChange}
                                className="flex-1 px-4 py-5 bg-slate-900/30 border border-white/10 rounded-xl text-white text-3xl text-center font-bold focus:outline-none focus:ring-2 focus:ring-lime-400/50 min-h-[64px] backdrop-blur-sm"
                                placeholder="0"
                            />
                            <button
                                type="button"
                                onClick={incrementReps}
                                className="w-16 h-16 flex items-center justify-center bg-lime-400 hover:bg-lime-500 rounded-xl text-slate-950 text-2xl font-bold transition-all active:scale-95"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Weight Input with +/- buttons */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">
                            Weight (kg)
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={decrementWeight}
                                className="w-16 h-16 flex items-center justify-center bg-slate-900/30 hover:bg-slate-800/50 border border-white/10 rounded-xl text-white text-2xl font-bold transition-all active:scale-95"
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
                                className="flex-1 px-4 py-5 bg-slate-900/30 border border-white/10 rounded-xl text-white text-3xl text-center font-bold focus:outline-none focus:ring-2 focus:ring-lime-400/50 min-h-[64px] backdrop-blur-sm"
                                placeholder="0"
                            />
                            <button
                                type="button"
                                onClick={incrementWeight}
                                className="w-16 h-16 flex items-center justify-center bg-lime-400 hover:bg-lime-500 rounded-xl text-slate-950 text-2xl font-bold transition-all active:scale-95"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Log Set Button - HERO size */}
                <button
                    onClick={isEditing ? onUpdateSet : onLogSet}
                    disabled={!reps}
                    className="w-full px-6 py-5 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-xl font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[72px] shadow-lg shadow-lime-400/20 active:scale-98"
                >
                    {isEditing ? '✓ Update Set' : '✓ Log Set'}
                </button>
                {isEditing && (
                    <button
                        onClick={onCancelEdit}
                        className="w-full px-6 py-3 mt-3 bg-slate-900/30 hover:bg-slate-800/50 text-white rounded-xl font-semibold transition-all border border-white/10"
                    >
                        Cancel Edit
                    </button>
                )}
            </div>

            {/* Set History */}
            {sets.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Completed Sets</h3>
                    <div className="space-y-3">
                        {sets.map((set, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl gap-3 border border-white/5"
                            >
                                <span className="text-slate-400 font-medium">Set {set.setNumber}</span>
                                <span className="text-white font-bold flex-1 text-center text-lg">
                                    {set.weight ? `${set.weight}kg × ` : ''}{set.reps} reps
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => exerciseLogId && onEditSet(exerciseLogId, index, set)}
                                        className="w-12 h-12 flex items-center justify-center bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-xl text-lg font-semibold transition-all active:scale-95"
                                        title="Edit set"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => exerciseLogId && onRequestDelete(exerciseLogId, index)}
                                        className="w-12 h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-xl text-lg font-semibold transition-all active:scale-95"
                                        title="Delete set"
                                    >
                                        🗑️
                                    </button>
                                    <span className="text-lime-400 text-xl ml-1">✓</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
