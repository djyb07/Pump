/**
 * PR (Personal Record) Service
 * 
 * Handles all Personal Record calculation and tracking logic.
 * Extracted from workoutService for better separation of concerns.
 */

import prisma from '../prisma';

export interface SetData {
    weight?: number;
    reps?: number;
    completed?: boolean;
    type?: string;
    rpe?: number;
}

export interface PRResult {
    isWeightPR: boolean;
    isVolumePR: boolean;
    isRepsPR: boolean;
}

export interface ExerciseMetrics {
    maxWeight: number;
    totalVolume: number;
    effectiveVolume: number;
    maxReps: number;
}

/**
 * Calculate metrics from a set of exercise sets.
 * - totalVolume includes ALL sets (for display / workout summary).
 * - effectiveVolume, maxWeight, maxReps exclude WARMUP sets (for PR detection).
 */
export function calculateExerciseMetrics(sets: SetData[]): ExerciseMetrics {
    if (!sets || sets.length === 0) {
        return { maxWeight: 0, totalVolume: 0, effectiveVolume: 0, maxReps: 0 };
    }

    // Total volume includes every set (warmup included)
    const totalVolume = sets.reduce((sum, s) =>
        sum + (s.weight || 0) * (s.reps || 0), 0
    );

    // Working sets = everything except WARMUP (for PRs / stats)
    const workingSets = sets.filter(s => (s.type || 'NORMAL') !== 'WARMUP');

    if (workingSets.length === 0) {
        return { maxWeight: 0, totalVolume, effectiveVolume: 0, maxReps: 0 };
    }

    const maxWeight = Math.max(...workingSets.map(s => s.weight || 0));
    const effectiveVolume = workingSets.reduce((sum, s) =>
        sum + (s.weight || 0) * (s.reps || 0), 0
    );
    const maxReps = Math.max(...workingSets.map(s => s.reps || 0));

    return { maxWeight, totalVolume, effectiveVolume, maxReps };
}

/**
 * Determine if new metrics beat previous metrics.
 * Uses effectiveVolume (excludes warmup) for volume PR comparison.
 */
export function isPR(
    current: ExerciseMetrics,
    previous: ExerciseMetrics
): PRResult {
    return {
        isWeightPR: current.maxWeight > previous.maxWeight && current.maxWeight > 0,
        isVolumePR: current.effectiveVolume > previous.effectiveVolume && current.effectiveVolume > 0,
        isRepsPR: current.maxReps > previous.maxReps && current.maxReps > 0
    };
}

/**
 * Batch calculate PRs for multiple exercise logs
 * Optimized: Fetches all previous logs in a single query instead of N queries
 */
export async function calculatePRsForExerciseLogs(
    exerciseLogs: Array<{ id: string; exerciseId: string; sets: any[] }>,
    userId: string,
    currentWorkoutLogId: string
): Promise<Map<string, PRResult>> {
    const results = new Map<string, PRResult>();

    // Get all unique exercise IDs
    const exerciseIds = [...new Set(
        exerciseLogs.map(log => log.exerciseId).filter(id => id)
    )];

    if (exerciseIds.length === 0) {
        return results;
    }

    // OPTIMIZED: Single batch query for all previous logs
    const allPreviousLogs = await prisma.exerciseLog.findMany({
        where: {
            exerciseId: { in: exerciseIds },
            workoutLog: {
                userId,
                status: 'completed'
            },
            workoutLogId: { not: currentWorkoutLogId }
        },
        select: {
            exerciseId: true,
            sets: true
        }
    });

    // Group previous logs by exercise ID
    const previousLogsByExercise = new Map<string, Array<{ sets: any[] }>>();
    for (const log of allPreviousLogs) {
        const existing = previousLogsByExercise.get(log.exerciseId) || [];
        existing.push({ sets: log.sets as any[] });
        previousLogsByExercise.set(log.exerciseId, existing);
    }

    // Calculate PRs for each exercise log
    for (const exerciseLog of exerciseLogs) {
        const currentMetrics = calculateExerciseMetrics(exerciseLog.sets);

        // Get best previous metrics for this exercise
        const previousLogs = previousLogsByExercise.get(exerciseLog.exerciseId) || [];
        let bestPreviousMetrics: ExerciseMetrics = { maxWeight: 0, totalVolume: 0, effectiveVolume: 0, maxReps: 0 };

        for (const prevLog of previousLogs) {
            const prevMetrics = calculateExerciseMetrics(prevLog.sets);
            bestPreviousMetrics = {
                maxWeight: Math.max(bestPreviousMetrics.maxWeight, prevMetrics.maxWeight),
                totalVolume: Math.max(bestPreviousMetrics.totalVolume, prevMetrics.totalVolume),
                effectiveVolume: Math.max(bestPreviousMetrics.effectiveVolume, prevMetrics.effectiveVolume),
                maxReps: Math.max(bestPreviousMetrics.maxReps, prevMetrics.maxReps)
            };
        }

        // If no previous logs, everything is a PR (if > 0)
        if (previousLogs.length === 0) {
            results.set(exerciseLog.id, {
                isWeightPR: currentMetrics.maxWeight > 0,
                isVolumePR: currentMetrics.effectiveVolume > 0,
                isRepsPR: currentMetrics.maxReps > 0
            });
        } else {
            results.set(exerciseLog.id, isPR(currentMetrics, bestPreviousMetrics));
        }
    }

    return results;
}

/**
 * Batch update exercise logs with PR flags
 */
export async function batchUpdatePRFlags(
    prResults: Map<string, PRResult>
): Promise<void> {
    const updates = Array.from(prResults.entries()).map(([id, pr]) =>
        prisma.exerciseLog.update({
            where: { id },
            data: {
                isWeightPR: pr.isWeightPR,
                isVolumePR: pr.isVolumePR,
                isRepsPR: pr.isRepsPR
            }
        })
    );

    await Promise.all(updates);
}
