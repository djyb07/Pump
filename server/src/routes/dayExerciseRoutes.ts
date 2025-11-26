import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    addExerciseToDay,
    updateDayExercise,
    removeDayExercise
} from '../controllers/dayController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Day exercise routes
router.post('/days/:dayId/exercises', addExerciseToDay);
router.patch('/day-exercises/:id', updateDayExercise);
router.delete('/day-exercises/:id', removeDayExercise);

export default router;
