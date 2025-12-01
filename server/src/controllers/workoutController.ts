import { Request, Response } from 'express';
import prisma from '../prisma';
import { workoutService } from '../services/workoutService';

// ===== NEW WORKFLOW =====

// Start a new workout session
export const startWorkout = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { dayId, programId } = req.body;

        if (!dayId) {
            return res.status(400).json({ error: 'Day ID is required' });
        }

        const workout = await workoutService.startWorkout(userId, { dayId, programId });
        res.json(workout);
    } catch (error: any) {
        console.error('Error starting workout:', error);
        res.status(500).json({ error: error.message || 'Failed to start workout' });
    }
};

// Log a set (add to existing workout)
export const logSet = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id: workoutLogId } = req.params;
        const { dayExerciseId, weight, reps, completed } = req.body;

        if (!dayExerciseId || reps === undefined) {
            return res.status(400).json({ error: 'dayExerciseId and reps are required' });
        }

        const exerciseLog = await workoutService.logSet(workoutLogId, userId, {
            dayExerciseId,
            weight,
            reps,
            completed: completed ?? true
        });

        res.json(exerciseLog);
    } catch (error: any) {
        console.error('Error logging set:', error);
        res.status(500).json({ error: error.message || 'Failed to log set' });
    }
};

// Finish current workout
export const finishWorkout = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id: workoutLogId } = req.params;
        const { notes } = req.body;

        const workout = await workoutService.finishWorkout(workoutLogId, userId, { notes });
        res.json(workout);
    } catch (error: any) {
        console.error('Error finishing workout:', error);
        res.status(500).json({ error: error.message || 'Failed to finish workout' });
    }
};

// Get active (in-progress) workout
export const getActiveWorkout = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const workout = await workoutService.getActiveWorkout(userId);

        if (!workout) {
            return res.status(404).json({ error: 'No active workout found' });
        }

        res.json(workout);
    } catch (error: any) {
        console.error('Error getting active workout:', error);
        res.status(500).json({ error: error.message || 'Failed to get active workout' });
    }
};

// ===== EXISTING ENDPOINTS (kept for compatibility) =====

// Get workout history for user
export const getWorkoutHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const workouts = await workoutService.getWorkoutHistory(userId, limit);
        res.json(workouts);
    } catch (error: any) {
        console.error('Error getting workout history:', error);
        res.status(500).json({ error: error.message || 'Failed to get workout history' });
    }
};

// Get specific workout log
export const getWorkoutById = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id: workoutLogId } = req.params;

        const workout = await workoutService.getWorkoutById(workoutLogId, userId);
        res.json(workout);
    } catch (error: any) {
        console.error('Error getting workout:', error);
        res.status(500).json({ error: error.message || 'Failed to get workout' });
    }
};

// Get progress for a specific exercise
export const getExerciseProgress = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { exerciseId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get all logs for this exercise using exerciseId field
        const logs = await prisma.exerciseLog.findMany({
            where: {
                exerciseId,
                workoutLog: {
                    userId,
                    status: 'completed'
                }
            },
            include: {
                workoutLog: {
                    select: {
                        startTime: true,
                        duration: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Calculate stats including e1RM
        const progressData = logs.map(log => {
            const sets = log.sets as any[];
            const maxWeight = Math.max(...sets.map((s: any) => s.weight || 0));
            const totalReps = sets.reduce((sum: number, s: any) => sum + (s.reps || 0), 0);
            const totalVolume = sets.reduce((sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0);

            // Calculate e1RM (Epley formula) from best set
            let bestE1RM = 0;
            sets.forEach((s: any) => {
                if (s.weight && s.reps) {
                    const e1rm = s.weight * (1 + s.reps / 30);
                    if (e1rm > bestE1RM) bestE1RM = e1rm;
                }
            });

            return {
                date: log.workoutLog.startTime,
                maxWeight,
                totalReps,
                totalVolume,
                sets: sets.length,
                e1RM: Math.round(bestE1RM * 10) / 10 // Round to 1 decimal
            };
        });

        // Get exercise info from first log's exerciseName, or fetch from DB
        let exerciseInfo = null;
        if (logs.length > 0) {
            exerciseInfo = {
                id: exerciseId,
                nameEn: logs[0].exerciseName,
                nameHe: logs[0].exerciseName
            };
        } else {
            // If no logs, fetch exercise from DB
            const exercise = await prisma.exercise.findUnique({
                where: { id: exerciseId }
            });
            if (exercise) {
                exerciseInfo = {
                    id: exercise.id,
                    nameEn: exercise.nameEn,
                    nameHe: exercise.nameHe
                };
            }
        }

        res.json({
            exercise: exerciseInfo,
            progress: progressData
        });
    } catch (error) {
        console.error('Error fetching exercise progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
};

// Get all personal records for user
export const getPersonalRecords = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get all completed workouts with exercise logs that have PRs
        const exerciseLogs = await prisma.exerciseLog.findMany({
            where: {
                workoutLog: {
                    userId,
                    status: 'completed'
                },
                OR: [
                    { isWeightPR: true },
                    { isVolumePR: true },
                    { isRepsPR: true }
                ]
            },
            include: {
                dayExercise: {
                    include: {
                        exercise: true
                    }
                },
                workoutLog: {
                    select: {
                        startTime: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Group by exercise and find best records
        const recordsMap = new Map<string, any>();

        exerciseLogs.forEach(log => {
            const exercise = log.dayExercise?.exercise;
            if (!exercise) return;

            const sets = log.sets as any[];
            const maxWeight = Math.max(...sets.map((s: any) => s.weight || 0));
            const totalVolume = sets.reduce((sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0);
            const maxReps = Math.max(...sets.map((s: any) => s.reps || 0));

            const existing = recordsMap.get(exercise.id);

            if (!existing) {
                recordsMap.set(exercise.id, {
                    exerciseId: exercise.id,
                    exerciseName: exercise.nameEn,
                    bestWeight: log.isWeightPR ? maxWeight : 0,
                    bestWeightDate: log.isWeightPR ? log.workoutLog.startTime : null,
                    bestVolume: log.isVolumePR ? totalVolume : 0,
                    bestVolumeDate: log.isVolumePR ? log.workoutLog.startTime : null,
                    bestReps: log.isRepsPR ? maxReps : 0,
                    bestRepsDate: log.isRepsPR ? log.workoutLog.startTime : null
                });
            } else {
                if (log.isWeightPR && maxWeight > existing.bestWeight) {
                    existing.bestWeight = maxWeight;
                    existing.bestWeightDate = log.workoutLog.startTime;
                }
                if (log.isVolumePR && totalVolume > existing.bestVolume) {
                    existing.bestVolume = totalVolume;
                    existing.bestVolumeDate = log.workoutLog.startTime;
                }
                if (log.isRepsPR && maxReps > existing.bestReps) {
                    existing.bestReps = maxReps;
                    existing.bestRepsDate = log.workoutLog.startTime;
                }
            }
        });

        const records = Array.from(recordsMap.values());
        res.json(records);
    } catch (error) {
        console.error('Error fetching personal records:', error);
        res.status(500).json({ error: 'Failed to fetch personal records' });
    }
};

// Delete workout
export const deleteWorkout = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id: workoutId } = req.params;

        // 1. Get workout with exercise logs to find affected exercises
        const workout = await prisma.workoutLog.findUnique({
            where: { id: workoutId },
            include: {
                exerciseLogs: {
                    select: { exerciseId: true }
                }
            }
        });

        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        // 2. Verify ownership
        if (workout.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // 3. Get unique exercise IDs from this workout
        const affectedExerciseIds = [...new Set(
            workout.exerciseLogs.map(log => log.exerciseId).filter(id => id)
        )];

        // 4. Delete workout (cascade deletes exercise logs automatically)
        await prisma.workoutLog.delete({
            where: { id: workoutId }
        });

        // 5. Recalculate PRs for affected exercises
        for (const exerciseId of affectedExerciseIds) {
            // Get all remaining logs for this exercise
            const logs = await prisma.exerciseLog.findMany({
                where: {
                    exerciseId,
                    workoutLog: { userId, status: 'completed' }
                },
                include: {
                    workoutLog: {
                        select: { startTime: true }
                    }
                }
            });

            let bestWeight = 0;
            let bestWeightDate: Date | null = null;
            let bestVolume = 0;
            let bestVolumeDate: Date | null = null;
            let bestReps = 0;
            let bestRepsDate: Date | null = null;

            // Calculate new PRs
            logs.forEach(log => {
                const sets = log.sets as any[];
                sets.forEach(set => {
                    if (set.weight && set.reps) {
                        // Weight PR
                        if (set.weight > bestWeight) {
                            bestWeight = set.weight;
                            bestWeightDate = log.workoutLog.startTime;
                        }
                        // Volume for this set
                        const volume = set.weight * set.reps;
                        // Reps PR
                        if (set.reps > bestReps) {
                            bestReps = set.reps;
                            bestRepsDate = log.workoutLog.startTime;
                        }
                    }
                });

                // Total volume for this exercise log
                const totalVolume = sets.reduce((sum, set) => {
                    return sum + (set.weight && set.reps ? set.weight * set.reps : 0);
                }, 0);

                if (totalVolume > bestVolume) {
                    bestVolume = totalVolume;
                    bestVolumeDate = log.workoutLog.startTime;
                }
            });

            // Update or delete ExerciseStats
            if (logs.length === 0) {
                // No more logs for this exercise - delete stats
                await prisma.exerciseStats.deleteMany({
                    where: { userId, exerciseId }
                });
            } else {
                // Update stats with new PRs
                await prisma.exerciseStats.upsert({
                    where: {
                        userId_exerciseId: { userId, exerciseId }
                    },
                    create: {
                        userId,
                        exerciseId,
                        bestWeight,
                        bestWeightDate,
                        bestVolume,
                        bestVolumeDate,
                        bestReps,
                        bestRepsDate
                    },
                    update: {
                        bestWeight,
                        bestWeightDate,
                        bestVolume,
                        bestVolumeDate,
                        bestReps,
                        bestRepsDate
                    }
                });
            }
        }

        res.json({ message: 'Workout deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: error.message || 'Failed to delete workout' });
    }
};
