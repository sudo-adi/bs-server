import * as skillController from '@/controllers/profiles/skill.controller';
import { skillIdParamSchema, validate } from '@/middlewares';
import { Router } from 'express';

const router = Router({ mergeParams: true });

// Skill routes - all under /:id/skills
router.get('/', skillController.getProfileSkills);
router.post('/', skillController.addProfileSkill);
router.patch(
  '/:skillId',
  validate(skillIdParamSchema, 'params'),
  skillController.updateProfileSkill
);
router.post(
  '/:skillId/verify',
  validate(skillIdParamSchema, 'params'),
  skillController.verifyProfileSkill
);
router.delete(
  '/:skillId',
  validate(skillIdParamSchema, 'params'),
  skillController.deleteProfileSkill
);

export default router;
