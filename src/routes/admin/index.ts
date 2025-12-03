/**
 * Admin Routes Index
 * Central routing configuration for all admin-related endpoints
 */

import { Router } from 'express';
import qualificationTypeRoutes from './qualificationType.routes';
import roleRoutes from './role.routes';
import rolePermissionRoutes from './rolePermission.routes';
import skillCategoryRoutes from './skillCategory.routes';
import userRoutes from './user.routes';

const router = Router();

/**
 * Admin Routes Structure:
 *
 * /api/users
 *   - User management (CRUD, password, activation)
 *
 * /api/roles
 *   - Role management
 *
 * /api/role-permissions
 *   - Role permission assignments
 *
 * /api/skill-categories
 *   - Skill category management
 *
 * /api/qualification-types
 *   - Qualification type management
 */

router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/role-permissions', rolePermissionRoutes);
router.use('/skill-categories', skillCategoryRoutes);
router.use('/qualification-types', qualificationTypeRoutes);

export default router;
