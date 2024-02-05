import { Router } from 'express';
import authMiddleware from '../../app/middleware/authMiddleware';
import groupsController from '../../app/controllers/groupsController';

const router = Router();

router.get('/', authMiddleware, groupsController.getMyGroups);
router.post('/new', authMiddleware, groupsController.createNewGroup);
router.get('/:id', authMiddleware, groupsController.getGroup);
router.post('/join/:id', authMiddleware, groupsController.joinGroup);
router.post(
  '/calculate/:id',
  authMiddleware,
  groupsController.calculateGroupSplits,
);
router.get('/settle/:id', authMiddleware, groupsController.settleGroupExpenses);

export default router;
