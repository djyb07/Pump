import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

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

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const workoutService = {
    // Start a new workout
    async startWorkout(dayId: string, programId?: string): Promise<WorkoutLog> {
        const response = await axios.post(
            `${API_URL}/workouts/start`,
            { dayId, programId },
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Get active workout (if any)
    async getActiveWorkout(): Promise<WorkoutLog | null> {
        try {
            const response = await axios.get(
                `${API_URL}/workouts/active`,
                { headers: getAuthHeader() }
            );
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
        const response = await axios.post(
            `${API_URL}/workouts/${workoutLogId}/sets`,
            { dayExerciseId, reps, weight, completed },
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Finish workout
    async finishWorkout(workoutLogId: string, notes?: string): Promise<WorkoutLog> {
        const response = await axios.patch(
            `${API_URL}/workouts/${workoutLogId}/finish`,
            { notes },
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Get workout history
    async getWorkoutHistory(limit: number = 20): Promise<WorkoutLog[]> {
        const response = await axios.get(
            `${API_URL}/workouts?limit=${limit}`,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Get specific workout
    async getWorkoutById(workoutLogId: string): Promise<WorkoutLog> {
        const response = await axios.get(
            `${API_URL}/workouts/${workoutLogId}`,
            { headers: getAuthHeader() }
        );
        return response.data;
    }
};
