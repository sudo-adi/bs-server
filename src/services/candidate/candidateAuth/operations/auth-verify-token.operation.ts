import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import jwt from 'jsonwebtoken';

interface CandidateJwtPayload {
  profileId: string;
  phone: string;
  type: 'candidate';
}

export class AuthVerifyTokenOperation {
  /**
   * Verify JWT token and return profile
   */
  static verifyToken(token: string): CandidateJwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as CandidateJwtPayload;

      // Ensure it's a candidate token
      if (decoded.type !== 'candidate') {
        throw new AppError('Invalid token type', 401);
      }

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token has expired. Please login again.', 401);
      }
      throw new AppError('Invalid token', 401);
    }
  }
}
