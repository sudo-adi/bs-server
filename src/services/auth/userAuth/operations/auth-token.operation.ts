import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  username: string;
  type: 'user' | 'employer' | 'candidate';
}

export class AuthTokenOperation {
  /**
   * Generate JWT token
   */
  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}
