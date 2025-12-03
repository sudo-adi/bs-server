import { Router } from 'express';
import certificateRoutes from './certificate.routes';

const router = Router();

router.use('/', certificateRoutes);

export default router;
