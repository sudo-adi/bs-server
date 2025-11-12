import * as profileController from '@/controllers/profiles/profile.controller';
import {
  createProfileSchema,
  paginationSchema,
  updateProfileSchema,
  uuidParamSchema,
  validate,
} from '@/middlewares';
import { Router } from 'express';

const router = Router();

// Profile CRUD
router.post('/', validate(createProfileSchema), profileController.createProfile);
router.get('/', validate(paginationSchema, 'query'), profileController.getAllProfiles);
router.get('/check-mobile', profileController.checkMobileNumber);
router.get('/:id', validate(uuidParamSchema, 'params'), profileController.getProfile);
router.patch(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateProfileSchema),
  profileController.updateProfile
);
router.delete('/:id', validate(uuidParamSchema, 'params'), profileController.deleteProfile);

// Stage Management
router.post('/:id/stage', profileController.changeStage);

export default router;
