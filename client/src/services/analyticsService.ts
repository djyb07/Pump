import apiClient from './apiClient';

export interface MuscleRecoveryData {
    totalSets: number;
    strainScore: number;
    status: 'Recovering' | 'Resting' | 'Ready';
    color: 'red' | 'amber' | 'lime';
    daysSinceTraining: number | null;
}

export interface MuscleRecoveryResponse {
    muscles: Record<string, MuscleRecoveryData>;
}

export const analyticsService = {
    async getMuscleRecovery(): Promise<MuscleRecoveryResponse> {
        const response = await apiClient.get('/api/analytics/muscle-recovery');
        return response.data;
    },
};
