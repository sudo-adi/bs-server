import {
  CreateRoleDto,
  Role,
  RolePermission,
  RoleWithPermissions,
  UpdateRoleDto,
} from '@/models/admin/role.model';
import { RoleCreateOperation } from './operations/role-create.operation';
import { RoleDeleteOperation } from './operations/role-delete.operation';
import { RoleUpdateOperation } from './operations/role-update.operation';
import { RoleBaseQuery } from './queries/role-base.query';
import { RolePermissionsQuery } from './queries/role-permissions.query';

export class RoleService {
  /**
   * Get all roles with optional filters
   */
  async getAllRoles(filters?: {
    is_active?: boolean;
    department?: string;
    include_permissions?: boolean;
  }): Promise<RoleWithPermissions[]> {
    return RoleBaseQuery.getAllRoles(filters);
  }

  /**
   * Get role by ID with permissions
   */
  async getRoleById(id: number, include_permissions = true): Promise<RoleWithPermissions | null> {
    return RoleBaseQuery.getRoleById(id, include_permissions);
  }

  /**
   * Get role by code
   */
  async getRoleByCode(role_code: string): Promise<Role | null> {
    return RoleBaseQuery.getRoleByCode(role_code);
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(role_id: number): Promise<RolePermission[]> {
    return RoleBaseQuery.getRolePermissions(role_id);
  }

  /**
   * Create a new role with permissions
   */
  async createRole(data: CreateRoleDto, created_by_user_id: number): Promise<RoleWithPermissions> {
    return RoleCreateOperation.create(data, created_by_user_id);
  }

  /**
   * Update role and permissions
   */
  async updateRole(id: number, data: UpdateRoleDto): Promise<RoleWithPermissions> {
    return RoleUpdateOperation.update(id, data);
  }

  /**
   * Delete role (only if no users assigned and not system role)
   */
  async deleteRole(id: number): Promise<void> {
    return RoleDeleteOperation.delete(id);
  }

  /**
   * Get users assigned to a role
   */
  async getRoleUsers(role_id: number): Promise<unknown[]> {
    return RoleBaseQuery.getRoleUsers(role_id);
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(
    user_id: number,
    module: string,
    action:
      | 'can_view'
      | 'can_create'
      | 'can_edit'
      | 'can_delete'
      | 'can_export'
      | 'can_approve'
      | 'can_verify'
  ): Promise<boolean> {
    return RolePermissionsQuery.checkPermission(user_id, module, action);
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(user_id: number): Promise<Record<string, Record<string, boolean>>> {
    return RolePermissionsQuery.getUserPermissions(user_id);
  }
}

export default new RoleService();
