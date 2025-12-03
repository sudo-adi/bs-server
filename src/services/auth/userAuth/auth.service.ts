import { UserResponse } from '@/types';
import { AuthLoginOperation } from './operations/auth-login.operation';
import { AuthTokenOperation } from './operations/auth-token.operation';
import { AuthUserQuery } from './queries/auth-user.query';

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
    return AuthTokenOperation.generateToken(payload);
  }

  verifyToken(token: string): JwtPayload {
    return AuthTokenOperation.verifyToken(token);
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    return AuthLoginOperation.login(username, password);
  }

  async getCurrentUser(userId: string): Promise<UserResponse | null> {
    return AuthUserQuery.getCurrentUser(userId);
  }
}

export default new AuthService();
