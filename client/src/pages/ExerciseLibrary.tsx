import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exerciseService, type Exercise } from '../services/exerciseService';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseModal from '../components/ExerciseModal';
import { UnifiedPageHeader } from '../components/layout';

const ExerciseLibrary: React.FC = () => {
    const navigate = useNavigate();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState('');
    const [selectedWorkoutType, setSelectedWorkoutType] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');

    // Fetch exercises on mount
    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        try {
            setLoading(true);
            const data = await exerciseService.getAll();
            setExercises(data);
            setFilteredExercises(data);
        } catch (error) {
            console.error('Error loading exercises:', error);
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        let filtered = [...exercises];

        if (searchQuery) {
            filtered = filtered.filter(
                (ex) =>
                    ex.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ex.nameHe.includes(searchQuery)
            );
        }

        if (selectedMuscle) {
            filtered = filtered.filter((ex) => ex.muscleGroups.includes(selectedMuscle));
        }

        if (selectedWorkoutType) {
            filtered = filtered.filter((ex) => ex.workoutTypes.includes(selectedWorkoutType));
        }

        if (selectedDifficulty) {
            filtered = filtered.filter((ex) => ex.difficulty === selectedDifficulty);
        }

        setFilteredExercises(filtered);
    }, [searchQuery, selectedMuscle, selectedWorkoutType, selectedDifficulty, exercises]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedMuscle('');
        setSelectedWorkoutType('');
        setSelectedDifficulty('');
    };

    return (
        <div className="relative z-10">
            <UnifiedPageHeader
                title="Exercise Library"
                subtitle="100 exercises available"
                emoji="📚"
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="🔍 חפש תרגיל... (עברית או אנגלית)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-800/60 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                        />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-3">
                        {/* Workout Type */}
                        <select
                            value={selectedWorkoutType}
                            onChange={(e) => setSelectedWorkoutType(e.target.value)}
                            className="px-5 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 hover:border-white/20 transition-all cursor-pointer shadow-lg"
                        >
                            <option value="" className="bg-slate-900">All Workout Types</option>
                            <option value="Push" className="bg-slate-900">💪 Push Day</option>
                            <option value="Pull" className="bg-slate-900">🔙 Pull Day</option>
                            <option value="Leg" className="bg-slate-900">🦵 Leg Day</option>
                            <option value="Upper" className="bg-slate-900">⬆️ Upper Day</option>
                            <option value="Lower" className="bg-slate-900">⬇️ Lower Day</option>
                            <option value="Full Body" className="bg-slate-900">🏋️ Full Body</option>
                            <option value="Core" className="bg-slate-900">💥 Core</option>
                        </select>

                        {/* Muscle Group */}
                        <select
                            value={selectedMuscle}
                            onChange={(e) => setSelectedMuscle(e.target.value)}
                            className="px-5 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 hover:border-white/20 transition-all cursor-pointer shadow-lg"
                        >
                            <option value="" className="bg-slate-900">All Muscle Groups</option>
                            <option value="Chest" className="bg-slate-900">Chest</option>
                            <option value="Back" className="bg-slate-900">Back</option>
                            <option value="Shoulders" className="bg-slate-900">Shoulders</option>
                            <option value="Biceps" className="bg-slate-900">Biceps</option>
                            <option value="Triceps" className="bg-slate-900">Triceps</option>
                            <option value="Quads" className="bg-slate-900">Quads</option>
                            <option value="Hamstrings" className="bg-slate-900">Hamstrings</option>
                            <option value="Glutes" className="bg-slate-900">Glutes</option>
                            <option value="Calves" className="bg-slate-900">Calves</option>
                            <option value="Abs" className="bg-slate-900">Abs</option>
                            <option value="Core" className="bg-slate-900">Core</option>
                        </select>

                        {/* Difficulty */}
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="px-5 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 hover:border-white/20 transition-all cursor-pointer shadow-lg"
                        >
                            <option value="" className="bg-slate-900">All Levels</option>
                            <option value="Beginner" className="bg-slate-900">🟢 Beginner</option>
                            <option value="Intermediate" className="bg-slate-900">🟡 Intermediate</option>
                            <option value="Advanced" className="bg-slate-900">🔴 Advanced</option>
                        </select>

                        {/* Clear Filters */}
                        {(searchQuery || selectedMuscle || selectedWorkoutType || selectedDifficulty) && (
                            <button
                                onClick={clearFilters}
                                className="px-5 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all font-medium shadow-lg"
                            >
                                ✕ Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Results count */}
                    <p className="text-slate-400 text-sm font-medium">
                        Showing {filteredExercises.length} of {exercises.length} exercises
                    </p>
                </div>

                {/* Exercise Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400">טוען תרגילים...</p>
                        </div>
                    </div>
                ) : filteredExercises.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-2xl text-slate-500 mb-2">😔 לא נמצאו תרגילים</p>
                        <p className="text-slate-600">נסה לשנות את הפילטרים</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExercises.map((exercise) => (
                            <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                onClick={() => setSelectedExercise(exercise)}
                                onViewProgress={() => navigate(`/exercise/${exercise.id}/progress`)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Exercise Modal */}
            <ExerciseModal
                exercise={selectedExercise}
                isOpen={!!selectedExercise}
                onClose={() => setSelectedExercise(null)}
            />
        </div>
    );
};

export default ExerciseLibrary;

