/**
 * Admin Services Index
 * Central export point for all admin-related services
 */

export { default as activityLogService } from './activityLog/activityLog.service';
export { default as roleService } from './role/role.service';
export { default as rolePermissionService } from './rolePermission/rolePermission.service';
export { default as userService } from './user/user.service';

// Export service classes if needed for type definitions
export { ActivityLogService } from './activityLog/activityLog.service';
export { RoleService } from './role/role.service';
export { RolePermissionService } from './rolePermission/rolePermission.service';
export { UserService } from './user/user.service';

// Export query params types
export type { ActivityLogQueryParams } from './activityLog/queries/activity-log.query';
