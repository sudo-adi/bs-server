import * as workerRegistrationController from '@/controllers/worker/workerRegistration.controller';
import { Router } from 'express';

const router = Router();

router.post('/register', workerRegistrationController.registerWorker);
router.get('/status/:phone', workerRegistrationController.checkRegistrationStatus);

export default router;
