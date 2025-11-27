import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    startWorkout,
    logSet,
    finishWorkout,
    getActiveWorkout,
    getWorkoutHistory,
    getWorkoutById,
    getExerciseProgress,
    getPersonalRecords
} from '../controllers/workoutController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Active workout management
router.post('/workouts/start', startWorkout);         // Start new workout
router.get('/workouts/active', getActiveWorkout);     // Get current active workout
router.post('/workouts/:id/sets', logSet);            // Log a set
router.patch('/workouts/:id/finish', finishWorkout);  // Finish workout

// Workout history
router.get('/workouts', getWorkoutHistory);           // Get workout history
router.get('/workouts/:id', getWorkoutById);          // Get specific workout

// Analytics
router.get('/analytics/progress/:exerciseId', getExerciseProgress);
router.get('/analytics/personal-records', getPersonalRecords);

export default router;
