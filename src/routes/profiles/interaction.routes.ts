import * as interactionController from '@/controllers/profiles/interaction.controller';
import { interactionIdParamSchema, validate } from '@/middlewares';
import { Router } from 'express';

const router = Router({ mergeParams: true });

// Interaction routes - all under /:id/interactions
router.get('/', interactionController.getProfileInteractions);
router.post('/', interactionController.addInteraction);
router.patch(
  '/:interactionId',
  validate(interactionIdParamSchema, 'params'),
  interactionController.updateInteraction
);
router.delete(
  '/:interactionId',
  validate(interactionIdParamSchema, 'params'),
  interactionController.deleteInteraction
);

export default router;
