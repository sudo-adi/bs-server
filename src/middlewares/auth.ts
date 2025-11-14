import { env } from '@/config/env';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId?: string; // Changed from number to string for UUID support
  employerId?: number;
  profileId?: number;
  email?: string;
  mobile_number?: string;
  username?: string; // Added username field
  type: 'user' | 'employer' | 'candidate';
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string; // Changed from number to string for UUID support
      employerId?: number;
      profileId?: number;
      userType?: 'user' | 'employer' | 'candidate';
      user?: {
        id: string;
        username: string;
        email: string;
        role_id?: string;
        // Worker portal fields
        profileId?: string;
        phone?: string;
        type?: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Attach user info to request based on type
    if (decoded.type === 'employer') {
      req.employerId = decoded.employerId;
    } else if (decoded.type === 'candidate') {
      req.profileId = decoded.profileId;
    } else {
      req.userId = decoded.userId;
      // Also set req.user for permission middleware
      if (decoded.userId) {
        req.user = {
          id: decoded.userId,
          username: decoded.username || '',
          email: decoded.email || '',
          role_id: undefined,
        };
      }
    }
    req.userType = decoded.type;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token expired',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

// Middleware to ensure only employers can access
export const employerOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.userType !== 'employer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Employer access only.',
    });
  }
  next();
};

// Middleware to ensure only users (staff) can access
export const userOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.userType !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff access only.',
    });
  }
  next();
};

// Middleware to ensure only candidates can access
export const candidateOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.userType !== 'candidate') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Candidate access only.',
    });
  }
  next();
};
