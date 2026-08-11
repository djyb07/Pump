import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProgramSchema, updateProgramSchema } from '../validation/programSchemas';
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
router.post('/', validate(createProgramSchema), createProgram);
router.patch('/:id', validate(updateProgramSchema), updateProgram);
router.delete('/:id', deleteProgram);

export default router;
