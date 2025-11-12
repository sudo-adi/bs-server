import * as qualificationController from '@/controllers/profiles/qualification.controller';
import { qualificationIdParamSchema, validate } from '@/middlewares';
import { Router } from 'express';

const router = Router({ mergeParams: true });

// Qualification routes - all under /:id/qualifications
router.get('/', qualificationController.getProfileQualifications);
router.post('/', qualificationController.addQualification);
router.patch(
  '/:qualificationId',
  validate(qualificationIdParamSchema, 'params'),
  qualificationController.updateQualification
);
router.post(
  '/:qualificationId/verify',
  validate(qualificationIdParamSchema, 'params'),
  qualificationController.verifyQualification
);
router.delete(
  '/:qualificationId',
  validate(qualificationIdParamSchema, 'params'),
  qualificationController.deleteQualification
);

export default router;
