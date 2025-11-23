import db from '@/config/database';

export class RolePermissionsQuery {
  /**
   * Check if user has specific permission
   */
  static async checkPermission(
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
    const result = await db.query(
      `SELECT rp.${action}
       FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id
       WHERE u.id = $1 AND rp.module = $2`,
      [user_id, module]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0][action] === true;
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(
    user_id: number
  ): Promise<Record<string, Record<string, boolean>>> {
    const result = await db.query(
      `SELECT rp.*
       FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id
       WHERE u.id = $1`,
      [user_id]
    );

    const permissions: Record<string, Record<string, boolean>> = {};

    for (const row of result.rows) {
      permissions[row.module] = {
        can_view: row.can_view,
        can_create: row.can_create,
        can_edit: row.can_edit,
        can_delete: row.can_delete,
        can_export: row.can_export,
        can_approve: row.can_approve,
        can_verify: row.can_verify,
      };
    }

    return permissions;
  }
}
