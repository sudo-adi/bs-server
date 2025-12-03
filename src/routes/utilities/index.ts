/**
 * Utility Routes Index
 * Central routing configuration for all utility endpoints
 */

import { Router } from 'express';
import healthRoutes from './health.routes';
import newsUpdateRoutes from './newsUpdate.routes';
import scraperWebsiteRoutes from './scraperWebsite.routes';
import socialMediaRoutes from './socialMedia.routes';
import socialMediaPostRoutes from './socialMediaPost.routes';

const router = Router();

/**
 * Utility Routes Structure:
 *
 * /api/ (root)
 *   - Health check endpoints
 *
 * /api/news-updates
 *   - News update management
 *
 * /api/scraper-websites
 *   - Web scraper configuration
 *
 * /api/social-media
 *   - Social media platform management
 *
 * /api/social-media-posts
 *   - Social media post management
 */

router.use('/', healthRoutes);
router.use('/news-updates', newsUpdateRoutes);
router.use('/scraper-websites', scraperWebsiteRoutes);
router.use('/social-media', socialMediaRoutes);
router.use('/social-media-posts', socialMediaPostRoutes);

export default router;
