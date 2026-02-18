import apiClient from './apiClient';

export interface AIReport {
    summary: string;
    positive_feedback: string[];
    areas_for_improvement: string[];
    actionable_tips: string[];
}

export interface AIAnalysisResponse {
    report: AIReport;
    cached: boolean;
    generatedAt: string;
}

export const aiService = {
    async generateAnalysis(): Promise<AIAnalysisResponse> {
        const response = await apiClient.post('/api/ai/analyze');
        return response.data;
    },
};
