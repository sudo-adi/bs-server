import { AppError } from '@/middlewares/errorHandler';
import catchAsync from '@/utils/catchAsync';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate worker JWT tokens
 * Validates token and attaches user info to request
 */
export const authenticateWorker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        profileId: string;
        phone: string;
        type: string;
      };

      // Check if it's a worker token
      if (decoded.type !== 'worker') {
        throw new AppError('Invalid token type', 403);
      }

      // Attach user info to request (map to the existing user structure)
      req.user = {
        id: decoded.profileId,
        email: decoded.phone, // Use phone as email since workers don't have email
        username: decoded.phone,
        profileId: decoded.profileId,
        phone: decoded.phone,
        type: decoded.type,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired, please login again', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      throw error;
    }
  }
);
