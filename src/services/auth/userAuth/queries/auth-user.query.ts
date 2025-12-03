import { UserResponse } from '@/types';
import { userService } from '@/services/admin';

export class AuthUserQuery {
  /**
   * Get current user by ID
   */
  static async getCurrentUser(userId: string): Promise<UserResponse | null> {
    return await userService.getUserById(userId);
  }
}
