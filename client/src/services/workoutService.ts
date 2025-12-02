import apiClient from './apiClient';

const API_URL = `/api`;

// Workout interfaces
export interface WorkoutLog {
    id: string;
    userId: string;
    dayId?: string;
    programId?: string;
    workoutType: string;
    customName?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: string;
    notes?: string;
    day?: any;
    exerciseLogs?: ExerciseLog[];
}

export interface ExerciseLog {
    id: string;
    workoutLogId: string;
    dayExerciseId: string;
    sets: SetLog[];
    isWeightPR?: boolean;
    isVolumePR?: boolean;
    isRepsPR?: boolean;
    notes?: string;
    dayExercise?: any;
}

export interface SetLog {
    setNumber: number;
    weight?: number;
    reps: number;
    completed: boolean;
    timestamp: string;
}

export const workoutService = {
    // Start a new workout
    async startWorkout(dayId: string, programId?: string): Promise<WorkoutLog> {
        const response = await apiClient.post(
            `${API_URL}/workouts/start`,
            { dayId, programId }
        );
        return response.data;
    },

    // Get active workout (if any)
    async getActiveWorkout(): Promise<WorkoutLog | null> {
        try {
            const response = await apiClient.get(`${API_URL}/workouts/active`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null; // No active workout
            }
            throw error;
        }
    },

    // Log a set
    async logSet(
        workoutLogId: string,
        dayExerciseId: string,
        reps: number,
        weight?: number,
        completed: boolean = true
    ): Promise<ExerciseLog> {
        const response = await apiClient.post(
            `${API_URL}/workouts/${workoutLogId}/sets`,
            { dayExerciseId, reps, weight, completed }
        );
        return response.data;
    },

    // Finish workout
    async finishWorkout(workoutLogId: string, notes?: string): Promise<WorkoutLog> {
        const response = await apiClient.patch(
            `${API_URL}/workouts/${workoutLogId}/finish`,
            { notes }
        );
        return response.data;
    },

    // Get workout history
    async getWorkoutHistory(limit: number = 20): Promise<WorkoutLog[]> {
        const response = await apiClient.get(`${API_URL}/workouts?limit=${limit}`);
        return response.data;
    },

    // Get specific workout
    async getWorkoutById(workoutLogId: string): Promise<WorkoutLog> {
        const response = await apiClient.get(`${API_URL}/workouts/${workoutLogId}`);
        return response.data;
    },


    // Delete workout
    async deleteWorkout(workoutId: string): Promise<void> {
        await apiClient.delete(`${API_URL}/workouts/${workoutId}`);
    },

    // Update a set in an active workout
    async updateSet(
        workoutLogId: string,
        exerciseLogId: string,
        setIndex: number,
        reps: number,
        weight?: number
    ): Promise<ExerciseLog> {
        const response = await apiClient.patch(
            `${API_URL}/workouts/${workoutLogId}/sets/${exerciseLogId}/${setIndex}`,
            { reps, weight }
        );
        return response.data;
    },

    // Delete a set from an active workout
    async deleteSet(
        workoutLogId: string,
        exerciseLogId: string,
        setIndex: number
    ): Promise<ExerciseLog> {
        const response = await apiClient.delete(
            `${API_URL}/workouts/${workoutLogId}/sets/${exerciseLogId}/${setIndex}`
        );
        return response.data;
    }
};
