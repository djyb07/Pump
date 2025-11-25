import { Request, Response } from 'express';
import prisma from '../prisma';

// Get all exercises with optional filtering
export const getAllExercises = async (req: Request, res: Response) => {
    try {
        const { muscle, workoutType, difficulty, search } = req.query;

        const where: any = {};

        if (muscle) {
            where.muscleGroups = { has: muscle as string };
        }

        if (workoutType) {
            where.workoutTypes = { has: workoutType as string };
        }

        if (difficulty) {
            where.difficulty = difficulty as string;
        }

        if (search) {
            where.OR = [
                { nameEn: { contains: search as string, mode: 'insensitive' } },
                { nameHe: { contains: search as string } },
            ];
        }

        const exercises = await prisma.exercise.findMany({
            where,
            orderBy: { nameEn: 'asc' },
        });

        res.json(exercises);
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({ error: 'Failed to fetch exercises' });
    }
};

// Get single exercise by ID
export const getExerciseById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const exercise = await prisma.exercise.findUnique({
            where: { id },
        });

        if (!exercise) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        res.json(exercise);
    } catch (error) {
        console.error('Error fetching exercise:', error);
        res.status(500).json({ error: 'Failed to fetch exercise' });
    }
};

// Search exercises by name (English or Hebrew)
export const searchExercises = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const exercises = await prisma.exercise.findMany({
            where: {
                OR: [
                    { nameEn: { contains: q as string, mode: 'insensitive' } },
                    { nameHe: { contains: q as string } },
                ],
            },
            take: 20,
        });

        res.json(exercises);
    } catch (error) {
        console.error('Error searching exercises:', error);
        res.status(500).json({ error: 'Failed to search exercises' });
    }
};
