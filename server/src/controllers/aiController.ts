import { Request, Response } from 'express';
import prisma from '../prisma';
import { generateWeeklyReport } from '../services/aiService';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * POST /api/ai/analyze
 *
 * Generates (or returns cached) AI analysis of the user's recent workouts.
 * Cache is persisted in the User model (aiReport + aiReportDate) to survive
 * server restarts on Render free tier.
 */
export const analyzeWorkouts = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check DB-persisted cache
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { aiReport: true, aiReportDate: true },
        });

        if (user?.aiReport && user?.aiReportDate) {
            const age = Date.now() - new Date(user.aiReportDate).getTime();
            if (age < CACHE_DURATION_MS) {
                return res.json({
                    report: user.aiReport,
                    cached: true,
                    generatedAt: user.aiReportDate,
                });
            }
        }

        // Generate new report
        const report = await generateWeeklyReport(userId);

        // Persist to DB
        await prisma.user.update({
            where: { id: userId },
            data: {
                aiReport: report as any,
                aiReportDate: new Date(),
            },
        });

        return res.json({
            report,
            cached: false,
            generatedAt: new Date(),
        });
    } catch (error: any) {
        console.error('[AI Coach] Error:', error.message);

        if (error.message === 'NOT_ENOUGH_DATA') {
            return res.status(400).json({
                error: 'Not enough workout data. Complete at least one workout to generate an analysis.',
            });
        }

        if (error.message === 'LLM_EMPTY_RESPONSE' || error.message === 'LLM_INVALID_FORMAT') {
            return res.status(502).json({
                error: 'The AI returned an unexpected response. Please try again.',
            });
        }

        return res.status(500).json({
            error: 'Failed to generate AI analysis. Please try again later.',
        });
    }
};
