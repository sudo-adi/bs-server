import { AppError } from '@/middlewares/errorHandler';
import candidateAuthService from '@/services/candidate/candidateAuth.service';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to protect candidate routes
 * Verifies JWT token and attaches profileId to request
 */
export const candidateAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided. Please login.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = candidateAuthService.verifyToken(token);

    // Attach profileId to request for use in controllers
    (req as any).profileId = decoded.profileId;
    (req as any).phone = decoded.phone;
    (req as any).userType = 'candidate';

    next();
  } catch (error) {
    next(error);
  }
};
