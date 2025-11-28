import { Request, Response } from 'express';
import prisma from '../prisma';

// Recalculate PRs for all completed workouts
export const recalculatePRs = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get all completed workouts for this user
        const workouts = await prisma.workoutLog.findMany({
            where: {
                userId,
                status: 'completed'
            },
            include: {
                exerciseLogs: true
            },
            orderBy: {
                startTime: 'asc' // Process in chronological order
            }
        });

        let updatedCount = 0;

        // Process each workout in order
        for (const workout of workouts) {
            for (const exerciseLog of workout.exerciseLogs) {
                const sets = exerciseLog.sets as any[];
                if (!sets || sets.length === 0) continue;

                const maxWeight = Math.max(...sets.map((s: any) => s.weight || 0));
                const totalVolume = sets.reduce((sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0);
                const maxReps = Math.max(...sets.map((s: any) => s.reps || 0));

                // Get previous logs for this exercise (workouts before this one)
                const previousLogs = await prisma.exerciseLog.findMany({
                    where: {
                        exerciseId: exerciseLog.exerciseId,
                        workoutLog: {
                            userId,
                            status: 'completed',
                            startTime: {
                                lt: workout.startTime
                            }
                        }
                    }
                });

                // Determine if PRs were set
                let isWeightPR = true;
                let isVolumePR = true;
                let isRepsPR = true;

                for (const prevLog of previousLogs) {
                    const prevSets = prevLog.sets as any[];
                    if (!prevSets || prevSets.length === 0) continue;

                    const prevMaxWeight = Math.max(...prevSets.map((s: any) => s.weight || 0));
                    const prevTotalVolume = prevSets.reduce((sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0);
                    const prevMaxReps = Math.max(...prevSets.map((s: any) => s.reps || 0));

                    if (prevMaxWeight >= maxWeight) isWeightPR = false;
                    if (prevTotalVolume >= totalVolume) isVolumePR = false;
                    if (prevMaxReps >= maxReps) isRepsPR = false;
                }

                // Update exercise log with PR flags
                await prisma.exerciseLog.update({
                    where: { id: exerciseLog.id },
                    data: {
                        isWeightPR: isWeightPR && maxWeight > 0,
                        isVolumePR: isVolumePR && totalVolume > 0,
                        isRepsPR: isRepsPR && maxReps > 0
                    }
                });

                updatedCount++;
            }
        }

        res.json({
            message: 'PRs recalculated successfully',
            workoutsProcessed: workouts.length,
            exerciseLogsUpdated: updatedCount
        });
    } catch (error) {
        console.error('Error recalculating PRs:', error);
        res.status(500).json({ error: 'Failed to recalculate PRs' });
    }
};
