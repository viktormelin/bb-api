import { Router } from 'express';
import authMiddleware from '../../app/middleware/authMiddleware';
import groupsController from '../../app/controllers/groupsController';

const router = Router();

router.get('/', authMiddleware, groupsController.getMyGroups);

export default router;
