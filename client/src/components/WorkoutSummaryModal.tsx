import { Check, Trophy, Flame, Dumbbell } from 'lucide-react';

interface WorkoutSummaryModalProps {
    workout: {
        id: string;
        duration?: number;
        exerciseLogs?: any[];
        day?: {
            name: string;
            program?: {
                name: string;
            };
        };
    };
    onClose: () => void;
}

export default function WorkoutSummaryModal({ workout, onClose }: WorkoutSummaryModalProps) {
    const calculateTotalVolume = () => {
        let total = 0;
        workout.exerciseLogs?.forEach(log => {
            const sets = log.sets as any[];
            sets.forEach((set: any) => {
                if (set.weight && set.reps) {
                    total += set.weight * set.reps;
                }
            });
        });
        return Math.round(total);
    };

    const getTotalSets = () => {
        let total = 0;
        workout.exerciseLogs?.forEach(log => {
            const sets = log.sets as any[];
            total += sets.length;
        });
        return total;
    };

    const getPRs = () => {
        const prs: string[] = [];
        workout.exerciseLogs?.forEach(log => {
            if (log.isWeightPR || log.isVolumePR || log.isRepsPR) {
                const exerciseName = log.dayExercise?.exercise?.nameHe || 'Unknown';
                const prTypes = [];
                if (log.isWeightPR) prTypes.push('Weight');
                if (log.isVolumePR) prTypes.push('Volume');
                if (log.isRepsPR) prTypes.push('Reps');
                prs.push(`${exerciseName} (${prTypes.join(', ')})`);
            }
        });
        return prs;
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '0 min';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const volume = calculateTotalVolume();
    const totalSets = getTotalSets();
    const prs = getPRs();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card-lg max-w-md w-full p-8 border-lime-400/30">
                {/* Success Icon */}
                <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-lime-400/20 rounded-full mb-4">
                        <Check className="w-12 h-12 text-lime-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Workout Complete!</h2>
                    <p className="text-slate-400">
                        {workout.day?.name} • {workout.day?.program?.name}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-slate-400 text-sm mb-1">Duration</div>
                        <div className="text-2xl font-bold text-white">
                            {formatDuration(workout.duration)}
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-slate-400 text-sm mb-1">Exercises</div>
                        <div className="text-2xl font-bold text-white">
                            {workout.exerciseLogs?.length || 0}
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-slate-400 text-sm mb-1">Total Sets</div>
                        <div className="text-2xl font-bold text-white">{totalSets}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-slate-400 text-sm mb-1">Total Volume</div>
                        <div className="text-2xl font-bold text-white">
                            {volume.toLocaleString()} kg
                        </div>
                    </div>
                </div>

                {/* Personal Records */}
                {prs.length > 0 && (
                    <div className="bg-lime-400/10 border border-lime-400/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center space-x-2 mb-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h3 className="text-lg font-bold text-lime-400">
                                {prs.length} Personal Record{prs.length > 1 ? 's' : ''}!
                            </h3>
                        </div>
                        <ul className="space-y-1">
                            {prs.map((pr, index) => (
                                <li key={index} className="text-lime-300 text-sm">
                                    • {pr}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Motivational Message */}
                <div className="text-center mb-6">
                    <p className="flex items-center justify-center gap-2 text-slate-300 text-lg font-semibold">
                        {prs.length > 0 ? <><Flame className="w-5 h-5 text-orange-500" /> You broke records today!</> : <><Dumbbell className="w-5 h-5 text-lime-400" /> Great work!</>}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                        Keep it up and you'll see amazing results
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-bold transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
