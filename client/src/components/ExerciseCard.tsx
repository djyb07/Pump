import React from 'react';
import type { Exercise } from '../services/exerciseService';

interface ExerciseCardProps {
    exercise: Exercise;
    onClick: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onClick }) => {
    const difficultyColors = {
        Beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
        Intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        Advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
        <div
            onClick={onClick}
            className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-purple-500/50 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer overflow-hidden"
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                            {exercise.nameHe}
                        </h3>
                        <p className="text-sm text-gray-400">{exercise.nameEn}</p>
                    </div>
                    <span
                        className={`px-2 py-1 rounded-md text-xs font-medium border ${difficultyColors[exercise.difficulty as keyof typeof difficultyColors]
                            }`}
                    >
                        {exercise.difficulty}
                    </span>
                </div>

                {/* Muscle Groups */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {exercise.muscleGroups.slice(0, 3).map((muscle, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md border border-purple-500/30"
                        >
                            {muscle}
                        </span>
                    ))}
                    {exercise.muscleGroups.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-md">
                            +{exercise.muscleGroups.length - 3}
                        </span>
                    )}
                </div>

                {/* Workout Types */}
                <div className="flex flex-wrap gap-1.5">
                    {exercise.workoutTypes.map((type, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-700/50 text-gray-300 text-xs rounded"
                        >
                            {type}
                        </span>
                    ))}
                </div>

                {/* Equipment */}
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <p className="text-xs text-gray-500">
                        🔧 {exercise.equipment.join(', ')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExerciseCard;
