import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { analyzeWorkouts } from '../controllers/aiController';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

// POST /api/ai/analyze — Generate or return cached AI analysis
router.post('/analyze', analyzeWorkouts);

export default router;
