import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import { UserResponse } from '@/models/admin/user.model';
import jwt from 'jsonwebtoken';
import userService from '../admin/user.service';

interface JwtPayload {
  userId: string;
  username: string;
  type: 'user' | 'employer' | 'candidate';
}

interface AuthResponse {
  user: UserResponse;
  token: string;
}

export class AuthService {
  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  async login(username: string, password: string): Promise<AuthResponse> {
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
    const token = this.generateToken({
      userId: user.id,
      username: user.username,
      type: 'user', // Admin users are type 'user'
    });

    return {
      user,
      token,
    };
  }

  async getCurrentUser(userId: string): Promise<UserResponse | null> {
    return await userService.getUserById(userId);
  }
}

export default new AuthService();
