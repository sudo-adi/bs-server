import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { User, UserResponse } from '@/models/admin/user.model';

export class UserQuery {
  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserResponse | null> {
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
  }

  /**
   * Get user by username (includes password hash for authentication)
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    const user = await prisma.users.findUnique({
      where: { username },
    });

    return user;
  }

  /**
   * Get all users with optional filters
   */
  static async getAllUsers(filters?: {
    is_active?: boolean;
    search?: string;
  }): Promise<UserResponse[]> {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  }
}
