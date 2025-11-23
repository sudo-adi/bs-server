import express from 'express';
import authRoutes from './auth.routes';
import workerInfoRoutes from './workerInfo.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/', workerInfoRoutes);

export default router;
