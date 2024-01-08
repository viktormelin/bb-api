import { Router } from 'express';
import usersController from '../../app/controllers/usersController';
import authMiddleware from '../../app/middleware/authMiddleware';

const router = Router();

router.get('/validate', authMiddleware, usersController.validateUser);
router.get('/me', authMiddleware, usersController.getSelf);

export default router;
