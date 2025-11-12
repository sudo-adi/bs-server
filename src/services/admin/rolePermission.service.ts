import { prisma } from '../../config/prisma';
import {
  CreateRoleInput,
  ModuleName,
  Role,
  RolePermission,
  UpdateRoleInput,
} from '../../types/role.types';

export class RolePermissionService {
  /**
   * Get all roles with their permissions
   */
  async getAllRoles(): Promise<Role[]> {
    const roles = await prisma.roles.findMany({
      include: {
        permissions: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return roles as Role[];
  }

  /**
   * Get active roles only
   */
  async getActiveRoles(): Promise<Role[]> {
    const roles = await prisma.roles.findMany({
      where: {
        is_active: true,
      },
      include: {
        permissions: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return roles as Role[];
  }

  /**
   * Get role by ID with permissions
   */
  async getRoleById(id: string): Promise<Role | null> {
    const role = await prisma.roles.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });
    return role as Role | null;
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    const role = await prisma.roles.findUnique({
      where: { name },
      include: {
        permissions: true,
      },
    });
    return role as Role | null;
  }

  /**
   * Create a new role with permissions
   */
  async createRole(input: CreateRoleInput): Promise<Role> {
    const role = await prisma.roles.create({
      data: {
        name: input.name,
        description: input.description,
        is_active: input.is_active ?? true,
        permissions: {
          create: input.permissions.map((perm) => ({
            module_name: perm.module_name,
            can_view: perm.can_view,
            can_manage: perm.can_manage,
            can_export: perm.can_export,
            is_super_admin: perm.is_super_admin ?? false,
          })),
        },
      },
      include: {
        permissions: true,
      },
    });
    return role as Role;
  }

  /**
   * Update role and its permissions
   */
  async updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
    // If permissions are provided, update them
    if (input.permissions) {
      // Delete existing permissions
      await prisma.role_permissions.deleteMany({
        where: { role_id: id },
      });

      // Create new permissions
      await prisma.role_permissions.createMany({
        data: input.permissions.map((perm) => ({
          role_id: id,
          module_name: perm.module_name,
          can_view: perm.can_view,
          can_manage: perm.can_manage,
          can_export: perm.can_export,
          is_super_admin: perm.is_super_admin ?? false,
        })),
      });
    }

    // Update role details
    const role = await prisma.roles.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        is_active: input.is_active,
      },
      include: {
        permissions: true,
      },
    });

    return role as Role;
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<void> {
    await prisma.roles.delete({
      where: { id },
    });
  }

  /**
   * Check if user has permission for a module and action
   */
  async checkPermission(
    userId: string,
    moduleName: ModuleName,
    action: 'view' | 'manage' | 'export'
  ): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.role || !user.role.is_active) {
      return false;
    }

    const permission = user.role.permissions?.find((p) => p.module_name === moduleName);

    if (!permission) {
      return false;
    }

    // Super admin has all permissions
    if (permission.is_super_admin) {
      return true;
    }

    // Check specific permission
    switch (action) {
      case 'view':
        return permission.can_view;
      case 'manage':
        return permission.can_manage;
      case 'export':
        return permission.can_export;
      default:
        return false;
    }
  }

  /**
   * Get user permissions for all modules
   */
  async getUserPermissions(userId: string): Promise<RolePermission[]> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    return (user?.role?.permissions as RolePermission[]) || [];
  }

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.role) {
      return false;
    }

    // Check if any permission has super admin flag
    return user.role.permissions?.some((p) => p.is_super_admin) || false;
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: {
        role_id: roleId,
      },
    });
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: {
        role_id: null,
      },
    });
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleId: string) {
    const users = await prisma.users.findMany({
      where: {
        role_id: roleId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        is_active: true,
        created_at: true,
      },
    });
    return users;
  }
}

export const rolePermissionService = new RolePermissionService();
