import apiClient from './apiClient';

export interface Exercise {
    id: string;
    nameEn: string;
    nameHe: string;
    descriptionHe: string;
    muscleGroups: string[];
    workoutTypes: string[];
    difficulty: string;
    equipment: string[];
    imageUrl?: string;
    videoUrl?: string;
    muscleDiagramUrl?: string;
}

export const exerciseService = {
    // Get all exercises with optional filters
    async getAll(filters?: {
        muscle?: string;
        workoutType?: string;
        difficulty?: string;
        search?: string;
    }): Promise<Exercise[]> {
        const params = new URLSearchParams();
        if (filters?.muscle) params.append('muscle', filters.muscle);
        if (filters?.workoutType) params.append('workoutType', filters.workoutType);
        if (filters?.difficulty) params.append('difficulty', filters.difficulty);
        if (filters?.search) params.append('search', filters.search);

        const response = await apiClient.get(`/api/exercises?${params}`);
        return response.data;
    },

    // Search exercises
    async search(query: string): Promise<Exercise[]> {
        const response = await apiClient.get(`/api/exercises/search?q=${query}`);
        return response.data;
    },

    // Get single exercise
    async getById(id: string): Promise<Exercise> {
        const response = await apiClient.get(`/api/exercises/${id}`);
        return response.data;
    },
};
