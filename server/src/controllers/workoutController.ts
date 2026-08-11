/**
 * Workout Controller
 *
 * Handles workout session lifecycle (start, log sets, finish),
 * history retrieval, analytics, and set management.
 *
 * SECURITY NOTES:
 * - Request bodies are pre-validated by Zod middleware at the route level.
 *   Controllers receive already-parsed, typed data.
 * - RPE is validated as integer 1–10 and type as exact enum by Zod schemas.
 * - Unhandled errors propagate to the global error handler (Express 5 async support).
 * - Domain errors from services (e.g. "Workout not found") are caught and
 *   returned as appropriate HTTP status codes.
 */

import { Request, Response } from 'express';
import prisma from '../prisma';
import { workoutService } from '../services/workoutService';

/**
 * Map a WorkoutServiceError onto its HTTP status. Returns true if handled.
 *
 * Service errors used to be plain Errors that reached the global handler as
 * `500 Internal Server Error`, so a cross-user attempt looked identical to a
 * genuine fault (finding H4). Anything without a status is a real fault and
 * is re-thrown to the global handler unchanged.
 */
const respondToServiceError = (error: any, res: Response): boolean => {
    if (typeof error?.status === 'number') {
        res.status(error.status).json({ error: error.message });
        return true;
    }
    return false;
};

// ===== NEW WORKFLOW =====

// Start a new workout session
export const startWorkout = async (req: Request, res: Response) => {
    // Body already validated by Zod middleware (startWorkoutSchema)
    const userId = req.user!.id;
    const { dayId, programId } = req.body;

    try {
        const workout = await workoutService.startWorkout(userId, { dayId, programId });
        res.json(workout);
    } catch (error: any) {
        if (!respondToServiceError(error, res)) throw error;
    }
};

// Log a set (add to existing workout)
export const logSet = async (req: Request, res: Response) => {
    // Body already validated by Zod middleware (logSetSchema)
    // - dayExerciseId / exerciseId: at least one present; ownership checked below
    // - rpe: validated as integer 1-10 (or null/undefined)
    // - type: validated as enum NORMAL | WARMUP | DROP | FAILURE
    const userId = req.user!.id;
    const { id: workoutLogId } = req.params;
    const { dayExerciseId, exerciseId, weight, reps, completed, type, rpe } = req.body;

    try {
        // Passed through separately. These were previously collapsed with
        // `dayExerciseId || exerciseId`, which fed an Exercise id into a
        // DayExercise lookup and produced placeholder rows on the miss.
        const exerciseLog = await workoutService.logSet(workoutLogId, userId, {
            dayExerciseId: dayExerciseId ?? null,
            exerciseId: exerciseId ?? null,
            weight,
            reps,
            completed: completed ?? true,
            type: type || 'NORMAL',
            rpe: rpe !== undefined && rpe !== null ? Number(rpe) : undefined
        });

        res.status(201).json(exerciseLog);
    } catch (error: any) {
        if (!respondToServiceError(error, res)) throw error;
    }
};

// Finish current workout
export const finishWorkout = async (req: Request, res: Response) => {
    // Body already validated by Zod middleware (finishWorkoutSchema)
    const userId = req.user!.id;
    const { id: workoutLogId } = req.params;
    const { notes, localEndTime } = req.body;

    try {
        const workout = await workoutService.finishWorkout(workoutLogId, userId, { notes, localEndTime });
        res.json(workout);
    } catch (error: any) {
        if (!respondToServiceError(error, res)) throw error;
    }
};

// Get active (in-progress) workout
export const getActiveWorkout = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const workout = await workoutService.getActiveWorkout(userId);

    if (!workout) {
        return res.status(404).json({ error: 'No active workout found' });
    }

    res.json(workout);
};

// ===== EXISTING ENDPOINTS (kept for compatibility) =====

// Get workout history for user
export const getWorkoutHistory = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const workouts = await workoutService.getWorkoutHistory(userId, limit);
    res.json(workouts);
};

// Get specific workout log
export const getWorkoutById = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id: workoutLogId } = req.params;

    try {
        const workout = await workoutService.getWorkoutById(workoutLogId, userId);
        res.json(workout);
    } catch (error: any) {
        if (!respondToServiceError(error, res)) throw error;
    }
};

// Get progress for a specific exercise
export const getExerciseProgress = async (req: Request, res: Response) => {
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

    // Calculate stats including e1RM — exclude WARMUP sets from stats
    const progressData = logs.map(log => {
        const sets = log.sets as any[];
        const workingSets = sets.filter((s: any) => (s.type || 'NORMAL') !== 'WARMUP');
        const maxWeight = workingSets.length > 0 ? Math.max(...workingSets.map((s: any) => s.weight || 0)) : 0;
        const totalReps = workingSets.reduce((sum: number, s: any) => sum + (s.reps || 0), 0);
        const totalVolume = workingSets.reduce((sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0);

        // Calculate e1RM (Epley formula) from best working set
        let bestE1RM = 0;
        workingSets.forEach((s: any) => {
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
            sets: workingSets.length,
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
};

// Get all personal records for user
export const getPersonalRecords = async (req: Request, res: Response) => {
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
};

// Delete workout
export const deleteWorkout = async (req: Request, res: Response) => {
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

    // 2. Verify ownership. 404, not 403 — a 403 would confirm the id exists
    //    and belongs to somebody, making this an existence oracle. It also
    //    tripped the client's interceptor, which logs the user out on a 403.
    if (workout.userId !== userId) {
        return res.status(404).json({ error: 'Workout not found' });
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

        // Calculate new PRs — exclude WARMUP sets
        logs.forEach(log => {
            const sets = log.sets as any[];
            const workingSets = sets.filter((set: any) => (set.type || 'NORMAL') !== 'WARMUP');
            workingSets.forEach(set => {
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

            // Total volume for this exercise log (working sets only)
            const totalVolume = workingSets.reduce((sum: number, set: any) => {
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
};

// Update a specific set in an exercise log
export const updateSet = async (req: Request, res: Response) => {
    // Body already validated by Zod middleware (updateSetSchema)
    // - rpe: validated as integer 1-10 (or null/undefined)
    // - type: validated as enum NORMAL | WARMUP | DROP | FAILURE
    const userId = req.user!.id;
    const { workoutLogId, exerciseLogId, setIndex } = req.params;
    const { weight, reps, type, rpe } = req.body;

    const setIdx = parseInt(setIndex);
    if (isNaN(setIdx) || setIdx < 0) {
        return res.status(400).json({ error: 'Invalid set index' });
    }

    // Verify workout belongs to user
    const workout = await prisma.workoutLog.findFirst({
        where: {
            id: workoutLogId,
            userId
        }
    });

    if (!workout) {
        return res.status(404).json({ error: 'Workout not found or access denied' });
    }

    // Get the exercise log
    const exerciseLog = await prisma.exerciseLog.findFirst({
        where: {
            id: exerciseLogId,
            workoutLogId
        }
    });

    if (!exerciseLog) {
        return res.status(404).json({ error: 'Exercise log not found' });
    }

    const sets = exerciseLog.sets as any[];
    if (setIdx >= sets.length) {
        return res.status(400).json({ error: 'Set index out of range' });
    }

    // Patch semantics: only fields actually present in the body are changed.
    // `reps` was previously written unconditionally, so a weight-only edit
    // would have overwritten reps with undefined.
    const current = sets[setIdx];
    const updatedSets = [...sets];
    updatedSets[setIdx] = {
        ...current,
        weight: weight !== undefined ? weight : current.weight,
        reps: reps !== undefined ? reps : current.reps,
        type: type || current.type || 'NORMAL',
        rpe: rpe !== undefined && rpe !== null ? Number(rpe) : current.rpe
    };

    // Update in database
    const updated = await prisma.exerciseLog.update({
        where: { id: exerciseLogId },
        data: { sets: updatedSets },
        include: {
            dayExercise: {
                include: {
                    exercise: true
                }
            }
        }
    });

    res.json(updated);
};

// Delete a specific set from an exercise log
export const deleteSet = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workoutLogId, exerciseLogId, setIndex } = req.params;

    const setIdx = parseInt(setIndex);
    if (isNaN(setIdx) || setIdx < 0) {
        return res.status(400).json({ error: 'Invalid set index' });
    }

    // Verify workout belongs to user
    const workout = await prisma.workoutLog.findFirst({
        where: {
            id: workoutLogId,
            userId
        }
    });

    if (!workout) {
        return res.status(404).json({ error: 'Workout not found or access denied' });
    }

    // Get the exercise log
    const exerciseLog = await prisma.exerciseLog.findFirst({
        where: {
            id: exerciseLogId,
            workoutLogId
        }
    });

    if (!exerciseLog) {
        return res.status(404).json({ error: 'Exercise log not found' });
    }

    const sets = exerciseLog.sets as any[];
    if (setIdx >= sets.length) {
        return res.status(400).json({ error: 'Set index out of range' });
    }

    // Remove the set
    const updatedSets = sets.filter((_, index) => index !== setIdx);

    // Update set numbers
    const renumberedSets = updatedSets.map((set, index) => ({
        ...set,
        setNumber: index + 1
    }));

    // Update in database
    const updated = await prisma.exerciseLog.update({
        where: { id: exerciseLogId },
        data: { sets: renumberedSets },
        include: {
            dayExercise: {
                include: {
                    exercise: true
                }
            }
        }
    });

    res.json(updated);
};
