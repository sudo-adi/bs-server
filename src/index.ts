import db from '@/config/database';
import { env } from '@/config/env';
import logger from '@/config/logger';
import scraperCron from '@/jobs/scraperCron';
import app from './app';

const startServer = async () => {
  try {
    // Test database connection with retries (will try 3 times with exponential backoff)
    logger.info('Starting database connection test...');
    const dbConnected = await db.testConnection(3);
    if (!dbConnected) {
      logger.error('Database connection failed after multiple retries');
      logger.info('Server will continue starting - connection will be retried on first request');
      // Don't throw error - let the server start anyway
      // The connection pool will handle reconnection on first request
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`Server is running on ${env.HOST}:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API Prefix: ${env.API_PREFIX}`);
    });

    // Initialize news scraper cron job
    if (env.GEMINI_API_KEY) {
      scraperCron.init();
      logger.info('News scraper cron job initialized');
    } else {
      logger.warn('GEMINI_API_KEY not found. News scraper will not run automatically.');
    }

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      scraperCron.destroy();
      server.close(async () => {
        await db.close();
        logger.info('Server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
