import { Router } from 'express';
import versionController from '../../app/controllers/versionController';
import authMiddleware from '../../app/middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, versionController.getServerVersion);

export default router;
