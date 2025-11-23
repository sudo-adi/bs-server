import prisma from '@/config/prisma';
import { CreateRoleInput, Role } from '@/types/role.types';

export class RoleCreateOperation {
  static async create(input: CreateRoleInput): Promise<Role> {
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
}
