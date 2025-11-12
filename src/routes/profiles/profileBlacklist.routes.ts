import * as blacklistController from '@/controllers/profiles/profileBlacklist.controller';
import { blacklistIdParamSchema, validate } from '@/middlewares';
import { Router } from 'express';

const router = Router({ mergeParams: true });

// Profile-specific blacklist routes - all under /:id/blacklist
router.get('/', blacklistController.checkIfBlacklisted);
router.get('/history', blacklistController.getProfileBlacklistHistory);
router.post('/', blacklistController.blacklistProfile);
router.delete('/', blacklistController.removeFromBlacklist);
router.patch(
  '/:blacklistId',
  validate(blacklistIdParamSchema, 'params'),
  blacklistController.updateBlacklistEntry
);

export default router;
