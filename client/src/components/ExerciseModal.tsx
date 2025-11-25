import React from 'react';
import type { Exercise } from '../services/exerciseService';

interface ExerciseModalProps {
    exercise: Exercise | null;
    isOpen: boolean;
    onClose: () => void;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({ exercise, isOpen, onClose }) => {
    if (!isOpen || !exercise) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                >
                    ✕
                </button>

                {/* Content */}
                <div className="p-8">
                    {/* Title */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            {exercise.nameEn}
                        </h2>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 font-medium">
                            {exercise.difficulty}
                        </span>
                        {exercise.muscleGroups.map((muscle, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg border border-gray-700"
                            >
                                💪 {muscle}
                            </span>
                        ))}
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Exercise Description</h3>
                        <p className="text-gray-300 leading-relaxed">{exercise.descriptionHe}</p>
                    </div>

                    {/* Muscle Diagram */}
                    {exercise.muscleDiagramUrl && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3">💪 Target Muscles</h3>
                            <div className="rounded-xl overflow-hidden border-2 border-purple-500/30 bg-gray-800/50">
                                <img
                                    src={exercise.muscleDiagramUrl}
                                    alt={`${exercise.nameEn} muscle diagram`}
                                    className="w-full h-auto"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Visual representation of muscles worked during this exercise
                            </p>
                        </div>
                    )}

                    {/* Workout Types */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Workout Programs</h3>
                        <div className="flex flex-wrap gap-2">
                            {exercise.workoutTypes.map((type, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 rounded-lg border border-purple-500/30"
                                >
                                    {type}Day                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Equipment */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Equipment Required</h3>
                        <div className="flex flex-wrap gap-2">
                            {exercise.equipment.map((item, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700"
                                >
                                    🔧 {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-8">
                        <button className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/50">
                            ➕ Add to Workout
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-gray-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExerciseModal;
