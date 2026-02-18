import { useState, useRef, useEffect } from 'react';
import { type SetLog, type SetType } from '../../services/workoutService';
import { Check, Pencil, Trash2, MoreVertical, ThermometerSun, Layers, AlertCircle, Dumbbell } from 'lucide-react';

interface ExerciseSetListProps {
    sets: SetLog[];
    isEditing: boolean;
    editingSetIndex: number | null;
    reps: string;
    weight: string;
    setType: SetType;
    rpe: string;
    exerciseLogId: string | null;
    onRepsChange: (value: string) => void;
    onWeightChange: (value: string) => void;
    onSetTypeChange: (value: SetType) => void;
    onRpeChange: (value: string) => void;
    onLogSet: () => void;
    onUpdateSet: () => void;
    onCancelEdit: () => void;
    onEditSet: (exerciseLogId: string, setIndex: number, set: SetLog) => void;
    onRequestDelete: (exerciseLogId: string, setIndex: number) => void;
}

const SET_TYPE_CONFIG: Record<SetType, { label: string; color: string; borderColor: string; icon: React.ComponentType<any> }> = {
    NORMAL: { label: 'Normal', color: 'text-lime-400', borderColor: 'border-lime-400', icon: Dumbbell },
    WARMUP: { label: 'Warmup', color: 'text-amber-400', borderColor: 'border-amber-400', icon: ThermometerSun },
    DROP: { label: 'Dropset', color: 'text-purple-400', borderColor: 'border-purple-400', icon: Layers },
    FAILURE: { label: 'Failure', color: 'text-red-400', borderColor: 'border-red-400', icon: AlertCircle },
};

function SetOptionsMenu({
    setType,
    rpe,
    onSetTypeChange,
    onRpeChange,
}: {
    setType: SetType;
    rpe: string;
    onSetTypeChange: (value: SetType) => void;
    onRpeChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const activeConfig = SET_TYPE_CONFIG[setType];
    const ActiveIcon = activeConfig.icon;

    const handleRpeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            onRpeChange('');
            return;
        }
        const num = parseInt(value);
        if (!isNaN(num) && num >= 1 && num <= 10) {
            onRpeChange(value);
        }
    };

    return (
        <div className="relative">
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${setType === 'NORMAL'
                    ? 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-700/60'
                    : `bg-slate-800/60 ${activeConfig.borderColor} ${activeConfig.color}`
                    }`}
                title="Set options"
            >
                <ActiveIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{activeConfig.label}</span>
                <MoreVertical className="w-3.5 h-3.5 opacity-60" />
            </button>

            {open && (
                <div
                    ref={menuRef}
                    className="absolute right-0 top-full mt-2 z-50 w-72 bg-slate-950 border border-white/10 rounded-xl shadow-2xl p-4"
                >
                    {/* Set Type selector */}
                    <div>
                        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                            Set Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(SET_TYPE_CONFIG) as SetType[]).map((typeKey) => {
                                const cfg = SET_TYPE_CONFIG[typeKey];
                                const Icon = cfg.icon;
                                const isActive = setType === typeKey;
                                return (
                                    <button
                                        key={typeKey}
                                        type="button"
                                        onClick={() => {
                                            onSetTypeChange(typeKey);
                                        }}
                                        className={`flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-semibold transition-all border ${isActive
                                                ? `${cfg.borderColor} bg-lime-400/10 ${cfg.color}`
                                                : 'border-transparent bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* RPE Input */}
                    <div className="mt-4">
                        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                            RPE (1–10)
                        </label>
                        <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="10"
                            value={rpe}
                            onChange={handleRpeChange}
                            className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                            placeholder="—"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ExerciseSetList({
    sets,
    isEditing,
    editingSetIndex,
    reps,
    weight,
    setType,
    rpe,
    exerciseLogId,
    onRepsChange,
    onWeightChange,
    onSetTypeChange,
    onRpeChange,
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
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">
                        {isEditing ? `Edit Set #${(editingSetIndex ?? 0) + 1}` : `Log Set #${sets.length + 1}`}
                    </h3>
                    <SetOptionsMenu
                        setType={setType}
                        rpe={rpe}
                        onSetTypeChange={onSetTypeChange}
                        onRpeChange={onRpeChange}
                    />
                </div>

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
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                    <Check className="w-5 h-5" /> {isEditing ? 'Update Set' : 'Log Set'}
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
                        {sets.map((set, index) => {
                            const type = (set.type || 'NORMAL') as SetType;
                            const cfg = SET_TYPE_CONFIG[type];
                            const Icon = cfg.icon;
                            const isNonNormal = type !== 'NORMAL';

                            return (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 bg-slate-800/50 rounded-lg gap-2 border-l-2 ${isNonNormal ? cfg.borderColor : 'border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {isNonNormal && (
                                            <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0`} />
                                        )}
                                        <span className={`${isNonNormal ? cfg.color : 'text-slate-400'} text-sm`}>
                                            Set {set.setNumber}
                                        </span>
                                    </div>
                                    <span className="text-white font-semibold flex-1 text-center">
                                        {set.weight ? `${set.weight}kg × ` : ''}{set.reps} reps
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {set.rpe && (
                                            <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-slate-700/60 text-slate-300">
                                                RPE {set.rpe}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => exerciseLogId && onEditSet(exerciseLogId, index, set)}
                                            className="px-3 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg text-sm font-semibold transition-all active:scale-95"
                                            title="Edit set"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => exerciseLogId && onRequestDelete(exerciseLogId, index)}
                                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all active:scale-95"
                                            title="Delete set"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <Check className="w-4 h-4 text-lime-400" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
