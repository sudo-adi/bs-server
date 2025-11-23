import prisma from '@/config/prisma';
import { ModuleName, RolePermission } from '@/types/role.types';

export class PermissionQuery {
  static async checkPermission(
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

  static async getUserPermissions(userId: string): Promise<RolePermission[]> {
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

  static async isSuperAdmin(userId: string): Promise<boolean> {
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
}
