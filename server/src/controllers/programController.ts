import { Request, Response } from 'express';
import prisma from '../prisma';

// Get all programs for authenticated user
export const getPrograms = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const programs = await prisma.workoutProgram.findMany({
            where: { userId },
            include: {
                days: {
                    include: {
                        exercises: {
                            include: {
                                exercise: true
                            },
                            orderBy: { orderIndex: 'asc' }
                        }
                    },
                    orderBy: { orderIndex: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(programs);
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ error: 'Failed to fetch programs' });
    }
};

// Get single program by ID
export const getProgramById = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const program = await prisma.workoutProgram.findFirst({
            where: {
                id,
                userId
            },
            include: {
                days: {
                    include: {
                        exercises: {
                            include: {
                                exercise: true
                            },
                            orderBy: { orderIndex: 'asc' }
                        }
                    },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });

        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }

        res.json(program);
    } catch (error) {
        console.error('Error fetching program:', error);
        res.status(500).json({ error: 'Failed to fetch program' });
    }
};

// Create new program
export const createProgram = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { name, splitType } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!name || !splitType) {
            return res.status(400).json({ error: 'Name and splitType are required' });
        }

        // Create program with auto-generated days based on split type
        const program = await prisma.workoutProgram.create({
            data: {
                userId,
                name,
                splitType,
                days: {
                    create: getDaysForSplit(splitType)
                }
            },
            include: {
                days: true
            }
        });

        res.status(201).json(program);
    } catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({ error: 'Failed to create program' });
    }
};

// Update program
export const updateProgram = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, splitType, isActive } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify ownership
        const existing = await prisma.workoutProgram.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Program not found' });
        }

        const program = await prisma.workoutProgram.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(splitType && { splitType }),
                ...(typeof isActive === 'boolean' && { isActive })
            },
            include: {
                days: true
            }
        });

        res.json(program);
    } catch (error) {
        console.error('Error updating program:', error);
        res.status(500).json({ error: 'Failed to update program' });
    }
};

// Delete program
export const deleteProgram = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify ownership
        const existing = await prisma.workoutProgram.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Program not found' });
        }

        await prisma.workoutProgram.delete({
            where: { id }
        });

        res.json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('Error deleting program:', error);
        res.status(500).json({ error: 'Failed to delete program' });
    }
};

// Helper function to generate days based on split type
function getDaysForSplit(splitType: string) {
    const splits: Record<string, Array<{ name: string; dayType: string; orderIndex: number }>> = {
        'PPL': [
            { name: 'Push Day', dayType: 'PUSH', orderIndex: 0 },
            { name: 'Pull Day', dayType: 'PULL', orderIndex: 1 },
            { name: 'Leg Day', dayType: 'LEGS', orderIndex: 2 }
        ],
        'UPPER_LOWER': [
            { name: 'Upper Body', dayType: 'UPPER', orderIndex: 0 },
            { name: 'Lower Body', dayType: 'LOWER', orderIndex: 1 }
        ],
        'FULL_BODY': [
            { name: 'Full Body Workout', dayType: 'FULL_BODY', orderIndex: 0 }
        ],
        'PUSH_PULL': [
            { name: 'Push Day', dayType: 'PUSH', orderIndex: 0 },
            { name: 'Pull Day', dayType: 'PULL', orderIndex: 1 }
        ],
        'FIVE_DAY': [
            { name: 'Chest Day', dayType: 'CHEST', orderIndex: 0 },
            { name: 'Back Day', dayType: 'BACK', orderIndex: 1 },
            { name: 'Leg Day', dayType: 'LEGS', orderIndex: 2 },
            { name: 'Shoulder Day', dayType: 'SHOULDERS', orderIndex: 3 },
            { name: 'Arm Day', dayType: 'ARMS', orderIndex: 4 }
        ],
        'CUSTOM': []
    };

    return splits[splitType] || [];
}
