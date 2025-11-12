import { Router } from 'express';
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  getStats,
  searchPosts,
  updatePost,
} from '@/controllers/utilities/socialMediaPost.controller';

const router = Router();

/**
 * @route   GET /api/v1/social-media-posts/stats
 * @desc    Get post statistics
 * @access  Public (can add auth later)
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/v1/social-media-posts/search
 * @desc    Search posts
 * @access  Public
 */
router.get('/search', searchPosts);

/**
 * @route   GET /api/v1/social-media-posts
 * @desc    Get all posts with filters
 * @access  Public
 */
router.get('/', getAllPosts);

/**
 * @route   GET /api/v1/social-media-posts/:id
 * @desc    Get post by ID
 * @access  Public
 */
router.get('/:id', getPostById);

/**
 * @route   POST /api/v1/social-media-posts
 * @desc    Create new post
 * @access  Public
 */
router.post('/', createPost);

/**
 * @route   PATCH /api/v1/social-media-posts/:id
 * @desc    Update post
 * @access  Public
 */
router.patch('/:id', updatePost);

/**
 * @route   DELETE /api/v1/social-media-posts/:id
 * @desc    Delete post
 * @access  Public
 */
router.delete('/:id', deletePost);

export default router;
