import prisma from '@/config/prisma';
import { Role, RolePermission, RoleWithPermissions } from '@/types';

export class RoleBaseQuery {
  /**
   * Get all roles with optional filters
   */
  static async getAllRoles(filters?: {
    is_active?: boolean;
    include_permissions?: boolean;
  }): Promise<RoleWithPermissions[]> {
    const roles = await prisma.roles.findMany({
      where: {
        is_active: filters?.is_active,
      },
      include: {
        role_permissions: filters?.include_permissions ?? false,
        users: {
          where: { is_active: true },
          select: { id: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return roles.map((role) => ({
      ...role,
      permissions: role.role_permissions,
      active_users_count: role.users.length,
    }));
  }

  /**
   * Get role by ID with permissions
   */
  static async getRoleById(
    id: string,
    include_permissions = true
  ): Promise<RoleWithPermissions | null> {
    const role = await prisma.roles.findUnique({
      where: { id },
      include: {
        role_permissions: include_permissions,
        users: {
          where: { is_active: true },
          select: { id: true },
        },
      },
    });

    if (!role) {
      return null;
    }

    return {
      ...role,
      permissions: role.role_permissions,
      active_users_count: role.users.length,
    };
  }

  /**
   * Get role by name
   */
  static async getRoleByName(name: string): Promise<Role | null> {
    return prisma.roles.findUnique({
      where: { name },
    });
  }

  /**
   * Get role permissions
   */
  static async getRolePermissions(role_id: string): Promise<RolePermission[]> {
    return prisma.role_permissions.findMany({
      where: { role_id },
      orderBy: { module_name: 'asc' },
    });
  }

  /**
   * Get users assigned to a role
   */
  static async getRoleUsers(role_id: string): Promise<unknown[]> {
    return prisma.users.findMany({
      where: { role_id },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        is_active: true,
        last_login: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
