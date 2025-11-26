import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    logWorkout,
    getWorkoutHistory,
    getWorkoutById,
    getExerciseProgress
} from '../controllers/workoutController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Workout logging routes
router.post('/workouts', logWorkout);
router.get('/workouts', getWorkoutHistory);
router.get('/workouts/:id', getWorkoutById);

// Analytics routes
router.get('/analytics/progress/:exerciseId', getExerciseProgress);

export default router;
