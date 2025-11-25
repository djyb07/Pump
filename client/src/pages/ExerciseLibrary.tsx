import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exerciseService, type Exercise } from '../services/exerciseService';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseModal from '../components/ExerciseModal';

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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ← חזרה
                                </button>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        ספריית תרגילים
                                    </h1>
                                    <p className="text-gray-500 text-sm">100 תרגילים זמינים</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

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
                                className="w-full px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex flex-wrap gap-3">
                            {/* Workout Type */}
                            <select
                                value={selectedWorkoutType}
                                onChange={(e) => setSelectedWorkoutType(e.target.value)}
                                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">כל סוגי האימון</option>
                                <option value="Push">Push Day</option>
                                <option value="Pull">Pull Day</option>
                                <option value="Leg">Leg Day</option>
                                <option value="Upper">Upper Day</option>
                                <option value="Lower">Lower Day</option>
                                <option value="Full Body">Full Body</option>
                                <option value="Core">Core</option>
                            </select>

                            {/* Muscle Group */}
                            <select
                                value={selectedMuscle}
                                onChange={(e) => setSelectedMuscle(e.target.value)}
                                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">כל קבוצות השרירים</option>
                                <option value="Chest">חזה</option>
                                <option value="Back">גב</option>
                                <option value="Shoulders">כתפיים</option>
                                <option value="Biceps">ביצפס</option>
                                <option value="Triceps">טריצפס</option>
                                <option value="Quads">קוודס</option>
                                <option value="Hamstrings">המסטרינג</option>
                                <option value="Glutes">גלוטס</option>
                                <option value="Calves">שוקיים</option>
                                <option value="Abs">בטן</option>
                                <option value="Core">ליבה</option>
                            </select>

                            {/* Difficulty */}
                            <select
                                value={selectedDifficulty}
                                onChange={(e) => setSelectedDifficulty(e.target.value)}
                                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">כל הרמות</option>
                                <option value="Beginner">מתחיל</option>
                                <option value="Intermediate">בינוני</option>
                                <option value="Advanced">מתקדם</option>
                            </select>

                            {/* Clear Filters */}
                            {(searchQuery || selectedMuscle || selectedWorkoutType || selectedDifficulty) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                                >
                                    ✕ נקה סינון
                                </button>
                            )}
                        </div>

                        {/* Results count */}
                        <p className="text-gray-400 text-sm">
                            מציג {filteredExercises.length} מתוך {exercises.length} תרגילים
                        </p>
                    </div>

                    {/* Exercise Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-400">טוען תרגילים...</p>
                            </div>
                        </div>
                    ) : filteredExercises.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-2xl text-gray-500 mb-2">😔 לא נמצאו תרגילים</p>
                            <p className="text-gray-600">נסה לשנות את הפילטרים</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredExercises.map((exercise) => (
                                <ExerciseCard
                                    key={exercise.id}
                                    exercise={exercise}
                                    onClick={() => setSelectedExercise(exercise)}
                                />
                            ))}
                        </div>
                    )}
                </div>
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
