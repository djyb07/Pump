import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getMuscleRecovery } from '../controllers/analyticsController';
import {
    startWorkout,
    logSet,
    finishWorkout,
    getActiveWorkout,
    getWorkoutHistory,
    getWorkoutById,
    getExerciseProgress,
    getPersonalRecords,
    deleteWorkout,
    updateSet,
    deleteSet
} from '../controllers/workoutController';
import { recalculatePRs } from '../controllers/migrationController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Active workout management
router.post('/workouts/start', startWorkout);         // Start new workout
router.get('/workouts/active', getActiveWorkout);     // Get current active workout
router.post('/workouts/:id/sets', logSet);            // Log a set
router.patch('/workouts/:workoutLogId/sets/:exerciseLogId/:setIndex', updateSet);  // Update a set
router.delete('/workouts/:workoutLogId/sets/:exerciseLogId/:setIndex', deleteSet); // Delete a set
router.patch('/workouts/:id/finish', finishWorkout);  // Finish workout

// Workout history
router.get('/workouts', getWorkoutHistory);           // Get workout history
router.get('/workouts/:id', getWorkoutById);          // Get specific workout
router.delete('/workouts/:id', deleteWorkout);        // Delete workout

// Analytics
router.get('/analytics/progress/:exerciseId', getExerciseProgress);
router.get('/analytics/personal-records', getPersonalRecords);
router.get('/analytics/muscle-recovery', getMuscleRecovery);

// Migrations
router.post('/migrations/recalculate-prs', recalculatePRs);

export default router;
