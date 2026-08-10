import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

export interface WorkoutProgram {
    id: string;
    userId: string;
    name: string;
    splitType: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    days?: WorkoutDay[];
}

export interface WorkoutDay {
    id: string;
    programId: string;
    name: string;
    dayType?: string;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
    exercises?: DayExercise[];
}

export interface DayExercise {
    id: string;
    dayId: string;
    exerciseId: string;
    orderIndex: number;
    targetSets: number;
    targetReps: number;
    targetWeight?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    exercise?: {
        id: string;
        nameEn: string;
        nameHe: string;
        descriptionHe: string;
        muscleGroups: string[];
        difficulty: string;
        imageUrl?: string;
    };
}

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const programService = {
    // Get all programs
    async getPrograms() {
        const response = await axios.get<WorkoutProgram[]>(`${API_URL}/programs`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Get program by ID
    async getProgramById(id: string) {
        const response = await axios.get<WorkoutProgram>(`${API_URL}/programs/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Create new program
    async createProgram(data: { name: string; splitType: string }) {
        const response = await axios.post<WorkoutProgram>(`${API_URL}/programs`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Delete program
    async deleteProgram(id: string) {
        const response = await axios.delete(`${API_URL}/programs/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Add day to program
    async addDay(programId: string, data: { name: string; dayType?: string }) {
        const response = await axios.post<WorkoutDay>(`${API_URL}/programs/${programId}/days`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Update day
    async updateDay(dayId: string, data: Partial<WorkoutDay>) {
        const response = await axios.patch<WorkoutDay>(`${API_URL}/days/${dayId}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Delete day
    async deleteDay(dayId: string) {
        const response = await axios.delete(`${API_URL}/days/${dayId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Add exercise to day
    async addExerciseToDay(dayId: string, data: {
        exerciseId: string;
        targetSets?: number;
        targetReps?: number;
        targetWeight?: number;
        notes?: string;
    }) {
        const response = await axios.post<DayExercise>(`${API_URL}/days/${dayId}/exercises`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Update day exercise
    async updateDayExercise(id: string, data: Partial<DayExercise>) {
        const response = await axios.patch<DayExercise>(`${API_URL}/day-exercises/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Remove exercise from day
    async removeDayExercise(id: string) {
        const response = await axios.delete(`${API_URL}/day-exercises/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Get exercise progress
    async getExerciseProgress(exerciseId: string) {
        const response = await axios.get(`${API_URL}/analytics/progress/${exerciseId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};
