import React from 'react';
import type { Exercise } from '../services/exerciseService';
import { Dumbbell, Wrench, Info, BarChart3 } from 'lucide-react';

interface ExerciseCardProps {
    exercise: Exercise;
    onClick: () => void;
    onViewProgress?: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onClick, onViewProgress }) => {
    const difficultyColors = {
        Beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
        Intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        Advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
        <div className="group glass-card p-6 hover:border-lime-400/30 transition-all duration-300 overflow-hidden">
            <div className="relative z-10">
                {/* Image placeholder or actual image */}
                {exercise.imageUrl ? (
                    <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                            src={exercise.imageUrl}
                            alt={exercise.nameEn}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                ) : (
                    <div className="mb-4 h-40 bg-slate-800/60 rounded-lg flex items-center justify-center">
                        <Dumbbell className="w-16 h-16 text-slate-600" />
                    </div>
                )}

                {/* Header - English Only */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-lime-400 transition-colors">
                        {exercise.nameEn}
                    </h3>
                    <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${difficultyColors[exercise.difficulty as keyof typeof difficultyColors]
                            }`}
                    >
                        {exercise.difficulty}
                    </span>
                </div>

                {/* Muscle Groups */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {exercise.muscleGroups.slice(0, 3).map((muscle, idx) => (
                        <span
                            key={idx}
                            className="px-2.5 py-1 bg-lime-400/20 text-lime-400 text-xs rounded-lg border border-lime-400/30 font-medium"
                        >
                            {muscle}
                        </span>
                    ))}
                    {exercise.muscleGroups.length > 3 && (
                        <span className="px-2.5 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-lg font-medium">
                            +{exercise.muscleGroups.length - 3}
                        </span>
                    )}
                </div>

                {/* Workout Types */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {exercise.workoutTypes.map((type, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded"
                        >
                            {type}
                        </span>
                    ))}
                </div>

                {/* Equipment */}
                <div className="pt-3 border-t border-white/5 mb-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> {exercise.equipment.join(', ')}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-white rounded-lg font-semibold transition-all text-sm"
                    >
                        <Info className="w-4 h-4" /> Info
                    </button>
                    {onViewProgress && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewProgress();
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-lg font-semibold transition-all text-sm"
                        >
                            <BarChart3 className="w-4 h-4" /> Progress
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExerciseCard;
