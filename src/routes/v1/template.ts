import { Router } from 'express';
import templateController from '../../app/controllers/templateController';

const router = Router();

router.get('/', templateController.template);

export default router;
