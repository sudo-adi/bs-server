export interface RolePermission {
  id: string;
  role_id: string;
  module_name: string;
  can_view: boolean;
  can_manage: boolean;
  can_export: boolean;
  is_super_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  permissions?: RolePermission[];
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  is_active?: boolean;
  permissions: CreatePermissionInput[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  is_active?: boolean;
  permissions?: UpdatePermissionInput[];
}

export interface CreatePermissionInput {
  module_name: string;
  can_view: boolean;
  can_manage: boolean;
  can_export: boolean;
  is_super_admin?: boolean;
}

export interface UpdatePermissionInput {
  id?: string;
  module_name: string;
  can_view: boolean;
  can_manage: boolean;
  can_export: boolean;
  is_super_admin?: boolean;
}

export interface UserWithRole {
  id: string;
  username: string;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  is_active?: boolean | null;
  role_id?: string | null;
  role?: Role | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface PermissionCheck {
  module: string;
  action: 'view' | 'manage' | 'export';
}

export type ModuleName =
  | 'workers'
  | 'candidates'
  | 'projects'
  | 'trainings'
  | 'attendance'
  | 'analytics'
  | 'ai_tools'
  | 'notifications'
  | 'content_management'
  | 'users_roles';

export const ALL_MODULES: ModuleName[] = [
  'workers',
  'candidates',
  'projects',
  'trainings',
  'attendance',
  'analytics',
  'ai_tools',
  'notifications',
  'content_management',
  'users_roles',
];
