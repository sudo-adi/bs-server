import {
  CreateRoleInput,
  ModuleName,
  Role,
  RolePermission,
  UpdateRoleInput,
} from '@/types/role.types';
import { RoleAssignmentOperation } from './operations/role-assignment.operation';
import { RoleCreateOperation } from './operations/role-create.operation';
import { RoleDeleteOperation } from './operations/role-delete.operation';
import { RoleUpdateOperation } from './operations/role-update.operation';
import { PermissionQuery } from './queries/permission.query';
import { RoleQuery } from './queries/role.query';

export class RolePermissionService {
  // ============================================================================
  // ROLE QUERIES
  // ============================================================================

  async getAllRoles(): Promise<Role[]> {
    return RoleQuery.getAllRoles();
  }

  async getActiveRoles(): Promise<Role[]> {
    return RoleQuery.getActiveRoles();
  }

  async getRoleById(id: string): Promise<Role | null> {
    return RoleQuery.getRoleById(id);
  }

  async getRoleByName(name: string): Promise<Role | null> {
    return RoleQuery.getRoleByName(name);
  }

  async getUsersByRole(roleId: string) {
    return RoleQuery.getUsersByRole(roleId);
  }

  // ============================================================================
  // ROLE OPERATIONS
  // ============================================================================

  async createRole(input: CreateRoleInput): Promise<Role> {
    return RoleCreateOperation.create(input);
  }

  async updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
    return RoleUpdateOperation.update(id, input);
  }

  async deleteRole(id: string): Promise<void> {
    return RoleDeleteOperation.delete(id);
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    return RoleAssignmentOperation.assignRoleToUser(userId, roleId);
  }

  async removeRoleFromUser(userId: string): Promise<void> {
    return RoleAssignmentOperation.removeRoleFromUser(userId);
  }

  // ============================================================================
  // PERMISSION QUERIES
  // ============================================================================

  async checkPermission(
    userId: string,
    moduleName: ModuleName,
    action: 'view' | 'manage' | 'export'
  ): Promise<boolean> {
    return PermissionQuery.checkPermission(userId, moduleName, action);
  }

  async getUserPermissions(userId: string): Promise<RolePermission[]> {
    return PermissionQuery.getUserPermissions(userId);
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    return PermissionQuery.isSuperAdmin(userId);
  }
}

export default new RolePermissionService();
