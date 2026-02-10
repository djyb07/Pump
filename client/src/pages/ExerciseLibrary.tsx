import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { exerciseService, type Exercise } from '../services/exerciseService';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseModal from '../components/ExerciseModal';
import { UnifiedPageHeader, SmartFilterBar } from '../components/layout';
import type { FilterConfig } from '../components/layout';
import { Library, SearchX, Dumbbell, BarChart3, Gauge } from 'lucide-react';

const ExerciseLibrary: React.FC = () => {
    const navigate = useNavigate();
    const [exercises, setExercises] = useState<Exercise[]>([]);
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
        } catch (error) {
            console.error('Error loading exercises:', error);
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    const filteredExercises = useMemo(() => {
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

        return filtered;
    }, [exercises, searchQuery, selectedMuscle, selectedWorkoutType, selectedDifficulty]);

    const hasActiveFilters = !!(searchQuery || selectedMuscle || selectedWorkoutType || selectedDifficulty);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedMuscle('');
        setSelectedWorkoutType('');
        setSelectedDifficulty('');
    };

    const filters: FilterConfig[] = [
        {
            label: 'Workout Type',
            icon: Dumbbell,
            value: selectedWorkoutType,
            onChange: setSelectedWorkoutType,
            options: [
                { value: '', label: 'All Workout Types' },
                { value: 'Push', label: 'Push Day' },
                { value: 'Pull', label: 'Pull Day' },
                { value: 'Leg', label: 'Leg Day' },
                { value: 'Upper', label: 'Upper Day' },
                { value: 'Lower', label: 'Lower Day' },
                { value: 'Full Body', label: 'Full Body' },
                { value: 'Core', label: 'Core' },
            ],
        },
        {
            label: 'Muscle Group',
            icon: BarChart3,
            value: selectedMuscle,
            onChange: setSelectedMuscle,
            options: [
                { value: '', label: 'All Muscle Groups' },
                { value: 'Chest', label: 'Chest' },
                { value: 'Back', label: 'Back' },
                { value: 'Shoulders', label: 'Shoulders' },
                { value: 'Biceps', label: 'Biceps' },
                { value: 'Triceps', label: 'Triceps' },
                { value: 'Quads', label: 'Quads' },
                { value: 'Hamstrings', label: 'Hamstrings' },
                { value: 'Glutes', label: 'Glutes' },
                { value: 'Calves', label: 'Calves' },
                { value: 'Abs', label: 'Abs' },
                { value: 'Core', label: 'Core' },
            ],
        },
        {
            label: 'Difficulty',
            icon: Gauge,
            value: selectedDifficulty,
            onChange: setSelectedDifficulty,
            options: [
                { value: '', label: 'All Levels' },
                { value: 'Beginner', label: 'Beginner' },
                { value: 'Intermediate', label: 'Intermediate' },
                { value: 'Advanced', label: 'Advanced' },
            ],
        },
    ];

    return (
        <div className="relative z-10">
            <UnifiedPageHeader
                title="Exercise Library"
                subtitle={`${exercises.length} exercises available`}
                icon={Library}
            />

            {/* SmartFilterBar (sticky, sticks on scroll) */}
            <SmartFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search exercises... (Hebrew or English)"
                filters={filters}
                resultCount={filteredExercises.length}
                totalCount={exercises.length}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
            />


            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Exercise Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400">Loading exercises...</p>
                        </div>
                    </div>
                ) : filteredExercises.length === 0 ? (
                    <div className="text-center py-20">
                        <SearchX className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-xl text-slate-400 mb-2">No exercises found</p>
                        <p className="text-slate-500">Try changing your filters</p>
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

