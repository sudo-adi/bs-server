import prisma from '@/config/prisma';
import { Role, UpdateRoleInput } from '@/types/role.types';

export class RoleUpdateOperation {
  static async update(id: string, input: UpdateRoleInput): Promise<Role> {
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
}
