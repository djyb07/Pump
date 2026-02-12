import prisma from '../prisma';
import { calculatePRsForExerciseLogs, batchUpdatePRFlags } from './PRService';

export interface StartWorkoutData {
    dayId: string;
    programId?: string;
}

export interface LogSetData {
    dayExerciseId: string;
    weight?: number;
    reps: number;
    completed: boolean;
}

export interface FinishWorkoutData {
    notes?: string;
    localEndTime?: string;
}

export const workoutService = {
    // Start a new workout session
    async startWorkout(userId: string, data: StartWorkoutData) {
        // Get the day with its exercises and program
        const day = await prisma.workoutDay.findUnique({
            where: { id: data.dayId },
            include: {
                program: true,
                exercises: {
                    include: {
                        exercise: true
                    },
                    orderBy: {
                        orderIndex: 'asc'
                    }
                }
            }
        });

        if (!day) {
            throw new Error('Workout day not found');
        }

        // Verify user owns this program
        if (day.program.userId !== userId) {
            throw new Error('Unauthorized');
        }

        // Create workout log
        const workoutLog = await prisma.workoutLog.create({
            data: {
                userId,
                dayId: data.dayId,
                programId: day.programId,
                dayName: day.name,
                programName: day.program?.name || 'Unknown Program',
                workoutType: 'program',
                status: 'in_progress',
                startTime: new Date()
            },
            include: {
                day: {
                    include: {
                        program: true,
                        exercises: {
                            include: {
                                exercise: true
                            },
                            orderBy: {
                                orderIndex: 'asc'
                            }
                        }
                    }
                },
                exerciseLogs: true
            }
        });

        return workoutLog;
    },

    // Log a set for an exercise
    async logSet(workoutLogId: string, userId: string, setData: LogSetData) {
        // Verify workout belongs to user
        const workoutLog = await prisma.workoutLog.findUnique({
            where: { id: workoutLogId },
            include: {
                exerciseLogs: true
            }
        });

        if (!workoutLog) {
            throw new Error('Workout not found');
        }

        if (workoutLog.userId !== userId) {
            throw new Error('Unauthorized');
        }

        if (workoutLog.status !== 'in_progress') {
            throw new Error('Workout is not in progress');
        }

        // Find or create exercise log
        let exerciseLog = workoutLog.exerciseLogs.find(
            log => log.dayExerciseId === setData.dayExerciseId
        );

        if (exerciseLog) {
            // Add set to existing exercise log
            const currentSets = exerciseLog.sets as any[];
            const updatedSets = [
                ...currentSets,
                {
                    setNumber: currentSets.length + 1,
                    weight: setData.weight,
                    reps: setData.reps,
                    completed: setData.completed,
                    timestamp: new Date().toISOString()
                }
            ];

            exerciseLog = await prisma.exerciseLog.update({
                where: { id: exerciseLog.id },
                data: {
                    sets: updatedSets
                }
            });
        } else {
            // Get exercise name for history preservation
            const dayExercise = await prisma.dayExercise.findUnique({
                where: { id: setData.dayExerciseId },
                include: { exercise: true }
            });

            // Create new exercise log
            exerciseLog = await prisma.exerciseLog.create({
                data: {
                    workoutLogId,
                    dayExerciseId: setData.dayExerciseId,
                    exerciseId: dayExercise?.exerciseId || '',
                    exerciseName: dayExercise?.exercise?.nameEn || 'Unknown Exercise',
                    sets: [
                        {
                            setNumber: 1,
                            weight: setData.weight,
                            reps: setData.reps,
                            completed: setData.completed,
                            timestamp: new Date().toISOString()
                        }
                    ]
                }
            });
        }

        return exerciseLog;
    },

    // Finish a workout - OPTIMIZED: Uses batch PR calculation instead of N+1 queries
    async finishWorkout(workoutLogId: string, userId: string, data: FinishWorkoutData) {
        // Verify workout belongs to user
        const workoutLog = await prisma.workoutLog.findUnique({
            where: { id: workoutLogId }
        });

        if (!workoutLog) {
            throw new Error('Workout not found');
        }

        if (workoutLog.userId !== userId) {
            throw new Error('Unauthorized');
        }

        if (workoutLog.status !== 'in_progress') {
            throw new Error('Workout is not in progress');
        }

        // Calculate duration — use client's local time if provided (avoids UTC timezone mismatch)
        const endTime = data.localEndTime ? new Date(data.localEndTime) : new Date();
        const startTime = new Date(workoutLog.startTime); // Ensure it's a Date object
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000); // minutes

        // Update workout log
        const updated = await prisma.workoutLog.update({
            where: { id: workoutLogId },
            data: {
                status: 'completed',
                endTime,
                duration,
                notes: data.notes
            },
            include: {
                day: {
                    include: {
                        program: true,
                        exercises: {
                            include: {
                                exercise: true
                            }
                        }
                    }
                },
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

        // OPTIMIZED: Calculate PRs using batch query (was N+1, now 1 query)
        const exerciseLogsData = updated.exerciseLogs.map(log => ({
            id: log.id,
            exerciseId: log.exerciseId,
            sets: log.sets as any[]
        }));

        const prResults = await calculatePRsForExerciseLogs(
            exerciseLogsData,
            userId,
            workoutLogId
        );

        // Batch update all PR flags
        await batchUpdatePRFlags(prResults);

        // --- Gamification: Update weekly streak & totalWorkouts ---
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastWorkoutDate: true, currentStreak: true }
        });

        // Use client-provided local time for streak week calculation to avoid UTC offset issues
        const now = data.localEndTime ? new Date(data.localEndTime) : new Date();

        /**
         * Get ISO week number (Mon=start). Handles year transitions correctly.
         * Returns { year, week } so Week 1 of 2027 !== Week 1 of 2026.
         */
        const getISOWeek = (date: Date): { year: number; week: number } => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // Adjust to Thursday
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
            return { year: d.getUTCFullYear(), week: weekNo };
        };

        /** Convert { year, week } to a single comparable number */
        const weekKey = (yw: { year: number; week: number }) => yw.year * 100 + yw.week;

        const currentWeek = getISOWeek(now);
        let newStreak = 1; // Default: first workout or streak reset

        if (user?.lastWorkoutDate) {
            const lastWeek = getISOWeek(new Date(user.lastWorkoutDate));
            const diff = weekKey(currentWeek) - weekKey(lastWeek);

            if (diff === 0) {
                newStreak = user.currentStreak; // Same week — keep streak as-is
            } else if (diff === 1) {
                newStreak = user.currentStreak + 1; // Consecutive week — increment
            }
            // else: gap > 1 week → reset to 1 (default)
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                totalWorkouts: { increment: 1 },
                currentStreak: newStreak,
                lastWorkoutDate: now,
            }
        });

        return updated;
    },

    // Get workout history for user
    async getWorkoutHistory(userId: string, limit: number = 20) {
        const workouts = await prisma.workoutLog.findMany({
            where: {
                userId,
                status: 'completed'
            },
            include: {
                day: {
                    include: {
                        program: true
                    }
                },
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
            orderBy: {
                startTime: 'desc'
            },
            take: limit
        });

        return workouts;
    },

    // Get specific workout by ID
    async getWorkoutById(workoutLogId: string, userId: string) {
        const workout = await prisma.workoutLog.findUnique({
            where: { id: workoutLogId },
            include: {
                day: {
                    include: {
                        program: true,
                        exercises: {
                            include: {
                                exercise: true
                            },
                            orderBy: {
                                orderIndex: 'asc'
                            }
                        }
                    }
                },
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
            throw new Error('Workout not found');
        }

        if (workout.userId !== userId) {
            throw new Error('Unauthorized');
        }

        return workout;
    },

    // Get active (in-progress) workout for user
    async getActiveWorkout(userId: string) {
        const workout = await prisma.workoutLog.findFirst({
            where: {
                userId,
                status: 'in_progress'
            },
            include: {
                day: {
                    include: {
                        program: true,
                        exercises: {
                            include: {
                                exercise: true
                            },
                            orderBy: {
                                orderIndex: 'asc'
                            }
                        }
                    }
                },
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

        return workout;
    }
};
