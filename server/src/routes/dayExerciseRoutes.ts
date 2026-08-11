import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addDayExerciseSchema, updateDayExerciseSchema } from '../validation/programSchemas';
import {
    addExerciseToDay,
    updateDayExercise,
    removeDayExercise
} from '../controllers/dayController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Day exercise routes
router.post('/days/:dayId/exercises', validate(addDayExerciseSchema), addExerciseToDay);
router.patch('/day-exercises/:id', validate(updateDayExerciseSchema), updateDayExercise);
router.delete('/day-exercises/:id', removeDayExercise);

export default router;
