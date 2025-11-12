import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { CreateUserDto, UpdateUserDto, User, UserResponse } from '@/models/admin/user.model';
import bcrypt from 'bcrypt';

export class UserService {
  private readonly SALT_ROUNDS = 10;

  /**
   * Create a new user
   */
  async createUser(data: CreateUserDto): Promise<UserResponse> {
    try {
      // Check if username or email already exists
      const existing = await prisma.users.findFirst({
        where: {
          OR: [{ username: data.username }, { email: data.email }],
        },
      });

      if (existing) {
        throw new AppError('Username or email already exists', 400);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Create user using Prisma
      const user = await prisma.users.create({
        data: {
          username: data.username,
          email: data.email,
          password_hash: passwordHash,
          full_name: data.full_name,
          phone: data.phone_number,
          role_id: data.role_id,
          is_active: data.is_active ?? true,
        },
      });

      // Return user without password hash
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...userResponse } = user;
      return userResponse;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new AppError('Username or email already exists', 400);
        }
      }
      throw new AppError('Failed to create user', 500);
    }
  }

  /**
   * Get user by ID
   * Note: Roles/user_roles tables not yet in Prisma schema
   */
  async getUserById(id: string): Promise<UserResponse | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      // Return user without password hash
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        role: user.role || undefined,
      } as any;
    } catch (error) {
      throw new AppError('Failed to fetch user', 500);
    }
  }

  /**
   * Get user by username (includes password hash for authentication)
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { username },
      });

      return user;
    } catch (error) {
      throw new AppError('Failed to fetch user', 500);
    }
  }

  /**
   * Get all users with optional filters
   */
  async getAllUsers(filters?: { is_active?: boolean; search?: string }): Promise<UserResponse[]> {
    try {
      const where: Prisma.usersWhereInput = {};

      // Add is_active filter
      if (filters?.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      // Add search filter
      if (filters?.search) {
        where.OR = [
          { full_name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { username: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const users = await prisma.users.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      // Return users without password hash and with user_roles array format
      return users.map(({ password_hash, role, ...user }) => ({
        ...user,
        user_roles: role
          ? [
              {
                role_id: role.id,
                role_name: role.name,
                role_code: role.name.toLowerCase().replace(/\s+/g, '_'),
              },
            ]
          : [],
      })) as any;
    } catch (error) {
      throw new AppError('Failed to fetch users', 500);
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponse> {
    try {
      // Check if user exists
      const existingUser = await prisma.users.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      // Check for unique constraint violations if email or username is being updated
      if (data.email || data.username) {
        const conflictingUser = await prisma.users.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  data.email ? { email: data.email } : {},
                  data.username ? { username: data.username } : {},
                ],
              },
            ],
          },
        });

        if (conflictingUser) {
          throw new AppError('Username or email already exists', 400);
        }
      }

      // Update user
      const updatedUser = await prisma.users.update({
        where: { id },
        data: {
          email: data.email,
          username: data.username,
          full_name: data.full_name,
          phone: data.phone_number,
          role_id: data.role_id,
          is_active: data.is_active,
          last_login: data.last_login,
        },
      });

      // Return user without password hash
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...userResponse } = updatedUser;
      return userResponse;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new AppError('Username or email already exists', 400);
        }
        if (error.code === 'P2025') {
          throw new AppError('User not found', 404);
        }
      }
      throw new AppError('Failed to update user', 500);
    }
  }

  /**
   * Change user password
   * Note: This replaces the old changeUserRole method as roles are not in current schema
   */

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user with password
      const user = await prisma.users.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, user.password_hash);

      if (!isValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      await prisma.users.update({
        where: { id },
        data: { password_hash: newPasswordHash },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to change password', 500);
    }
  }

  /**
   * Delete user (soft delete)
   * Instead of hard deleting, we set is_active to false to prevent foreign key constraint violations
   */
  async deleteUser(id: string): Promise<void> {
    try {
      // Check if user exists
      const user = await prisma.users.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Soft delete: set is_active to false
      await prisma.users.update({
        where: { id },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError('User not found', 404);
        }
      }
      throw new AppError('Failed to delete user', 500);
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await prisma.users.update({
        where: { id },
        data: { last_login: new Date() },
      });
    } catch (error) {
      throw new AppError('Failed to update last login', 500);
    }
  }

  /**
   * Verify password for authentication
   */
  async verifyPassword(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByUsername(username);

      if (!user) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }
}

export default new UserService();
