import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';

/**
 * Database Error Handler Middleware
 * Converts PostgreSQL error codes into appropriate HTTP responses
 */
export const databaseErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // If error is already handled or not a database error, pass to next handler
  if (res.headersSent || !err.code) {
    return next(err);
  }

  // PostgreSQL error codes
  const pgErrorCode = err.code;

  logger.error('Database error:', {
    code: pgErrorCode,
    message: err.message,
    detail: err.detail,
    table: err.table,
    constraint: err.constraint,
    path: req.path,
    method: req.method,
  });

  // Handle specific PostgreSQL error codes
  switch (pgErrorCode) {
    // Foreign key violation (23503)
    case '23503':
      return res.status(400).json({
        success: false,
        message: 'Invalid reference',
        error: extractForeignKeyError(err),
      });

    // Unique constraint violation (23505)
    case '23505':
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry',
        error: extractUniqueConstraintError(err),
      });

    // Not null violation (23502)
    case '23502':
      return res.status(400).json({
        success: false,
        message: 'Missing required field',
        error: `Field '${err.column}' is required`,
      });

    // Check constraint violation (23514)
    case '23514':
      return res.status(400).json({
        success: false,
        message: 'Invalid value',
        error: extractCheckConstraintError(err),
      });

    // Data type mismatch (22P02)
    case '22P02':
      return res.status(400).json({
        success: false,
        message: 'Invalid data type',
        error: 'One or more fields have invalid data types',
      });

    // Numeric value out of range (22003)
    case '22003':
      return res.status(400).json({
        success: false,
        message: 'Value out of range',
        error: 'Numeric value exceeds allowed range',
      });

    // String data too long (22001)
    case '22001':
      return res.status(400).json({
        success: false,
        message: 'Value too long',
        error: `Field '${err.column}' exceeds maximum length`,
      });

    // Connection errors
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
    case 'ETIMEDOUT':
      logger.error('Database connection error:', err);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: 'Unable to connect to database',
      });

    default:
      // Pass to next error handler for unhandled database errors
      return next(err);
  }
};

/**
 * Extract readable error message from foreign key violation
 */
function extractForeignKeyError(err: any): string {
  if (err.constraint) {
    // Extract referenced table from constraint name
    // Example: batch_enrollments_profile_id_fkey -> profile_id
    const match = err.constraint.match(/_([a-z_]+)_fkey$/);
    if (match) {
      const fieldName = match[1];
      return `Invalid ${fieldName.replace(/_/g, ' ')}. Referenced record does not exist.`;
    }
  }
  return err.detail || 'Referenced record does not exist';
}

/**
 * Extract readable error message from unique constraint violation
 */
function extractUniqueConstraintError(err: any): string {
  if (err.constraint) {
    // Example: profiles_mobile_number_key -> mobile_number
    const match = err.constraint.match(/_([a-z_]+)_(key|idx)$/);
    if (match) {
      const fieldName = match[1];
      return `${fieldName.replace(/_/g, ' ')} already exists`;
    }
  }
  return err.detail || 'Duplicate value detected';
}

/**
 * Extract readable error message from check constraint violation
 */
function extractCheckConstraintError(err: any): string {
  if (err.constraint) {
    // Example: profiles_gender_check -> gender
    const match = err.constraint.match(/_([a-z_]+)_check$/);
    if (match) {
      const fieldName = match[1];
      return `Invalid value for ${fieldName.replace(/_/g, ' ')}`;
    }
  }
  return err.detail || 'Value does not meet constraint requirements';
}
