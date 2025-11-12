// Role model - System roles and custom roles
export interface Role {
  id: number;
  role_name: string;
  role_code: string;
  description?: string;
  department?: string;
  hierarchy_level: number;
  access_level: 'full' | 'edit' | 'view' | 'limited';
  is_active: boolean;
  is_system_role: boolean;
  created_by_user_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface RolePermission {
  id: number;
  role_id: number;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_approve: boolean;
  can_verify: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: RolePermission[];
  active_users_count?: number;
}

export interface CreateRoleDto {
  role_name: string;
  description?: string;
  department?: string;
  hierarchy_level?: number;
  access_level?: 'full' | 'edit' | 'view' | 'limited';
  permissions: CreateRolePermissionDto[];
}

export interface CreateRolePermissionDto {
  module: string;
  can_view?: boolean;
  can_create?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_export?: boolean;
  can_approve?: boolean;
  can_verify?: boolean;
}

export interface UpdateRoleDto {
  role_name?: string;
  description?: string;
  department?: string;
  hierarchy_level?: number;
  access_level?: 'full' | 'edit' | 'view' | 'limited';
  is_active?: boolean;
  permissions?: CreateRolePermissionDto[];
}

// System modules for permission management
export const SYSTEM_MODULES = [
  'Dashboard',
  'Workers',
  'Employers',
  'Projects',
  'Training',
  'Verification',
  'Analytics',
  'Content Management',
  'AI Tools',
  'Notifications',
  'Roles',
  'Settings',
] as const;

export type SystemModule = (typeof SYSTEM_MODULES)[number];
