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
                className="relative glass-card-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                >
                    ✕
                </button>

                {/* Content */}
                <div className="p-8">
                    {/* Title */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-lime-400 mb-2">
                            {exercise.nameEn}
                        </h2>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-3 py-1.5 bg-lime-400/20 text-lime-400 rounded-lg border border-lime-400/30 font-medium">
                            {exercise.difficulty}
                        </span>
                        {exercise.muscleGroups.map((muscle, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1.5 bg-slate-800/60 text-slate-300 rounded-lg border border-white/5"
                            >
                                💪 {muscle}
                            </span>
                        ))}
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Exercise Description</h3>
                        <p className="text-slate-300 leading-relaxed">{exercise.descriptionHe}</p>
                    </div>

                    {/* Video/GIF Tutorial */}
                    {exercise.videoUrl && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3">🎬 How to Perform</h3>
                            <div className="rounded-xl overflow-hidden border border-lime-400/30 bg-slate-800/50">
                                {exercise.videoUrl.toLowerCase().includes('.gif') ? (
                                    <img
                                        src={exercise.videoUrl}
                                        alt={`${exercise.nameEn} demonstration`}
                                        className="w-full h-auto"
                                    />
                                ) : (
                                    <video
                                        controls
                                        loop
                                        className="w-full h-auto"
                                        poster={exercise.imageUrl}
                                    >
                                        <source src={exercise.videoUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Step-by-step demonstration of proper form
                            </p>
                        </div>
                    )}

                    {/* Muscle Diagram */}
                    {exercise.muscleDiagramUrl && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3">💪 Target Muscles</h3>
                            <div className="rounded-xl overflow-hidden border border-lime-400/30 bg-white">
                                <img
                                    src={exercise.muscleDiagramUrl}
                                    alt={`${exercise.nameEn} muscle diagram`}
                                    className="w-full h-auto"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-center">
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
                                    className="px-3 py-2 bg-lime-400/20 text-lime-400 rounded-lg border border-lime-400/30"
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
                                    className="px-3 py-2 bg-slate-800/60 text-slate-300 rounded-lg border border-white/5"
                                >
                                    🔧 {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end mt-8">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-white/5"
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
