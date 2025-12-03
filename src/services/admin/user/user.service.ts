import { CreateUserDto, UpdateUserDto, User, UserResponse } from '@/types';
import { UserChangePasswordOperation } from './operations/user-change-password.operation';
import { UserCreateOperation } from './operations/user-create.operation';
import { UserDeleteOperation } from './operations/user-delete.operation';
import { UserUpdateOperation } from './operations/user-update.operation';
import { UserVerifyPasswordOperation } from './operations/user-verify-password.operation';
import { UserQuery } from './queries/user.query';

export class UserService {
  // ============================================================================
  // QUERIES
  // ============================================================================

  async getUserById(id: string): Promise<UserResponse | null> {
    return UserQuery.getUserById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return UserQuery.getUserByUsername(username);
  }

  async getAllUsers(filters?: { is_active?: boolean; search?: string }): Promise<UserResponse[]> {
    return UserQuery.getAllUsers(filters);
  }

  // ============================================================================
  // CREATE, UPDATE, DELETE OPERATIONS
  // ============================================================================

  async createUser(data: CreateUserDto): Promise<UserResponse> {
    return UserCreateOperation.create(data);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponse> {
    return UserUpdateOperation.update(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    return UserDeleteOperation.delete(id);
  }

  // ============================================================================
  // AUTHENTICATION & PASSWORD
  // ============================================================================

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    return UserChangePasswordOperation.changePassword(id, oldPassword, newPassword);
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    return UserVerifyPasswordOperation.verify(username, password);
  }

  async updateLastLogin(id: string): Promise<void> {
    return UserVerifyPasswordOperation.updateLastLogin(id);
  }
}

export default new UserService();
