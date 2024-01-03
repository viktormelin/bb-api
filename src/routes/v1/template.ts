import { Router } from 'express';
import templateController from '../../app/controllers/templateController';
import authMiddleware from '../../app/middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, templateController.template);

export default router;
