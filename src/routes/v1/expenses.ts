import { Router } from 'express';
import authMiddleware from '../../app/middleware/authMiddleware';
import expensesController from '../../app/controllers/expensesController';

const router = Router();

router.get('/', authMiddleware, expensesController.getMyExpenses);

export default router;
