/**
 * Role DTOs
 */

// ==================== CREATE ====================

export interface CreateRoleDto {
  name: string;
  description?: string;
  isActive?: boolean;
  permissions?: CreateRolePermissionDto[];
}

export interface CreateRolePermissionDto {
  moduleName: string;
  canView?: boolean;
  canManage?: boolean;
  canExport?: boolean;
  isSuperAdmin?: boolean;
}

export interface AssignRoleDto {
  profileId: string;
  roleId: string;
}

// ==================== UPDATE ====================

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRolePermissionDto {
  canView?: boolean;
  canManage?: boolean;
  canExport?: boolean;
  isSuperAdmin?: boolean;
}

// ==================== RESPONSE ====================

export interface RolePermissionResponse {
  id: string;
  roleId: string | null;
  moduleName: string | null;
  canView: boolean | null;
  canManage: boolean | null;
  canExport: boolean | null;
  isSuperAdmin: boolean | null;
}

export interface RoleResponse {
  id: string;
  name: string | null;
  description: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  permissions?: RolePermissionResponse[];
  _count?: {
    assignments: number;
  };
}

export interface RoleAssignmentResponse {
  id: string;
  profileId: string | null;
  roleId: string | null;
  assignedAt: Date | null;
  assignedByProfileId: string | null;
  revokedAt: Date | null;
  revokedByProfileId: string | null;
  role?: RoleResponse | null;
  profile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

// ==================== QUERY ====================

export interface RoleListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
