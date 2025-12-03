import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { CreateRolePermissionDto, RoleWithPermissions, UpdateRoleDto } from '@/types';

export class RoleUpdateOperation {
  /**
   * Update role and permissions
   */
  static async update(
    id: string,
    data: UpdateRoleDto & { permissions?: CreateRolePermissionDto[] }
  ): Promise<RoleWithPermissions> {
    // Check if role exists
    const existing = await prisma.roles.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Role not found', 404);
    }

    // Update role with permissions
    const role = await prisma.roles.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active,
        role_permissions: data.permissions
          ? {
              deleteMany: {}, // Delete existing permissions
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
