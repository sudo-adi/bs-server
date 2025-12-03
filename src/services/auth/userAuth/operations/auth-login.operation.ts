import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import { UserResponse } from '@/types';
import { userService } from '@/services/admin';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  username: string;
  type: 'user' | 'employer' | 'candidate';
}

interface AuthResponse {
  user: UserResponse;
  token: string;
}

export class AuthLoginOperation {
  /**
   * Login user with username and password
   */
  static async login(username: string, password: string): Promise<AuthResponse> {
    // Verify credentials
    const user = await userService.verifyPassword(username, password);

    if (!user) {
      throw new AppError('Invalid username or password', 401);
    }

    if (!user.is_active) {
      throw new AppError('User account is inactive', 403);
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        type: 'user', // Admin users are type 'user'
      } as JwtPayload,
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user,
      token,
    };
  }
}
