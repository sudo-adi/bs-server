import {
  CreateRolePermissionDto,
  CreateRoleWithPermissionsDto,
  Role,
  RolePermission,
  RoleWithPermissions,
  UpdateRoleDto,
} from '@/types';
import { RoleCreateOperation } from './operations/role-create.operation';
import { RoleDeleteOperation } from './operations/role-delete.operation';
import { RoleUpdateOperation } from './operations/role-update.operation';
import { RoleBaseQuery } from './queries/role-base.query';

export class RoleService {
  /**
   * Get all roles with optional filters
   */
  async getAllRoles(filters?: {
    is_active?: boolean;
    include_permissions?: boolean;
  }): Promise<RoleWithPermissions[]> {
    return RoleBaseQuery.getAllRoles(filters);
  }

  /**
   * Get role by ID with permissions
   */
  async getRoleById(id: string, include_permissions = true): Promise<RoleWithPermissions | null> {
    return RoleBaseQuery.getRoleById(id, include_permissions);
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    return RoleBaseQuery.getRoleByName(name);
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(role_id: string): Promise<RolePermission[]> {
    return RoleBaseQuery.getRolePermissions(role_id);
  }

  /**
   * Create a new role with permissions
   */
  async createRole(data: CreateRoleWithPermissionsDto): Promise<RoleWithPermissions> {
    return RoleCreateOperation.create(data);
  }

  /**
   * Update role and permissions
   */
  async updateRole(
    id: string,
    data: UpdateRoleDto & { permissions?: CreateRolePermissionDto[] }
  ): Promise<RoleWithPermissions> {
    return RoleUpdateOperation.update(id, data);
  }

  /**
   * Delete role (only if no users assigned)
   */
  async deleteRole(id: string): Promise<void> {
    return RoleDeleteOperation.delete(id);
  }

  /**
   * Get users assigned to a role
   */
  async getRoleUsers(role_id: string): Promise<unknown[]> {
    return RoleBaseQuery.getRoleUsers(role_id);
  }
}

export default new RoleService();
