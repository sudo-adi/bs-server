import { env } from '@/config/env';
import { AuthUser } from '@/dtos/auth/auth.dto';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * JWT Payload structure for tokens
 *
 * User Types:
 * - profile: stored in Profile table (candidates and workers)
 * - employer: stored in Employer table
 *
 * Profile Types (for userType='profile'):
 * - candidate: not yet a worker
 * - worker: active worker
 *
 * Worker Types (for profileType='worker'):
 * - blue: blue collar worker
 * - white: white collar worker (super admin is in this category)
 * - trainer: training personnel
 */
interface JwtPayload {
  id: string;
  phone?: string;
  email?: string;
  userType: 'profile' | 'employer';
  // Profile-specific fields
  profileType?: 'candidate' | 'worker';
  workerType?: 'blue' | 'white' | 'trainer';
  candidateCode?: string;
  workerCode?: string;
  currentStage?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  firstName?: string;
  lastName?: string;
  // Employer-specific fields
  companyName?: string;
  employerCode?: string;
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user info to request
 */
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

    // Build AuthUser from token payload
    const authUser: AuthUser = {
      id: decoded.id,
      phone: decoded.phone,
      email: decoded.email,
      userType: decoded.userType || 'profile',
      profileType: decoded.profileType,
      workerType: decoded.workerType,
      candidateCode: decoded.candidateCode,
      workerCode: decoded.workerCode,
      currentStage: decoded.currentStage,
      isActive: decoded.isActive,
      isAdmin: decoded.isAdmin,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      companyName: decoded.companyName,
      employerCode: decoded.employerCode,
    };

    // Attach to request
    req.user = authUser;

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

/**
 * Middleware to ensure only employers can access
 */
export const employerOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'employer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Employer access only.',
    });
  }
  next();
};

/**
 * Middleware to ensure only profiles (candidates/workers) can access
 */
export const profileOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'profile') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Profile access only.',
    });
  }
  next();
};

/**
 * Middleware to ensure only workers (profileType=worker) can access
 */
export const workerOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'profile' || req.user?.profileType !== 'worker') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Worker access only.',
    });
  }
  next();
};

/**
 * Middleware to ensure only candidates can access
 */
export const candidateOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'profile' || req.user?.profileType !== 'candidate') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Candidate access only.',
    });
  }
  next();
};

/**
 * Middleware to ensure only white collar workers can access
 */
export const whiteCollarOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'profile' || req.user?.workerType !== 'white') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. White collar access only.',
    });
  }
  next();
};

/**
 * Middleware to ensure only blue collar workers can access
 */
export const blueCollarOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'profile' || req.user?.workerType !== 'blue') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Blue collar access only.',
    });
  }
  next();
};

/**
 * Middleware to ensure only trainers can access
 */
export const trainerOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'profile' || req.user?.workerType !== 'trainer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Trainer access only.',
    });
  }
  next();
};

/**
 * Middleware to ensure only super admins can access
 * Super admin = white collar worker with isAdmin=true
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.user?.userType !== 'profile' ||
    req.user?.workerType !== 'white' ||
    !req.user?.isAdmin
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access only.',
    });
  }
  next();
};

/**
 * Middleware to allow white collar workers OR admins (staff)
 */
export const staffOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'profile' || req.user?.workerType !== 'white') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff access only.',
    });
  }
  next();
};

// Alias for backwards compatibility
export const internalOnly = staffOnly;
