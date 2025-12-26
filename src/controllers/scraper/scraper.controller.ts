/**
 * Scraper Controller
 * API endpoints for news scraper functionality
 */

import logger from '@/config/logger';
import { scraperService } from '@/services/scraper';
import { Request, Response } from 'express';

class ScraperController {
  /**
   * GET /api/v1/scraper/news
   * Get all news updates with pagination and filtering
   */
  async getNewsUpdates(req: Request, res: Response) {
    try {
      const { page, limit, sector, status, search } = req.query;

      const result = await scraperService.getNewsUpdates({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
        sector: sector as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 50,
          totalPages: Math.ceil(result.total / (limit ? parseInt(limit as string) : 50)),
        },
      });
    } catch (error) {
      logger.error('Failed to get news updates', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to get news updates',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/scraper/news/:id
   * Get single news update by ID
   */
  async getNewsUpdateById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const newsUpdate = await scraperService.getNewsUpdateById(id);

      if (!newsUpdate) {
        return res.status(404).json({
          success: false,
          message: 'News update not found',
        });
      }

      res.json({
        success: true,
        data: newsUpdate,
      });
    } catch (error) {
      logger.error('Failed to get news update', { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Failed to get news update',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/v1/scraper/news/:id
   * Delete a news update
   */
  async deleteNewsUpdate(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await scraperService.deleteNewsUpdate(id);

      res.json({
        success: true,
        message: 'News update deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete news update', { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Failed to delete news update',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/scraper/run
   * Trigger the scraper manually
   */
  async triggerScraper(req: Request, res: Response) {
    try {
      const { maxProjects, websiteIds } = req.body;

      logger.info('Manual scraper trigger requested', { maxProjects, websiteIds });

      // Run scraper (this could take a while)
      const result = await scraperService.runScraper({
        maxProjects: maxProjects ? parseInt(maxProjects) : undefined,
        websiteIds: websiteIds as string[] | undefined,
      });

      res.json({
        success: true,
        message: 'Scraper completed',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to run scraper', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to run scraper',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/scraper/stats
   * Get scraper statistics
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await scraperService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get scraper stats', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to get scraper stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/scraper/websites
   * Get list of configured websites (from config file)
   */
  async getWebsites(req: Request, res: Response) {
    try {
      const websites = scraperService.getWebsites();

      res.json({
        success: true,
        data: websites,
        total: websites.length,
      });
    } catch (error) {
      logger.error('Failed to get websites', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to get websites',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/scraper/websites/db
   * Get websites from database
   */
  async getWebsitesFromDb(req: Request, res: Response) {
    try {
      const websites = await scraperService.getWebsitesFromDb();

      res.json({
        success: true,
        data: websites,
        total: websites.length,
      });
    } catch (error) {
      logger.error('Failed to get websites from db', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to get websites from database',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/scraper/websites/seed
   * Seed database with websites from config file
   */
  async seedWebsites(req: Request, res: Response) {
    try {
      logger.info('Seeding websites from config file...');

      const result = await scraperService.seedWebsites();

      res.json({
        success: true,
        message: `Seeded ${result.added} websites (${result.skipped} already existed)`,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to seed websites', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to seed websites',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/scraper/websites
   * Add a new website to database
   */
  async addWebsite(req: Request, res: Response) {
    try {
      const { name, url, type } = req.body;

      if (!name || !url) {
        return res.status(400).json({
          success: false,
          message: 'Name and URL are required',
        });
      }

      const website = await scraperService.addWebsite({ name, url, type });

      res.status(201).json({
        success: true,
        message: 'Website added successfully',
        data: website,
      });
    } catch (error) {
      logger.error('Failed to add website', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to add website',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/v1/scraper/websites/:id
   * Update a website
   */
  async updateWebsite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, url, type, isActive } = req.body;

      const website = await scraperService.updateWebsite(id, { name, url, type, isActive });

      res.json({
        success: true,
        message: 'Website updated successfully',
        data: website,
      });
    } catch (error) {
      logger.error('Failed to update website', { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Failed to update website',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/v1/scraper/websites/:id
   * Delete a website
   */
  async deleteWebsite(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await scraperService.deleteWebsite(id);

      res.json({
        success: true,
        message: 'Website deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete website', { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Failed to delete website',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const scraperController = new ScraperController();
export default scraperController;
