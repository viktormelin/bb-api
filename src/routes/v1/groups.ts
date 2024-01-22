import { Router } from 'express';
import authMiddleware from '../../app/middleware/authMiddleware';
import groupsController from '../../app/controllers/groupsController';

const router = Router();

router.get('/', authMiddleware, groupsController.getMyGroups);
router.post('/new', authMiddleware, groupsController.createNewGroup);
router.get('/:slug', authMiddleware, groupsController.getGroup);
router.post('/join/:slug', authMiddleware, groupsController.joinGroup);

export default router;
