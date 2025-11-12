import { env } from '@/config/env';
import logger from '@/config/logger';
import {
  databaseErrorHandler,
  errorHandler,
  notFoundHandler,
  requestLogger,
  requestTimeout,
} from '@/middlewares';
import routes from '@/routes';
import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import 'express-async-errors';
import helmet from 'helmet';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Request timeout - 30 seconds
app.use(requestTimeout(30000));

// Request logging
app.use(requestLogger);

// Rate limiting
// app.use(apiLimiter);

// API routes
app.use(env.API_PREFIX, routes);

// Health check route (without API prefix)
app.use('/', routes);

// 404 handler
app.use(notFoundHandler);

// Database error handler (must be before general error handler)
app.use(databaseErrorHandler);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Close server and cleanup resources
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to exit the process
  // process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Exit process on uncaught exception
  process.exit(1);
});

export default app;
