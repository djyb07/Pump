import { Request, Response } from 'express';
import prisma from '../prisma';

// Log a workout
export const logWorkout = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { dayId, exerciseLogs, duration, notes } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!dayId) {
            return res.status(400).json({ error: 'Day ID is required' });
        }

        // Verify day belongs to user's program
        const day = await prisma.workoutDay.findFirst({
            where: {
                id: dayId,
                program: { userId }
            }
        });

        if (!day) {
            return res.status(404).json({ error: 'Workout day not found' });
        }

        // Create workout log with exercise logs
        const workoutLog = await prisma.workoutLog.create({
            data: {
                userId,
                dayId,
                duration,
                notes,
                exerciseLogs: {
                    create: exerciseLogs?.map((log: any) => ({
                        dayExerciseId: log.dayExerciseId,
                        sets: log.sets,
                        notes: log.notes
                    })) || []
                }
            },
            include: {
                exerciseLogs: {
                    include: {
                        dayExercise: {
                            include: {
                                exercise: true
                            }
                        }
                    }
                },
                day: true
            }
        });

        res.status(201).json(workoutLog);
    } catch (error) {
        console.error('Error logging workout:', error);
        res.status(500).json({ error: 'Failed to log workout' });
    }
};

// Get workout history for user
export const getWorkoutHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { limit = 20, offset = 0 } = req.query;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const workouts = await prisma.workoutLog.findMany({
            where: { userId },
            include: {
                day: true,
                exerciseLogs: {
                    include: {
                        dayExercise: {
                            include: {
                                exercise: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: Number(limit),
            skip: Number(offset)
        });

        const total = await prisma.workoutLog.count({
            where: { userId }
        });

        res.json({
            workouts,
            total,
            limit: Number(limit),
            offset: Number(offset)
        });
    } catch (error) {
        console.error('Error fetching workout history:', error);
        res.status(500).json({ error: 'Failed to fetch workout history' });
    }
};

// Get specific workout log
export const getWorkoutById = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const workout = await prisma.workoutLog.findFirst({
            where: {
                id,
                userId
            },
            include: {
                day: true,
                exerciseLogs: {
                    include: {
                        dayExercise: {
                            include: {
                                exercise: true
                            }
                        }
                    }
                }
            }
        });

        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.json(workout);
    } catch (error) {
        console.error('Error fetching workout:', error);
        res.status(500).json({ error: 'Failed to fetch workout' });
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
                    userId
                }
            },
            include: {
                workoutLog: {
                    select: {
                        date: true
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

        // Calculate stats
        const progressData = logs.map(log => {
            const sets = log.sets as any[];
            const maxWeight = Math.max(...sets.map((s: any) => s.weight || 0));
            const totalReps = sets.reduce((sum: number, s: any) => sum + (s.reps || 0), 0);
            const totalVolume = sets.reduce((sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0);

            return {
                date: log.workoutLog.date,
                maxWeight,
                totalReps,
                totalVolume,
                sets: sets.length
            };
        });

        res.json({
            exercise: logs[0]?.dayExercise.exercise,
            progress: progressData
        });
    } catch (error) {
        console.error('Error fetching exercise progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
};
