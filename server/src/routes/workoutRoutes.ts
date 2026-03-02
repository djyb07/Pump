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
import { validate } from '../middleware/validate';
import {
    startWorkoutSchema,
    logSetSchema,
    updateSetSchema,
    finishWorkoutSchema,
} from '../validation/workoutSchemas';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ─── Active Workout Management (Zod-validated mutations) ─────────────────────
router.post('/workouts/start', validate(startWorkoutSchema), startWorkout);
router.get('/workouts/active', getActiveWorkout);
router.post('/workouts/:id/sets', validate(logSetSchema), logSet);
router.patch('/workouts/:workoutLogId/sets/:exerciseLogId/:setIndex', validate(updateSetSchema), updateSet);
router.delete('/workouts/:workoutLogId/sets/:exerciseLogId/:setIndex', deleteSet);
router.patch('/workouts/:id/finish', validate(finishWorkoutSchema), finishWorkout);

// ─── Workout History ─────────────────────────────────────────────────────────
router.get('/workouts', getWorkoutHistory);
router.get('/workouts/:id', getWorkoutById);
router.delete('/workouts/:id', deleteWorkout);

// ─── Analytics ───────────────────────────────────────────────────────────────
router.get('/analytics/progress/:exerciseId', getExerciseProgress);
router.get('/analytics/personal-records', getPersonalRecords);
router.get('/analytics/muscle-recovery', getMuscleRecovery);

// ─── Migrations ──────────────────────────────────────────────────────────────
router.post('/migrations/recalculate-prs', recalculatePRs);

export default router;
