import { Router } from 'express';
import * as qualificationTypeController from '@/controllers/admin/qualificationType.controller';

const router = Router();

router.get('/', qualificationTypeController.getAllQualificationTypes);
router.get('/:id', qualificationTypeController.getQualificationTypeById);

export default router;
