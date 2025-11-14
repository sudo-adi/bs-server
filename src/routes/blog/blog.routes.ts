import { Router } from 'express';
import * as blogController from '../../controllers/blog/blog.controller';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

// Public routes - for buildsewa frontend
router.get('/public', blogController.getPublishedBlogs);
router.get('/public/categories', blogController.getBlogCategories);
router.get('/public/:id', blogController.getBlogById);

// Protected routes - for admin panel
router.post('/', authMiddleware, blogController.createBlog);
router.get('/', authMiddleware, blogController.getAllBlogs);
router.get('/:id', authMiddleware, blogController.getBlogById);
router.put('/:id', authMiddleware, blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);

export default router;
