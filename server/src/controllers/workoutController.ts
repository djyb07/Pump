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

        // Get all logs for this exercise
        const logs = await prisma.exerciseLog.findMany({
            where: {
                dayExercise: {
                    exerciseId
                },
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
                },
                dayExercise: {
                    include: {
                        exercise: true
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
            };
