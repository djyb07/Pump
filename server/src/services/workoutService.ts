import prisma from '../prisma';

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
            // Create new exercise log
            exerciseLog = await prisma.exerciseLog.create({
                data: {
                    workoutLogId,
                    dayExerciseId: setData.dayExerciseId,
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

    // Finish a workout
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

        // Calculate duration
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - workoutLog.startTime.getTime()) / 60000); // minutes

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
