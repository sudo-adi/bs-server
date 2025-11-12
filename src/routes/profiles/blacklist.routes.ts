import * as blacklistController from '@/controllers/profiles/profileBlacklist.controller';
import { blacklistIdParamSchema, uuidParamSchema, validate } from '@/middlewares';
import { Router } from 'express';

const router = Router();

// Profile-specific blacklist operations (nested under profile)
// These routes must come BEFORE the parameterized routes to avoid conflicts

// Check if specific profile is blacklisted
router.get(
  '/profile/:id',
  validate(uuidParamSchema, 'params'),
  blacklistController.checkIfBlacklisted
);

// Get blacklist history for specific profile
router.get(
  '/profile/:id/history',
  validate(uuidParamSchema, 'params'),
  blacklistController.getProfileBlacklistHistory
);

// Blacklist a specific profile
router.post(
  '/profile/:id',
  validate(uuidParamSchema, 'params'),
  blacklistController.blacklistProfile
);

// Remove specific profile from blacklist
router.delete(
  '/profile/:id',
  validate(uuidParamSchema, 'params'),
  blacklistController.removeFromBlacklist
);

// Get all blacklisted profiles (collection endpoint)
router.get('/', blacklistController.getAllBlacklistedProfiles);

// Get specific blacklist entry by ID
router.get(
  '/:blacklistId',
  validate(blacklistIdParamSchema, 'params'),
  blacklistController.getBlacklistEntryById
);

// Update specific blacklist entry
router.patch(
  '/:blacklistId',
  validate(blacklistIdParamSchema, 'params'),
  blacklistController.updateBlacklistEntry
);

export default router;
