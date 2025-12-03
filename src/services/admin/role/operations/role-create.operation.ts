import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { CreateRoleWithPermissionsDto, RoleWithPermissions } from '@/types';

export class RoleCreateOperation {
  /**
   * Create a new role with permissions
   */
  static async create(data: CreateRoleWithPermissionsDto): Promise<RoleWithPermissions> {
    // Check if role name already exists
    const existing = await prisma.roles.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError('Role name already exists', 400);
    }

    // Create role with permissions in a transaction
    const role = await prisma.roles.create({
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active ?? true,
        role_permissions: data.permissions
          ? {
              create: data.permissions.map((perm) => ({
                module_name: perm.module_name,
                can_view: perm.can_view ?? false,
                can_manage: perm.can_manage ?? false,
                can_export: perm.can_export ?? false,
                is_super_admin: perm.is_super_admin ?? false,
              })),
            }
          : undefined,
      },
      include: {
        role_permissions: true,
      },
    });

    return {
      ...role,
      permissions: role.role_permissions,
    };
  }
}
