import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getPrograms,
    getProgramById,
    createProgram,
    updateProgram,
    deleteProgram
} from '../controllers/programController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Program routes
router.get('/', getPrograms);
router.get('/:id', getProgramById);
router.post('/', createProgram);
router.patch('/:id', updateProgram);
router.delete('/:id', deleteProgram);

export default router;
