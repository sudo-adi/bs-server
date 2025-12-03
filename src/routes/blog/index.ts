/**
 * Blog Routes Index
 * Central routing configuration for all blog-related endpoints
 */

import { Router } from 'express';
import blogRoutes from './blog.routes';

const router = Router();

/**
 * Blog Routes Structure:
 *
 * /api/blogs
 *   - Blog CRUD operations (admin, protected)
 *   - Public blog endpoints for frontend
 */

router.use('/', blogRoutes);

export default router;
