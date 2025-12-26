// Role and permission type definitions
// Based on ProfileRole and ProfileRolePermission models

// Available module names in the system
export type ModuleName =
  | 'workers'
  | 'candidates'
  | 'projects'
  | 'trainings'
  | 'employers'
  | 'admin'
  | 'settings'
  | 'reports'
  | 'notifications'
  | 'documents'
  | 'calendar';

// Role permission interface matching the database schema
export interface RolePermission {
  id: string;
  role_id: string;
  module_name: ModuleName;
  can_view: boolean;
  can_manage: boolean;
  can_export: boolean;
  is_super_admin: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PermissionCreate {
  module_name: string;
  can_view?: boolean;
  can_manage?: boolean;
  can_export?: boolean;
  is_super_admin?: boolean;
}

export interface PermissionUpdate extends Partial<PermissionCreate> {}

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean | null;
  permissions: RolePermission[];
}
