import { Router } from 'express';
import authMiddleware from '../../app/middleware/authMiddleware';
import expensesController from '../../app/controllers/expensesController';

const router = Router();

router.get('/', authMiddleware, expensesController.getMyExpenses);
router.get('/:id', authMiddleware, expensesController.getExpense);
router.post('/adduser', authMiddleware, expensesController.addUserToExpense);
router.post('/edit/split', authMiddleware, expensesController.editExpenseSplit);
router.post('/new', authMiddleware, expensesController.createExpense);
router.get('/reset/:id', authMiddleware, expensesController.resetExpense);

export default router;
