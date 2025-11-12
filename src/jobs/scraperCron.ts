import * as cron from 'node-cron';
import logger from '@/config/logger';
import scraperService from '@/services/utilities/newss-scraper.service';
import { env } from '@/config/env';

class ScraperCron {
  private cronJob: ReturnType<typeof cron.schedule> | null = null;

  // Initialize cron job
  init() {
    // Default: Run every day at 7:00 AM IST
    // Cron expression: '0 7 * * *' (minute hour day month weekday)
    const cronExpression = env.SCRAPER_CRON_SCHEDULE || '0 7 * * *';

    logger.info('Initializing news scraper cron job', {
      schedule: cronExpression,
      timezone: env.SCRAPER_TIMEZONE || 'Asia/Kolkata',
    });

    // Schedule the cron job
    this.cronJob = cron.schedule(
      cronExpression,
      async () => {
        await this.runScraperJob();
      },
      {
        timezone: env.SCRAPER_TIMEZONE || 'Asia/Kolkata',
      }
    );

    logger.info('News scraper cron job initialized successfully');
  }

  // Run scraper job
  async runScraperJob() {
    const startTime = new Date();
    logger.info('========================================');
    logger.info('NEWS SCRAPER CRON JOB STARTED', { startTime });
    logger.info('========================================');

    try {
      const result = await scraperService.runScraper();

      logger.info('========================================');
      logger.info('NEWS SCRAPER CRON JOB COMPLETED', {
        startTime,
        endTime: new Date(),
        duration: `${(Date.now() - startTime.getTime()) / 1000}s`,
        success: result.success,
        summary: {
          urls_found: result.total_urls_found,
          articles_scraped: result.total_articles_scraped,
          valid_projects: result.total_valid_projects,
          inserted: result.total_inserted,
          duplicates: result.total_duplicates,
          errors: result.errors.length,
        },
      });
      logger.info('========================================');

      // Log errors if any
      if (result.errors.length > 0) {
        logger.warn('Scraper completed with errors', { errors: result.errors });
      }

      // Log inserted projects
      if (result.inserted_projects.length > 0) {
        logger.info('Newly inserted projects', {
          count: result.inserted_projects.length,
          projects: result.inserted_projects.map((p) => ({
            id: p.id,
            name: p.project_name,
            value_cr: p.value_cr,
            sector: p.sector,
          })),
        });
      }

      return result;
    } catch (error) {
      logger.error('========================================');
      logger.error('NEWS SCRAPER CRON JOB FAILED', {
        startTime,
        endTime: new Date(),
        error,
      });
      logger.error('========================================');
      throw error;
    }
  }

  // Manually trigger the scraper (for testing)
  async triggerManual() {
    logger.info('Manual trigger requested for news scraper');
    return await this.runScraperJob();
  }

  // Start the cron job
  start() {
    if (this.cronJob) {
      this.cronJob.start();
      logger.info('News scraper cron job started');
    } else {
      logger.warn('Cron job not initialized. Call init() first.');
    }
  }

  // Stop the cron job
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('News scraper cron job stopped');
    }
  }

  // Destroy the cron job
  destroy() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      logger.info('News scraper cron job destroyed');
    }
  }

  // Get cron job status
  getStatus(): { running: boolean; schedule: string } {
    return {
      running: this.cronJob !== null,
      schedule: env.SCRAPER_CRON_SCHEDULE || '0 7 * * *',
    };
  }
}

export default new ScraperCron();
