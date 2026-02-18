import { Request, Response } from 'express';
import prisma from '../prisma';

// ===== Muscle Group Normalization =====
// Maps granular DB muscle names → 8 display groups for the heatmap
const MUSCLE_GROUP_MAP: Record<string, string> = {
    // Chest
    'Chest': 'Chest',
    'Upper Chest': 'Chest',
    'Inner Chest': 'Chest',
    'Lower Chest': 'Chest',
    // Shoulders
    'Shoulders': 'Shoulders',
    'Side Shoulders': 'Shoulders',
    'Front Shoulders': 'Shoulders',
    'Rear Shoulders': 'Shoulders',
    // Arms
    'Biceps': 'Arms',
    'Triceps': 'Arms',
    'Forearms': 'Arms',
    // Upper Back
    'Lats': 'Upper Back',
    'Mid Back': 'Upper Back',
    'Upper Back': 'Upper Back',
    'Traps': 'Upper Back',
    // Lower Back
    'Lower Back': 'Lower Back',
    // Core
    'Core': 'Core',
    'Abs': 'Core',
    'Obliques': 'Core',
    'Lower Abs': 'Core',
    'Hip Flexors': 'Core',
    // Quads
    'Quads': 'Quads',
    'Inner Thighs': 'Quads',
    'Outer Thighs': 'Quads',
    // Glutes & Hams
    'Glutes': 'Glutes & Hams',
    'Hamstrings': 'Glutes & Hams',
    'Calves': 'Glutes & Hams',
};

const DISPLAY_GROUPS = [
    'Chest', 'Shoulders', 'Arms', 'Upper Back',
    'Lower Back', 'Core', 'Quads', 'Glutes & Hams'
];

interface MuscleAggregation {
    totalSets: number;
    lastTrainedAt: Date | null;
}

/**
 * GET /api/analytics/muscle-recovery
 *
 * Aggregates workout data from the last 7 days to produce a per-muscle-group
 * recovery status for the body heatmap visualization.
 */
export const getMuscleRecovery = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Fetch completed workouts from the last 7 days with their exercise logs
        const recentWorkouts = await prisma.workoutLog.findMany({
            where: {
                userId,
                status: 'completed',
                endTime: { gte: sevenDaysAgo },
            },
            select: {
                endTime: true,
                exerciseLogs: {
                    select: {
                        exerciseId: true,
                        sets: true,
                    },
                },
            },
        });

        // Collect all unique exerciseIds from the logs
        const exerciseIds = new Set<string>();
        for (const workout of recentWorkouts) {
            for (const log of workout.exerciseLogs) {
                if (log.exerciseId) {
                    exerciseIds.add(log.exerciseId);
                }
            }
        }

        // Batch-fetch exercises to get their muscleGroups
        const exercises = await prisma.exercise.findMany({
            where: { id: { in: Array.from(exerciseIds) } },
            select: { id: true, muscleGroups: true },
        });

        const exerciseMuscleMap = new Map<string, string[]>();
        for (const ex of exercises) {
            exerciseMuscleMap.set(ex.id, ex.muscleGroups);
        }

        // Initialize aggregation for all display groups
        const aggregation = new Map<string, MuscleAggregation>();
        for (const group of DISPLAY_GROUPS) {
            aggregation.set(group, { totalSets: 0, lastTrainedAt: null });
        }

        // Aggregate sets per display group
        for (const workout of recentWorkouts) {
            const workoutEnd = workout.endTime;

            for (const log of workout.exerciseLogs) {
                const rawMuscles = exerciseMuscleMap.get(log.exerciseId) || [];
                const sets = log.sets as any[];
                const completedSetCount = sets.filter((s: any) => s.completed !== false).length;

                // Deduplicate display groups per exercise log to avoid double-counting
                const touchedGroups = new Set<string>();
                for (const rawMuscle of rawMuscles) {
                    const displayGroup = MUSCLE_GROUP_MAP[rawMuscle];
                    // Gracefully ignore unknown muscle names
                    if (!displayGroup) continue;
                    touchedGroups.add(displayGroup);
                }

                for (const group of touchedGroups) {
                    const agg = aggregation.get(group)!;
                    agg.totalSets += completedSetCount;

                    if (workoutEnd && (!agg.lastTrainedAt || workoutEnd > agg.lastTrainedAt)) {
                        agg.lastTrainedAt = workoutEnd;
                    }
                }
            }
        }

        // Compute strain score, status, and color per group
        const muscles: Record<string, any> = {};

        for (const [group, agg] of aggregation.entries()) {
            const strainScore = Math.min(100, agg.totalSets * 5);

            let status: string;
            let color: string;
            let daysSinceTraining: number | null = null;

            if (agg.lastTrainedAt) {
                const hoursElapsed = (now.getTime() - agg.lastTrainedAt.getTime()) / (1000 * 60 * 60);
                daysSinceTraining = Math.round((hoursElapsed / 24) * 10) / 10; // 1 decimal

                if (hoursElapsed < 24) {
                    status = 'Recovering';
                    color = 'red';
                } else if (hoursElapsed < 48) {
                    status = 'Resting';
                    color = 'amber';
                } else {
                    status = 'Ready';
                    color = 'lime';
                }
            } else {
                status = 'Ready';
                color = 'lime';
            }

            muscles[group] = {
                totalSets: agg.totalSets,
                strainScore,
                status,
                color,
                daysSinceTraining,
            };
        }

        res.json({ muscles });
    } catch (error) {
        console.error('Error fetching muscle recovery data:', error);
        res.status(500).json({ error: 'Failed to fetch muscle recovery data' });
    }
};
