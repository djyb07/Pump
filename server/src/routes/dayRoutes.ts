import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addDaySchema, updateDaySchema } from '../validation/programSchemas';
import {
    addDayToProgram,
    updateDay,
    deleteDay
} from '../controllers/dayController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Day routes
router.post('/programs/:programId/days', validate(addDaySchema), addDayToProgram);
router.patch('/days/:id', validate(updateDaySchema), updateDay);
router.delete('/days/:id', deleteDay);

export default router;
