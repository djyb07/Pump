import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    addDayToProgram,
    updateDay,
    deleteDay
} from '../controllers/dayController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Day routes
router.post('/programs/:programId/days', addDayToProgram);
router.patch('/days/:id', updateDay);
router.delete('/days/:id', deleteDay);

export default router;
