import type { Role, RolePermission } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO, WithRelations } from '@/types/shared';

export type CreateRoleDto = CreateDTO<Role>;
export type UpdateRoleDto = UpdateDTO<Role>;

export type CreateRolePermissionDto = CreateDTO<RolePermission, 'role_id'>;
export type UpdateRolePermissionDto = UpdateDTO<RolePermission>;

export type RoleWithPermissions = WithRelations<
  Role,
  {
    permissions?: RolePermission[];
  }
> & {
  active_users_count?: number;
};

export type CreateRoleWithPermissionsDto = CreateRoleDto & {
  permissions?: CreateRolePermissionDto[];
};
