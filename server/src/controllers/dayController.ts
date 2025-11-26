import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add exercise to a day
export const addExerciseToDay = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { dayId } = req.params;
        const { exerciseId, targetSets, targetReps, targetWeight, notes } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!exerciseId) {
            return res.status(400).json({ error: 'Exercise ID is required' });
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

        // Get current max order index
        const maxOrder = await prisma.dayExercise.findFirst({
            where: { dayId },
            orderBy: { orderIndex: 'desc' },
            select: { orderIndex: true }
        });

        const dayExercise = await prisma.dayExercise.create({
            data: {
                dayId,
                exerciseId,
                orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
                targetSets: targetSets || 3,
                targetReps: targetReps || 10,
                targetWeight,
                notes
            },
            include: {
                exercise: true
            }
        });

        res.status(201).json(dayExercise);
    } catch (error) {
        console.error('Error adding exercise to day:', error);
        res.status(500).json({ error: 'Failed to add exercise' });
    }
};

// Update day exercise
export const updateDayExercise = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { targetSets, targetReps, targetWeight, notes, orderIndex } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify ownership
        const existing = await prisma.dayExercise.findFirst({
            where: {
                id,
                day: {
                    program: { userId }
                }
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        const dayExercise = await prisma.dayExercise.update({
            where: { id },
            data: {
                ...(targetSets && { targetSets }),
                ...(targetReps && { targetReps }),
                ...(typeof targetWeight === 'number' && { targetWeight }),
                ...(notes !== undefined && { notes }),
                ...(typeof orderIndex === 'number' && { orderIndex })
            },
            include: {
                exercise: true
            }
        });

        res.json(dayExercise);
    } catch (error) {
        console.error('Error updating day exercise:', error);
        res.status(500).json({ error: 'Failed to update exercise' });
    }
};

// Remove exercise from day
export const removeDayExercise = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify ownership
        const existing = await prisma.dayExercise.findFirst({
            where: {
                id,
                day: {
                    program: { userId }
                }
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        await prisma.dayExercise.delete({
            where: { id }
        });

        res.json({ message: 'Exercise removed successfully' });
    } catch (error) {
        console.error('Error removing exercise:', error);
        res.status(500).json({ error: 'Failed to remove exercise' });
    }
};

// Add day to program
export const addDayToProgram = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { programId } = req.params;
        const { name, dayType } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Day name is required' });
        }

        // Verify program ownership
        const program = await prisma.workoutProgram.findFirst({
            where: { id: programId, userId }
        });

        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }

        // Get current max order index
        const maxOrder = await prisma.workoutDay.findFirst({
            where: { programId },
            orderBy: { orderIndex: 'desc' },
            select: { orderIndex: true }
        });

        const day = await prisma.workoutDay.create({
            data: {
                programId,
                name,
                dayType,
                orderIndex: (maxOrder?.orderIndex ?? -1) + 1
            }
        });

        res.status(201).json(day);
    } catch (error) {
        console.error('Error adding day:', error);
        res.status(500).json({ error: 'Failed to add day' });
    }
};

// Update day
export const updateDay = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, dayType, orderIndex } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify ownership
        const existing = await prisma.workoutDay.findFirst({
            where: {
                id,
                program: { userId }
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Day not found' });
        }

        const day = await prisma.workoutDay.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(dayType && { dayType }),
                ...(typeof orderIndex === 'number' && { orderIndex })
            }
        });

        res.json(day);
    } catch (error) {
        console.error('Error updating day:', error);
        res.status(500).json({ error: 'Failed to update day' });
    }
};

// Delete day
export const deleteDay = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify ownership
        const existing = await prisma.workoutDay.findFirst({
            where: {
                id,
                program: { userId }
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Day not found' });
        }

        await prisma.workoutDay.delete({
            where: { id }
        });

        res.json({ message: 'Day deleted successfully' });
    } catch (error) {
        console.error('Error deleting day:', error);
        res.status(500).json({ error: 'Failed to delete day' });
    }
};
