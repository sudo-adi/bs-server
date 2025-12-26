/**
 * Scraper Routes
 * API routes for news scraper functionality
 */

import { scraperController } from '@/controllers/scraper';
import { Router } from 'express';

const router = Router();

/**
 * News Updates
 */
// GET /api/v1/scraper/news - Get all news updates with pagination
router.get('/news', (req, res) => scraperController.getNewsUpdates(req, res));

// GET /api/v1/scraper/news/:id - Get single news update by ID
router.get('/news/:id', (req, res) => scraperController.getNewsUpdateById(req, res));

// DELETE /api/v1/scraper/news/:id - Delete a news update
router.delete('/news/:id', (req, res) => scraperController.deleteNewsUpdate(req, res));

/**
 * Scraper Operations
 */
// POST /api/v1/scraper/run - Trigger the scraper manually
router.post('/run', (req, res) => scraperController.triggerScraper(req, res));

// GET /api/v1/scraper/stats - Get scraper statistics
router.get('/stats', (req, res) => scraperController.getStats(req, res));

/**
 * Website Management
 */
// GET /api/v1/scraper/websites - Get configured websites from config file
router.get('/websites', (req, res) => scraperController.getWebsites(req, res));

// GET /api/v1/scraper/websites/db - Get websites from database
router.get('/websites/db', (req, res) => scraperController.getWebsitesFromDb(req, res));

// POST /api/v1/scraper/websites/seed - Seed database with config websites
router.post('/websites/seed', (req, res) => scraperController.seedWebsites(req, res));

// POST /api/v1/scraper/websites - Add a new website
router.post('/websites', (req, res) => scraperController.addWebsite(req, res));

// PATCH /api/v1/scraper/websites/:id - Update a website
router.patch('/websites/:id', (req, res) => scraperController.updateWebsite(req, res));

// DELETE /api/v1/scraper/websites/:id - Delete a website
router.delete('/websites/:id', (req, res) => scraperController.deleteWebsite(req, res));

export default router;
