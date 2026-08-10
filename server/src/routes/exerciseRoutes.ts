import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAllExercises, getExerciseById, searchExercises } from '../controllers/exerciseController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/exercises - Get all exercises with optional filters
router.get('/', getAllExercises);

// GET /api/exercises/search?q=bench - Search exercises
router.get('/search', searchExercises);

// GET /api/exercises/:id - Get single exercise
router.get('/:id', getExerciseById);

export default router;
