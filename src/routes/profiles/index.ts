import { uuidParamSchema, validate } from '@/middlewares';
import { Router } from 'express';

// Import all profile sub-routes
import addressRoutes from './address.routes';
import bankAccountRoutes from './bankAccount.routes';
import blacklistRoutes from './blacklist.routes';
import csvImportRoutes from './csvImport.routes';
import documentRoutes from './document.routes';
import interactionRoutes from './interaction.routes';
import profileRoutes from './profile.routes';
import qualificationRoutes from './qualification.routes';
import skillRoutes from './skill.routes';

const router = Router();

// Main profile routes (CRUD, stage management)
router.use('/', profileRoutes);

// CSV Import routes
router.use('/import', csvImportRoutes);

// Blacklist routes (collection and profile-specific operations)
router.use('/blacklist', blacklistRoutes);

// Profile-specific nested routes (all require :id param)
router.use('/:id/addresses', validate(uuidParamSchema, 'params'), addressRoutes);
router.use('/:id/skills', validate(uuidParamSchema, 'params'), skillRoutes);
router.use('/:id/qualifications', validate(uuidParamSchema, 'params'), qualificationRoutes);
router.use('/:id/interactions', validate(uuidParamSchema, 'params'), interactionRoutes);
router.use('/:id/documents', validate(uuidParamSchema, 'params'), documentRoutes);
router.use('/:id/bank-accounts', validate(uuidParamSchema, 'params'), bankAccountRoutes);

export default router;
